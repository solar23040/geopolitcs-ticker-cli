import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { NEUTRAL_IMPACT } from "../types.js";
import type { NewsItem } from "../types.js";
import { enrichItems } from "../feeds.js";
import { getRecent, initDb, itemId, pruneOld, upsertItems } from "./items.js";

// No Gemini calls in tests: classification must stay keyword-only.
process.env.GEMINI_API_KEY = "";

const dir = mkdtempSync("/tmp/opencode/geoticker-turso-");
const URL = `file:${join(dir, "t.db")}`;

function row(over: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    id: itemId("Some headline here", "BBC"),
    title: "Some headline here",
    link: "https://example.com/1",
    source: "BBC",
    published_at: now,
    fetched_at: now,
    region: "Europe" as const,
    severity: 2,
    summary: null,
    classified_by: "keyword" as const,
    cluster_id: null,
    ...over,
  };
}

function news(title: string, source = "BBC"): NewsItem {
  return {
    title,
    source,
    link: "https://example.com/x",
    published: new Date(),
    region: "Global",
    impact: NEUTRAL_IMPACT,
  };
}

describe("db/items", () => {
  it("initDb is idempotent", async () => {
    await initDb(URL);
    await initDb(URL);
    assert.deepEqual(await getRecent(24), []);
  });

  it("upserting the same item twice leaves one row", async () => {
    await initDb(URL);
    await upsertItems([row()]);
    await upsertItems([row()]);
    const rec = await getRecent(24);
    assert.equal(rec.length, 1);
    assert.equal(rec[0]!.id, itemId("Some headline here", "BBC"));
  });

  it("never overwrites fetched_at on an existing row", async () => {
    const t1 = Date.now() - 3600 * 1000;
    const t2 = Date.now();
    await upsertItems([row({ id: itemId("Keep first seen", "DW"), title: "Keep first seen", source: "DW", fetched_at: t1 })]);
    await upsertItems([row({ id: itemId("Keep first seen", "DW"), title: "Keep first seen", source: "DW", fetched_at: t2, severity: 5 })]);
    const rec = (await getRecent(24)).find((r) => r.id === itemId("Keep first seen", "DW"))!;
    assert.equal(rec.fetched_at, t1);
    assert.equal(rec.severity, 5);
  });

  it("pruneOld removes old rows and keeps recent ones", async () => {
    const now = Date.now();
    await upsertItems([
      row({ id: itemId("Ancient history", "DW"), title: "Ancient history", source: "DW", published_at: now - 8 * 24 * 3600 * 1000, fetched_at: now - 8 * 24 * 3600 * 1000 }),
      row({ id: itemId("Fresh story", "NPR"), title: "Fresh story", source: "NPR" }),
    ]);
    const removed = await pruneOld();
    assert.ok(removed >= 1);
    const titles = (await getRecent(24 * 30)).map((r) => r.title);
    assert.ok(!titles.includes("Ancient history"));
    assert.ok(titles.includes("Fresh story"));
  });

  it("pipeline still returns results if the DB client throws", async () => {
    await assert.rejects(initDb("file:/proc/geoticker-nope/t.db"));
    const out = await enrichItems([news("City marathon draws record crowds downtown")]);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.title, "City marathon draws record crowds downtown");
    await initDb(URL);
  });
});
