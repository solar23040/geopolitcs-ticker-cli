import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clusterItems, jaccardSimilarity } from "./cluster.js";
import { NEUTRAL_IMPACT } from "./types.js";
import type { NewsItem } from "./types.js";

function item(title: string, source = "Test", hoursAgo = 0): NewsItem {
  return {
    title,
    source,
    link: `https://example.com/${encodeURIComponent(title.slice(0, 10))}`,
    published: new Date(Date.now() - hoursAgo * 3600 * 1000),
    region: "Global",
    impact: NEUTRAL_IMPACT,
  };
}

describe("jaccardSimilarity", () => {
  it("is 1 for identical titles", () => {
    assert.equal(jaccardSimilarity("Pope to have surgery", "Pope to have surgery"), 1);
  });

  it("is 0 for unrelated titles", () => {
    assert.equal(jaccardSimilarity("Pope to have surgery", "Sensex rallies on rate cut"), 0);
  });

  it("is below 1 for contained titles (Jaccard, not overlap)", () => {
    const s = jaccardSimilarity("How the ICC can be saved", "How the ICC can be saved - Al Jazeera");
    assert.ok(s < 1 && s >= 0.6, `similarity was ${s}`);
  });

  it("ignores outlet boilerplate", () => {
    const a = "EU urges US to reverse ICC sanctions | Tap to know more | Inshorts";
    const b = "EU rejects easing Russian diesel sanctions after Trump deal | Tap to know more | Inshorts";
    assert.ok(jaccardSimilarity(a, b) < 0.6, `similarity was ${jaccardSimilarity(a, b)}`);
  });
});

describe("clusterItems", () => {
  it("merges similar titles into one card with sources + count", () => {
    const out = clusterItems([
      item("Pope Leo XIV to undergo surgery after lump found in lung", "Al Jazeera", 1),
      item("Pope Leo to have surgery after lump found on lung", "BBC", 0),
    ]);
    assert.equal(out.length, 1);
    const card = out[0]!;
    assert.equal(card.source_count, 2);
    assert.equal(card.sources?.length, 2);
    // canonical title is the newest
    assert.match(card.title, /Pope Leo to have surgery/);
  });

  it("keeps different stories apart", () => {
    const out = clusterItems([
      item("EU urges US to reverse ICC sanctions | Tap to know more | Inshorts", "Google News", 0),
      item("EU rejects easing Russian diesel sanctions after Trump deal | Tap to know more | Inshorts", "Google News", 1),
      item("Tropical Storm Isaias may become first hurricane, Florida declares emergency", "Indian Express", 0),
      item("Trump approves firing squad execution for Fort Hood shooter", "Indian Express", 0),
    ]);
    assert.equal(out.length, 4);
  });

  it("does not merge across the 48h window", () => {
    const out = clusterItems(
      [
        item("Pope Leo to have surgery after lump found on lung", "BBC", 0),
        item("Pope Leo to have surgery after lump found on lung", "NPR", 72),
      ],
      [],
      0.6,
      48 * 3600 * 1000
    );
    assert.equal(out.length, 2);
  });

  it("reuses a persisted seed cluster within 48h", () => {
    const out = clusterItems([item("Pope Leo to have surgery after lump found on lung", "BBC", 0)], [
      { cluster_id: "abc123", title: "Pope Leo XIV to undergo surgery after lump found in lung", publishedMs: Date.now() - 3600 * 1000 },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.cluster_id, "abc123");
  });

  it("keeps latest published_at on the merged card", () => {
    const out = clusterItems([
      item("Pope Leo to have surgery after lump found on lung", "BBC", 2),
      item("Pope Leo surgery after lump found on lung treatment", "NPR", 0),
    ]);
    assert.equal(out.length, 1);
    assert.ok(Date.now() - out[0]!.published.getTime() < 5 * 60 * 1000);
  });

  it("handles empty input", () => {
    assert.deepEqual(clusterItems([]), []);
  });
});
