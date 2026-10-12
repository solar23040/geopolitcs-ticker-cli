import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { keywordRegex, tagRegion } from "./regions.js";
import { keywordClassify, needsGemini } from "./classify.js";

describe("keyword word boundaries", () => {
  it("does not match quad inside squad", () => {
    assert.equal(tagRegion("Review board approves firing squad method for prison executions"), "Global");
    assert.ok(!keywordRegex("quad").test("firing squad execution"));
  });

  it("still matches standalone quad", () => {
    assert.ok(keywordRegex("quad").test("Modi meets Xi on Quad sidelines in Delhi"));
    assert.equal(tagRegion("Modi meets Xi on Quad sidelines in Delhi"), "India");
  });

  it("does not match lac inside replace/black or rbi inside barbie", () => {
    assert.equal(tagRegion("The committee will replace the old policy"), "Global");
    assert.equal(tagRegion("Barbie movie breaks box office records"), "Global");
  });

  it("matches padded keywords standalone (us, eu, rbi)", () => {
    assert.ok(keywordRegex(" rbi ").test("Sensex rallies as RBI holds rates"));
    assert.equal(tagRegion("Sensex rallies as RBI holds rates, rupee gains"), "India");
    assert.ok(keywordRegex("us ").test("EU urges US to reverse sanctions"));
  });

  it("matches dotted abbreviations like u.s.", () => {
    assert.ok(keywordRegex("u.s.").test("U.S. sanctions on Russian oil expand"));
  });
});

describe("keywordClassify", () => {
  it("returns region + severity + confidence", () => {
    const v = keywordClassify("Israel launches airstrike on Gaza, invasion fears rise");
    assert.equal(v.region, "Middle East");
    assert.ok(v.severity >= 3);
    assert.ok(v.confidence > 0.5 && v.confidence <= 1);
    assert.equal(v.ambiguous, false);
  });

  it("marks Global fallback low-confidence ambiguous", () => {
    const v = keywordClassify("City marathon draws record crowds downtown");
    assert.equal(v.region, "Global");
    assert.ok(v.confidence < 0.5);
    assert.equal(v.ambiguous, true);
  });

  it("needsGemini: true for no-region, false for stored items", () => {
    const g = keywordClassify("City marathon draws record crowds downtown");
    assert.equal(needsGemini(g, false), true);
    assert.equal(needsGemini(g, true), false); // never re-classify stored items
    const s = keywordClassify("Israel launches airstrike on Gaza, invasion fears rise");
    assert.equal(needsGemini(s, false), false);
  });
});
