import { createHash } from "node:crypto";
import type { NewsItem } from "./types.js";

export const CLUSTER_THRESHOLD = 0.6;
export const CLUSTER_WINDOW_MS = 48 * 3600 * 1000;

// Same stopwords as feeds title normalization.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
  "as", "at", "by", "from", "over", "after", "amid", "says", "say",
  "new", "latest", "live", "updates", "update", "breaking", "world",
  "news", "report", "reports", "what", "why", "how", "will", "its",
  "tap", "know", "more", "inshorts", "watch",
]);

export function normalizeForCluster(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function clusterTokens(t: string): Set<string> {
  return new Set(
    normalizeForCluster(t)
      .split(" ")
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/** Jaccard word overlap: |A∩B| / |A∪B|. 1 = identical token sets. */
export function jaccardSimilarity(a: string, b: string): number {
  const ta = clusterTokens(a);
  const tb = clusterTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const w of ta) if (tb.has(w)) shared++;
  const union = ta.size + tb.size - shared;
  if (union === 0) return 0;
  return shared / union;
}

export interface ClusterSeed {
  cluster_id: string;
  title: string;
  publishedMs: number;
}

/**
 * Merge fresh items into story clusters. Items with Jaccard >= threshold
 * against a seed (or an already-clustered fresh item) from the last 48h
 * share a cluster. Returns one merged card per cluster: canonical title is
 * the newest headline, sources unioned, published is the latest.
 */
export function clusterItems(
  items: NewsItem[],
  seeds: ClusterSeed[] = [],
  threshold = CLUSTER_THRESHOLD,
  windowMs = CLUSTER_WINDOW_MS
): NewsItem[] {
  const sorted = [...items].sort(
    (a, b) => b.published.getTime() - a.published.getTime()
  );
  // Working set: prior seeds + cards formed so far (newest first).
  const known: ClusterSeed[] = [...seeds];
  const groups = new Map<string, NewsItem[]>();

  const pubMs = (it: NewsItem): number => {
    const t = it.published instanceof Date ? it.published.getTime() : Date.parse(String(it.published));
    return Number.isFinite(t) ? t : Date.now();
  };

  for (const item of sorted) {
    if (!normalizeForCluster(item.title)) continue;
    const ms = pubMs(item);
    let match: string | null = null;
    for (const k of known) {
      if (Math.abs(ms - k.publishedMs) > windowMs) continue;
      if (jaccardSimilarity(item.title, k.title) >= threshold) {
        match = k.cluster_id;
        break;
      }
    }
    const cid = match ?? newClusterId(item.title, ms);
    if (!groups.has(cid)) {
      groups.set(cid, []);
      known.push({ cluster_id: cid, title: item.title, publishedMs: ms });
    }
    groups.get(cid)!.push(item);
  }

  const out: NewsItem[] = [];
  for (const [cid, members] of groups) {
    // Members arrive newest-first, so members[0] is the newest.
    const newest = members[0]!;
    const latestMs = Math.max(...members.map(pubMs));
    const seen = new Map<string, { name: string; link: string }>();
    for (const m of members) {
      if (!seen.has(m.source)) seen.set(m.source, { name: m.source, link: m.link });
    }
    const sources = [...seen.values()];
    out.push({
      ...newest,
      title: newest.title,
      source: newest.source,
      link: newest.link,
      published: new Date(latestMs),
      cluster_id: cid,
      sources,
      source_count: sources.length,
    });
  }
  out.sort((a, b) => b.published.getTime() - a.published.getTime());
  return out;
}

function newClusterId(title: string, ms: number): string {
  return createHash("sha1").update(`${normalizeForCluster(title)}|${ms}`).digest("hex").slice(0, 12);
}
