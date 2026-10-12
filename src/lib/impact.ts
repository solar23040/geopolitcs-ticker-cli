import { THEMES } from "./themes.js";
import { NEUTRAL_IMPACT } from "./types.js";
import type { AssetImpact, ImpactDirection, ItemImpact } from "./types.js";

const ESCALATION: Array<{ w: string; pts: number }> = [
  { w: "invasion", pts: 2 },
  { w: "nuclear", pts: 2 },
  { w: "missile", pts: 2 },
  { w: "blockade", pts: 2 },
  { w: "coup", pts: 2 },
  { w: "default", pts: 2 },
  { w: "strike", pts: 1 },
  { w: "airstrike", pts: 1 },
  { w: "sanctions", pts: 1 },
  { w: "sanction", pts: 1 },
  { w: "ceasefire", pts: 1 },
  { w: "embargo", pts: 1 },
  { w: "martial law", pts: 1 }
];

const DEESCALATION = ["ceasefire", "peace deal", "truce", "armistice", "rate cut", "dovish pause", "breakthrough talks"];
const RISKOFF_HINTS = ["war", "attack", "crisis", "surge", "ban", "tariff", "sanction", "coup", "missile", "strike", "fear", "plunge"];

function rankDir(d: ImpactDirection): number {
  if (d === "up") return 2;
  if (d === "down") return 2;
  return 1;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary hit so e.g. "war" doesn't match "forward".
function wordHit(haystack: string, needle: string): boolean {
  const t = needle.trim().toLowerCase();
  if (!t) return false;
  const pre = /^\w/.test(t) ? "\\b" : "";
  const suf = /\w$/.test(t) ? "\\b" : "";
  return new RegExp(`${pre}${escapeRe(t)}${suf}`, "i").test(haystack);
}

const cache = new Map<string, ItemImpact>();

function normKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function scoreItem(title: string, _snippet = ""): ItemImpact {
  const key = normKey(title);
  const hit = cache.get(key);
  if (hit) return hit;
  const t = ` ${title.toLowerCase()} `;
  const matchedThemes: string[] = [];
  const bySymbol = new Map<string, AssetImpact>();
  for (const theme of THEMES) {
    const matched = theme.patterns.some((p) => wordHit(t, p));
    if (!matched) continue;
    matchedThemes.push(theme.id);
    for (const imp of theme.impacts) {
      const prev = bySymbol.get(imp.symbol);
      if (!prev) {
        bySymbol.set(imp.symbol, { ...imp });
      } else if (prev.direction !== imp.direction) {
        // conflicting signals -> mixed, keep first reason
        bySymbol.set(imp.symbol, { ...prev, direction: "mixed" });
      } else if (rankDir(imp.direction) > rankDir(prev.direction)) {
        bySymbol.set(imp.symbol, { ...imp });
      }
    }
  }
  if (matchedThemes.length === 0) {
    cache.set(key, NEUTRAL_IMPACT);
    return NEUTRAL_IMPACT;
  }
  let esc = 0;
  for (const e of ESCALATION) {
    if (wordHit(t, e.w)) esc += e.pts;
  }
  const raw = 1 + Math.min(2, matchedThemes.length - 1) + Math.min(2, esc);
  const severity = Math.max(1, Math.min(5, raw)) as ItemImpact["severity"];
  const hasDeesc = DEESCALATION.some((w) => wordHit(t, w));
  const hasRiskOff = RISKOFF_HINTS.some((w) => wordHit(t, w));
  let sentiment: ItemImpact["sentiment"] = "neutral";
  if (hasDeesc && severity <= 3) sentiment = "risk-on";
  else if (severity >= 3 || hasRiskOff) sentiment = "risk-off";
  const impacts = [...bySymbol.values()]
    .sort((a, b) => {
      const ra = rankDir(a.direction) - rankDir(b.direction);
      if (ra !== 0) return -ra;
      return a.symbol.localeCompare(b.symbol);
    })
    .slice(0, 8);
  const out: ItemImpact = { themes: matchedThemes, impacts, severity, sentiment };
  if (cache.size > 2000) cache.clear();
  cache.set(key, out);
  return out;
}

export function impactChipSuffix(impact: ItemImpact, top = 3): string {
  if (impact.impacts.length === 0) return "";
  const arrow = (d: ImpactDirection): string => (d === "up" ? "▲" : d === "down" ? "▼" : "◆");
  const short = (s: string): string => s.replace(/\.NS$/, "").replace(/-USD$/, "").replace(/=F$/, "").replace(/=X$/, "").replace(/\.DE$/, "").replace(/-B\.CO$/, "");
  return impact.impacts
    .slice(0, top)
    .map((a) => `${arrow(a.direction)}${short(a.symbol)}`)
    .join(" ");
}

export interface Mood {
  label: "CALM" | "WARY" | "TENSE" | "ALARM";
  score: number;
  riskOff: number;
  riskOn: number;
}

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
  const net = (riskOff - riskOn) / items.length; // -1..1
  const score = Math.max(0, Math.min(1, 0.55 * avgSev + 0.45 * (net * 0.5 + 0.5)));
  const label = score < 0.3 ? "CALM" : score < 0.5 ? "WARY" : score < 0.7 ? "TENSE" : "ALARM";
  return { label, score, riskOff, riskOn };
}

export interface HotAsset {
  symbol: string;
  name: string;
  direction: ImpactDirection;
  count: number;
}

export function hotAssets(
  items: Array<{ impact: ItemImpact; published: Date }>,
  hours = 1,
  top = 5
): HotAsset[] {
  const cutoff = Date.now() - hours * 3600 * 1000;
  const counts = new Map<string, { name: string; up: number; down: number; mixed: number; total: number }>();
  for (const it of items) {
    try {
      if (it.published.getTime() < cutoff) continue;
    } catch {
      continue;
    }
    for (const a of it.impact.impacts.slice(0, 4)) {
      const e = counts.get(a.symbol) ?? { name: a.name, up: 0, down: 0, mixed: 0, total: 0 };
      e.total++;
      if (a.direction === "up") e.up++;
      else if (a.direction === "down") e.down++;
      else e.mixed++;
      counts.set(a.symbol, e);
    }
  }
  return [...counts.entries()]
    .map(([symbol, e]) => {
      const direction: ImpactDirection = e.up >= e.down && e.up >= e.mixed ? "up" : e.down >= e.mixed ? "down" : "mixed";
      return { symbol, name: e.name, direction, count: e.total };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}
