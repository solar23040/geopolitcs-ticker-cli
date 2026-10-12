import { tagRegion } from "./regions.js";
import { scoreItem } from "./impact.js";
import type { Region } from "./types.js";

export interface KeywordVerdict {
  region: Region;
  severity: 1 | 2 | 3 | 4 | 5;
  /** 0..1: 0.9 single-region hit, 0.55 ambiguous, 0.2 Global fallback. */
  confidence: number;
  ambiguous: boolean;
}

export function keywordClassify(title: string, snippet = ""): KeywordVerdict {
  const region = tagRegion(`${title} ${snippet}`);
  const impact = scoreItem(title, snippet);
  if (region === "Global") {
    return { region, severity: impact.severity, confidence: 0.2, ambiguous: true };
  }
  // Weak hit: low severity with no supporting theme signals.
  const ambiguous = impact.severity <= 2 && impact.themes.length === 0;
  return { region, severity: impact.severity, confidence: ambiguous ? 0.55 : 0.9, ambiguous };
}

/** Pass-2 gate: does this item need a Gemini call? Never true for stored items. */
export function needsGemini(v: KeywordVerdict, alreadyStored: boolean): boolean {
  if (alreadyStored) return false;
  if (v.region === "Global") return true;
  if (v.severity <= 2 && v.ambiguous) return true;
  return false;
}
