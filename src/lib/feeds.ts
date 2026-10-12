import Parser from "rss-parser";
import { createHash } from "node:crypto";
import { scoreItem } from "./impact.js";
import { keywordClassify, needsGemini } from "./classify.js";
import { clusterItems } from "./cluster.js";
import type { ClusterSeed } from "./cluster.js";
import { GEMINI_BATCH, GEMINI_MAX_PER_CYCLE, geminiClassifyBatch } from "./gemini.js";
import type { GeminiInput } from "./gemini.js";
import { getItemsByIds, getRecent, itemId, pruneOld, upsertItems } from "./db/items.js";
import type { NewsItem } from "./types.js";

let lastPrune = 0;

export interface FeedDef {
  name: string;
  url: string;
}

export const FEEDS: FeedDef[] = [
  { name: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=geopolitics+OR+diplomacy+OR+sanctions+when:1d"
  },
  { name: "Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "DW", url: "https://rss.dw.com/rdf/rss-en-world" },
  { name: "NPR", url: "https://feeds.npr.org/1004/rss.xml" },
  { name: "The Hindu", url: "https://www.thehindu.com/news/international/feeder/default.rss" },
  { name: "Indian Express", url: "https://indianexpress.com/section/world/feed/" },
  { name: "Times of India", url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms" }
];

const parser = new Parser({ timeout: 5000 });

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Common words that carry no story identity; excluded from similarity.
// Includes outlet boilerplate (e.g. Inshorts' "Tap to know more") that
// otherwise merges unrelated stories from the same outlet.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
  "as", "at", "by", "from", "over", "after", "amid", "says", "say",
  "new", "latest", "live", "updates", "update", "breaking", "world",
  "news", "report", "reports", "what", "why", "how", "will", "its",
  "tap", "know", "more", "inshorts", "watch"
]);

