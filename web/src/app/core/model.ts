import type {
  AssetImpact,
  ImpactDirection,
  ItemImpact,
  Region,
  RegionFilter,
} from "@lib/types";

export type { AssetImpact, ImpactDirection, ItemImpact, Region, RegionFilter };

/** Headline as used in the browser: published is a real Date. */
export interface Headline {
  title: string;
  source: string;
  link: string;
  published: Date;
  region: Region;
  impact: ItemImpact;
  // Added fields only (all optional, mirror GET /api/news).
  cluster_id?: string | null;
  sources?: Array<{ name: string; link: string }>;
  source_count?: number;
  fetched_at?: Date | null;
  summary?: string | null;
  classified_by?: "keyword" | "gemini";
  stale?: boolean;
}

/** Raw JSON shape from GET /api/news (published is an ISO string). */
export interface ApiHeadline {
  title: string;
  source: string;
  link: string;
  published: string;
  region: Region;
  impact: ItemImpact;
  cluster_id?: string | null;
  sources?: Array<{ name: string; link: string }>;
  source_count?: number;
  fetched_at?: string | null;
  summary?: string | null;
  classified_by?: "keyword" | "gemini";
  stale?: boolean;
}

export interface QuoteData {
  price: number;
  changePct: number;
  spark: number[];
}

export type MoodLabel = "CALM" | "WARY" | "TENSE" | "ALARM";

export interface Mood {
  label: MoodLabel;
  score: number;
  riskOff: number;
  riskOn: number;
}

export const FILTERS: RegionFilter[] = [
  "All",
  "India",
  "Middle East",
  "Europe",
  "Asia-Pacific",
  "Americas",
  "Africa",
];

export function toHeadline(a: ApiHeadline): Headline {
  const d = new Date(a.published);
  const f = a.fetched_at ? new Date(a.fetched_at) : null;
  return {
    title: a.title,
    source: a.source,
    link: a.link,
    published: Number.isNaN(d.getTime()) ? new Date() : d,
    region: a.region,
    impact: a.impact,
    cluster_id: a.cluster_id ?? null,
    sources: a.sources ?? [{ name: a.source, link: a.link }],
    source_count: a.source_count ?? 1,
    fetched_at: f && !Number.isNaN(f.getTime()) ? f : null,
    summary: a.summary ?? null,
    classified_by: a.classified_by ?? "keyword",
    stale: a.stale ?? false,
  };
}

/** Local port of the shared marketMood formula (browser-safe, no Node imports). */
export function marketMood(items: Array<{ impact: ItemImpact }>): Mood {
  if (items.length === 0) return { label: "CALM", score: 0, riskOff: 0, riskOn: 0 };
  let sevSum = 0;
  let riskOff = 0;
  let riskOn = 0;
  for (const it of items) {
    sevSum += it.impact.severity;
    if (it.impact.sentiment === "risk-off") riskOff++;
    else if (it.impact.sentiment === "risk-on") riskOn++;
  }
  const avgSev = sevSum / items.length / 5;
  const net = (riskOff - riskOn) / items.length;
  const score = Math.max(0, Math.min(1, 0.55 * avgSev + 0.45 * (net * 0.5 + 0.5)));
  const label: MoodLabel = score < 0.3 ? "CALM" : score < 0.5 ? "WARY" : score < 0.7 ? "TENSE" : "ALARM";
  return { label, score, riskOff, riskOn };
}

export function shortSymbol(s: string): string {
  return s
    .replace(/\.NS$/, "")
    .replace(/-USD$/, "")
    .replace(/=F$/, "")
    .replace(/=X$/, "")
    .replace(/\.DE$/, "")
    .replace(/-B\.CO$/, "");
}
