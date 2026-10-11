import Parser from "rss-parser";
import { tagRegion } from "./regions.js";
import { scoreItem } from "./impact.js";
import type { NewsItem } from "./types.js";

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
      out.push({
        title,
        source: feed.name,
        link,
        published,
        region: tagRegion(`${title} ${(it.contentSnippet ?? "") as string}`),
        impact: scoreItem(title)
      });
    } catch {
      continue;
    }
  }
  return out;
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
  const deduped = dedupeItems(all);
  return deduped.slice(0, 80);
}
