import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dedupeItems, titleSimilarity } from "./feeds.js";
import { NEUTRAL_IMPACT } from "./types.js";
import type { NewsItem } from "./types.js";

function item(title: string, source = "Test", hoursAgo = 0): NewsItem {
  return {
    title,
    source,
    link: `https://example.com/${encodeURIComponent(title.slice(0, 10))}`,
    published: new Date(Date.now() - hoursAgo * 3600 * 1000),
    region: "Global",
    impact: NEUTRAL_IMPACT
  };
}

describe("titleSimilarity", () => {
  it("is 1 for identical titles", () => {
    assert.equal(titleSimilarity("Pope to have surgery", "Pope to have surgery"), 1);
  });

  it("is 1 when the shorter title is fully contained", () => {
    assert.equal(titleSimilarity("How the ICC can be saved", "How the ICC can be saved - Al Jazeera"), 1);
  });

  it("is 0 for unrelated titles", () => {
    assert.equal(titleSimilarity("Pope to have surgery", "Sensex rallies on rate cut"), 0);
  });

  it("ignores outlet boilerplate", () => {
    const a = "EU urges US to reverse ICC sanctions | Tap to know more | Inshorts";
    const b = "EU rejects easing Russian diesel sanctions after Trump deal | Tap to know more | Inshorts";
    assert.ok(titleSimilarity(a, b) < 0.6, `similarity was ${titleSimilarity(a, b)}`);
  });
});

describe("dedupeItems", () => {
  it("merges exact duplicates, keeping the newest", () => {
    const out = dedupeItems([item("Pope to have surgery", "BBC", 2), item("Pope to have surgery", "NPR", 0)]);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.source, "NPR");
  });

  it("merges paraphrased duplicates of the same story", () => {
    const out = dedupeItems([
      item("Pope Leo XIV to undergo surgery after lump found in lung", "Al Jazeera", 1),
      item("Pope Leo to have surgery after lump found on lung", "BBC", 0)
    ]);
    assert.equal(out.length, 1);
  });

  it("keeps distinct stories apart", () => {
    const out = dedupeItems([
      item("EU urges US to reverse ICC sanctions | Tap to know more | Inshorts", "Google News", 0),
      item("EU rejects easing Russian diesel sanctions after Trump deal | Tap to know more | Inshorts", "Google News", 1),
      item("Tropical Storm Isaias may become first hurricane, Florida declares emergency", "Indian Express", 0),
      item("Trump approves firing squad execution for Fort Hood shooter", "Indian Express", 0)
    ]);
    assert.equal(out.length, 4);
  });

  it("returns newest-first order", () => {
    const out = dedupeItems([item("Older story about Nepal floods", "BBC", 5), item("Newer story about Taiwan drills", "BBC", 0)]);
    assert.equal(out.length, 2);
    assert.match(out[0]!.title, /Taiwan/);
  });

  it("skips blank titles", () => {
    assert.equal(dedupeItems([item("   "), item("Real headline here")]).length, 1);
  });

  it("handles empty input", () => {
    assert.deepEqual(dedupeItems([]), []);
  });
});
