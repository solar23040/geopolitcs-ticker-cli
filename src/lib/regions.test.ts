import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tagRegion, normalizeRegionName } from "./regions.js";

describe("tagRegion", () => {
  it("tags India stories India, ahead of Asia-Pacific", () => {
    assert.equal(tagRegion("Modi meets Jaishankar in New Delhi on BRICS summit"), "India");
    assert.equal(tagRegion("Sensex rallies as RBI holds rates, rupee gains"), "India");
    assert.equal(tagRegion("ISRO launches satellite from Bengaluru"), "India");
    // India checked before Asia-Pacific even when both match
    assert.equal(tagRegion("Modi meets Xi on Quad sidelines in Delhi"), "India");
    assert.equal(tagRegion("Kashmir border talks after LAC standoff"), "India");
  });

  it("tags other regions", () => {
    assert.equal(tagRegion("China holds military drills near Taiwan"), "Asia-Pacific");
    assert.equal(tagRegion("Gaza ceasefire talks in Cairo"), "Middle East");
    assert.equal(tagRegion("Zelensky addresses NATO summit in Brussels"), "Europe");
    assert.equal(tagRegion("Trump signs Mexico trade order at White House"), "Americas");
    assert.equal(tagRegion("Sudan peace talks open in Nairobi"), "Africa");
    assert.equal(tagRegion("UN Security Council meets on climate summit"), "Global");
  });

  it("does not false-positive on padded keywords", () => {
    // "lac" in "replace/black", "rbi" in "barbie/garbage" must not tag India
    assert.equal(tagRegion("The committee will replace the old policy"), "Global");
    assert.equal(tagRegion("Barbie movie breaks box office records"), "Global");
  });

  it("falls back to Global for unrecognized text", () => {
    assert.equal(tagRegion("City marathon draws record crowds downtown"), "Global");
    assert.equal(tagRegion(""), "Global");
  });
});

describe("normalizeRegionName", () => {
  it("resolves India and aliases", () => {
    assert.equal(normalizeRegionName("India"), "India");
    assert.equal(normalizeRegionName("india"), "India");
    assert.equal(normalizeRegionName("  INDIA  "), "India");
  });

  it("resolves existing regions", () => {
    assert.equal(normalizeRegionName("All"), "All");
    assert.equal(normalizeRegionName("middle-east"), "Middle East");
    assert.equal(normalizeRegionName("EU"), "Europe");
    assert.equal(normalizeRegionName("apac"), "Asia-Pacific");
    assert.equal(normalizeRegionName("Global"), "Global");
  });

  it("returns null for unknown names", () => {
    assert.equal(normalizeRegionName("Atlantis"), null);
    assert.equal(normalizeRegionName(""), null);
  });
});
