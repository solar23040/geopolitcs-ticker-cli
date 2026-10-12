import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GEMINI_BATCH,
  geminiClassifyBatch,
  toBatches,
  validateGeminiJson,
} from "./gemini.js";

const INPUT = [{ id: "a1", title: "Gaza ceasefire talks advance" }];

function okResponse(rows: unknown): Response {
  const text = JSON.stringify(rows);
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

describe("validateGeminiJson", () => {
  it("accepts valid rows and trims summaries to 15 words", () => {
    const rows = [
      { id: "a1", region: "Middle East", severity: 3, summary: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen" },
    ];
    const out = validateGeminiJson(rows);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.summary.split(" ").length, 15);
  });

  it("rejects bad region, out-of-range severity, missing summary", () => {
    const rows = [
      { id: "a", region: "Atlantis", severity: 3, summary: "valid summary here" },
      { id: "b", region: "Europe", severity: 9, summary: "valid summary here" },
      { id: "c", region: "Europe", severity: 2, summary: "" },
      { id: "", region: "Europe", severity: 2, summary: "valid summary here" },
      { id: "d", region: "Europe", severity: 2, summary: "fine short summary" },
    ];
    const out = validateGeminiJson(rows);
    assert.deepEqual(out.map((r) => r.id), ["d"]);
  });

  it("rejects non-arrays", () => {
    assert.deepEqual(validateGeminiJson({}), []);
    assert.deepEqual(validateGeminiJson("nope"), []);
  });
});

describe("geminiClassifyBatch fallback", () => {
  it("returns verdicts on a good response", async () => {
    const fetchFn = (async () =>
      okResponse([{ id: "a1", region: "Middle East", severity: 2, summary: "Talks continue in Cairo" }])) as typeof fetch;
    const out = await geminiClassifyBatch(INPUT, "key", fetchFn);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.region, "Middle East");
  });

  it("falls back to [] on HTTP error", async () => {
    const fetchFn = (async () => new Response("err", { status: 500 })) as typeof fetch;
    assert.deepEqual(await geminiClassifyBatch(INPUT, "key", fetchFn), []);
  });

  it("falls back to [] on invalid JSON", async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not json at all" }] } }] }), {
        status: 200,
      })) as typeof fetch;
    assert.deepEqual(await geminiClassifyBatch(INPUT, "key", fetchFn), []);
  });

  it("falls back to [] on timeout", async () => {
    const fetchFn = ((_url: unknown, init: { signal?: AbortSignal }) =>
      new Promise((_res, rej) => {
        init.signal?.addEventListener("abort", () => rej(new Error("aborted")));
      })) as unknown as typeof fetch;
    const out = await geminiClassifyBatch(INPUT, "key", fetchFn, 50);
    assert.deepEqual(out, []);
  });

  it("drops verdicts for unknown ids", async () => {
    const fetchFn = (async () =>
      okResponse([{ id: "zzz", region: "Europe", severity: 2, summary: "Stray row here" }])) as typeof fetch;
    assert.deepEqual(await geminiClassifyBatch(INPUT, "key", fetchFn), []);
  });
});

describe("toBatches", () => {
  it("splits at batch size 10", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const b = toBatches(items);
    assert.deepEqual(b.map((x) => x.length), [10, 10, 5]);
    assert.equal(GEMINI_BATCH, 10);
  });
});
