import type { Region } from "./types.js";
import { ALL_REGIONS } from "./types.js";

export const GEMINI_MODEL = (process.env.GEMINI_MODEL ?? "").trim() || "gemini-3.5-flash-lite";
// Round-trip latency to the API can exceed 10s on slow routes; batches run
// in parallel so the whole pass still fits well inside the 60s refresh cycle.
// /api/news never waits on this regardless (it serves cache immediately).
export const GEMINI_TIMEOUT_MS = 20000;
export const GEMINI_BATCH = 10;
export const GEMINI_MAX_PER_CYCLE = 30;

export interface GeminiInput {
  id: string;
  title: string;
  source?: string;
}

export interface GeminiVerdict {
  id: string;
  region: Region;
  severity: 1 | 2 | 3 | 4 | 5;
  summary: string;
}

const REGIONS: Region[] = [...ALL_REGIONS];

function isRegion(r: unknown): r is Region {
  return typeof r === "string" && (REGIONS as string[]).includes(r);
}

/** Strict validator for model JSON. Returns only valid rows, capped at 15-word summaries. */
export function validateGeminiJson(raw: unknown): GeminiVerdict[] {
  if (!Array.isArray(raw)) return [];
  const out: GeminiVerdict[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || !r.id) continue;
    if (!isRegion(r.region)) continue;
    const sev = Number(r.severity);
    if (!Number.isInteger(sev) || sev < 1 || sev > 5) continue;
    const summary =
      typeof r.summary === "string"
        ? r.summary.trim().split(/\s+/).slice(0, 15).join(" ")
        : "";
    if (!summary) continue;
    out.push({ id: r.id, region: r.region, severity: sev as GeminiVerdict["severity"], summary });
  }
  return out;
}

function promptFor(batch: GeminiInput[]): string {
  const lines = batch.map((b) => `- id: "${b.id}" headline: "${b.title.replace(/"/g, "'")}"`);
  return [
    "Classify each headline for a geopolitics news ticker.",
    `Allowed regions: ${REGIONS.join(", ")}.`,
    "Severity 1 (benign) to 5 (war/major escalation).",
    "Summary: max 15 words, plain facts, no punctuation tricks.",
    'Reply with ONLY a JSON array of {"id","region","severity","summary"} objects.',
    "Headlines:",
    ...lines,
  ].join("\n");
}

export async function geminiClassifyBatch(
  batch: GeminiInput[],
  apiKey: string,
  fetchFn: typeof fetch = fetch,
  timeoutMs = GEMINI_TIMEOUT_MS
): Promise<GeminiVerdict[]> {
  if (batch.length === 0) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptFor(batch) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Strip code fences if the model wrapped the JSON.
      const m = text.match(/\[[\s\S]*\]/);
      if (!m) return [];
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        return [];
      }
    }
    const valid = validateGeminiJson(parsed);
    // Only keep verdicts for ids we asked about.
    const wanted = new Set(batch.map((b) => b.id));
    return valid.filter((v) => wanted.has(v.id));
  } catch {
    // Timeout, network error, abort: caller falls back to keyword results.
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Split into batches of up to GEMINI_BATCH. Pure helper for tests. */
export function toBatches<T>(items: T[], size = GEMINI_BATCH): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
