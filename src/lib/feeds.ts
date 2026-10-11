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
  { name: "NPR", url: "https://feeds.npr.org/1004/rss.xml" }
];

const parser = new Parser({ timeout: 5000 });

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  const seen = new Map<string, NewsItem>();
  for (const item of all) {
    const key = normalizeTitle(item.title);
    if (!key) continue;
    const prev = seen.get(key);
    if (!prev || item.published.getTime() > prev.published.getTime()) {
      seen.set(key, item);
    }
  }
  const deduped = [...seen.values()];
  deduped.sort((a, b) => b.published.getTime() - a.published.getTime());
  return deduped.slice(0, 80);
}