function titleTokens(t: string): Set<string> {
  return new Set(
    normalizeTitle(t)
      .split(" ")
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/** Overlap coefficient: shared tokens / smaller set. 1 = one title's words are all in the other. */
export function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let shared = 0;
  for (const w of small) if (big.has(w)) shared++;
  return shared / small.size;
}

/** Drop near-duplicate headlines (same story, different wording/source). Keeps newest. */
export function dedupeItems(items: NewsItem[], threshold = 0.6): NewsItem[] {
  const sorted = [...items].sort((a, b) => b.published.getTime() - a.published.getTime());
  const kept: NewsItem[] = [];
  for (const item of sorted) {
    if (!normalizeTitle(item.title)) continue;
    let dup = false;
    for (const prev of kept) {
      if (titleSimilarity(item.title, prev.title) >= threshold) {
        dup = true;
        break;
      }
    }
    if (!dup) kept.push(item);
  }
  return kept;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("feed timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

const snippets = new WeakMap<NewsItem, string>();

async function fetchOne(feed: FeedDef): Promise<NewsItem[]> {
  const data = await withTimeout(parser.parseURL(feed.url), 5000);
  const items = Array.isArray(data.items) ? data.items : [];
  const out: NewsItem[] = [];
  for (const it of items) {
    try {
      const rawTitle = typeof it.title === "string" ? it.title.trim() : "";
      if (!rawTitle) continue;
      const title = rawTitle.replace(/\s+/g, " ");
      const link = typeof it.link === "string" ? it.link : "";
      let published = new Date();
      if (typeof it.pubDate === "string" && it.pubDate) {
        const d = new Date(it.pubDate);
        if (!Number.isNaN(d.getTime())) published = d;
      } else if (typeof it.isoDate === "string" && it.isoDate) {
        const d = new Date(it.isoDate);
        if (!Number.isNaN(d.getTime())) published = d;
      }
      const snippet = typeof it.contentSnippet === "string" ? it.contentSnippet : "";
      const verdict = keywordClassify(title, snippet);
      const item: NewsItem = {
        title,
        source: feed.name,
        link,
        published,
        region: verdict.region,
        impact: scoreItem(title),
        fetched_at: new Date(),
        classified_by: "keyword",
      };
      snippets.set(item, snippet);
      out.push(item);
    } catch {
      continue;
    }
  }
  return out;
}

function snippetOf(item: NewsItem): string {
  return snippets.get(item) ?? "";
}

export async function fetchFeeds(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(FEEDS.map((f) => fetchOne(f)));
  const all: NewsItem[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      for (const n of r.value) all.push(n);
    }
  }
  if (all.length === 0) {
    throw new Error("all feeds failed");
  }
  const now = new Date();
  let enriched: NewsItem[];
  try {
    enriched = await enrichItems(all, now);
  } catch {
    // Storage/Gemini must never break the feed: fall back to keyword-only dedup.
    enriched = dedupeItems(all).map((it) => ({ ...it, fetched_at: now, classified_by: it.classified_by ?? "keyword" as const }));
  }
  return enriched.slice(0, 80);
}

/**
 * Hybrid pipeline: keyword pass (done in fetchOne) -> Gemini pass for
 * ambiguous items -> 48h Jaccard clustering -> DB upsert + hourly prune.
 * Never throws: every fallible step degrades to the keyword result.
 * Exported for tests (same path fetchFeeds uses, without network).
 */
export async function enrichItems(raw: NewsItem[], now: Date = new Date()): Promise<NewsItem[]> {
  const fetchedMs = now.getTime();

  // Attach stable ids; reuse stored classification (never re-classify).
  const ids = raw.map((it) => itemId(it.title, it.source));
  let stored = new Map<string, {
    region: string | null; severity: number | null; summary: string | null;
    classified_by: string | null; cluster_id: string | null;
  }>();
  try {
    stored = await getItemsByIds(ids);
  } catch {
    stored = new Map();
  }

  const pendingGemini: Array<{ idx: number; input: GeminiInput }> = [];
  for (let i = 0; i < raw.length; i++) {
    const it = raw[i]!;
    const hit = stored.get(ids[i]!);
    it.fetched_at = now;
    if (hit && (hit.classified_by === "keyword" || hit.classified_by === "gemini")) {
      // Reuse stored verdict verbatim.
      if (hit.region) it.region = hit.region as NewsItem["region"];
      if (typeof hit.severity === "number") it.impact = { ...it.impact, severity: hit.severity as NewsItem["impact"]["severity"] };
      if (hit.summary) it.summary = hit.summary;
      it.classified_by = hit.classified_by;
      if (hit.cluster_id) it.cluster_id = hit.cluster_id;
    } else {
      it.classified_by = "keyword";
      const v = keywordClassify(it.title, snippetOf(it));
      if (needsGemini(v, false) && pendingGemini.length < GEMINI_MAX_PER_CYCLE) {
        pendingGemini.push({ idx: i, input: { id: ids[i]!, title: it.title, source: it.source } });
      }
    }
  }

  // Pass 2 (Gemini): batched in parallel, best-effort, never blocking on failure.
  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (apiKey && pendingGemini.length > 0) {
    try {
      const batches: Array<Array<{ idx: number; input: GeminiInput }>> = [];
      for (let b = 0; b < pendingGemini.length; b += GEMINI_BATCH) {
        batches.push(pendingGemini.slice(b, b + GEMINI_BATCH));
      }
      const settled = await Promise.allSettled(
        batches.map((batch) => geminiClassifyBatch(batch.map((p) => p.input), apiKey))
      );
      for (let b = 0; b < batches.length; b++) {
        const s = settled[b]!;
        if (s.status !== "fulfilled") continue;
        const byId = new Map(s.value.map((v) => [v.id, v]));
        for (const p of batches[b]!) {
          const v = byId.get(p.input.id);
          if (!v) continue;
          const it = raw[p.idx]!;
          it.region = v.region;
          it.impact = { ...it.impact, severity: v.severity };
          it.summary = v.summary;
          it.classified_by = "gemini";
        }
      }
    } catch {
      // fall back to keyword results already on the items
    }
  }

  // Cluster against stories from the last 48h (persisted + current batch).
  let seeds: ClusterSeed[] = [];
  try {
    seeds = (await getRecent(48)).map((s) => ({
      cluster_id: s.cluster_id ?? s.id,
      title: s.title,
      publishedMs: s.published_at,
    }));
  } catch {
    seeds = [];
  }
  const clustered = clusterItems(raw, seeds);

  // Upsert every fetched item (INSERT ... ON CONFLICT, never duplicates).
  try {
    const { jaccardSimilarity, CLUSTER_WINDOW_MS } = await import("./cluster.js");
    const rows = [];
    for (let i = 0; i < raw.length; i++) {
      const it = raw[i]!;
      let cid: string | null = it.cluster_id ?? null;
      if (!cid) {
        for (const card of clustered) {
          const dt = Math.abs(it.published.getTime() - card.published.getTime());
          if (dt <= CLUSTER_WINDOW_MS && jaccardSimilarity(it.title, card.title) >= 0.6) {
            cid = card.cluster_id!;
            break;
          }
        }
      }
      it.cluster_id = cid ?? it.cluster_id;
      rows.push({
        id: ids[i]!,
        title: it.title,
        link: it.link,
        source: it.source,
        published_at: it.published.getTime(),
        fetched_at: fetchedMs,
        region: it.region,
        severity: it.impact.severity,
        summary: it.summary ?? null,
        classified_by: it.classified_by ?? "keyword" as const,
        cluster_id: it.cluster_id ?? null,
      });
    }
    await upsertItems(rows);
    // Prune items older than 7 days, at most once per hour.
    if (Date.now() - lastPrune > 3600 * 1000) {
      lastPrune = Date.now();
      try {
        await pruneOld();
      } catch {
        // prune is best-effort
      }
    }
  } catch {
    // persistence failure: still return the clustered cards
  }

  return clustered.map((c) => ({ ...c, fetched_at: now, stale: false }));
}

export function hashForTest(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 16);
}
