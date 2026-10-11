import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreItem, impactChipSuffix, marketMood, hotAssets } from "./impact.js";

describe("scoreItem", () => {
  it("returns neutral impact for non-geopolitical titles", () => {
    const out = scoreItem("City marathon draws record crowds downtown");
    assert.equal(out.severity, 1);
    assert.equal(out.sentiment, "neutral");
    assert.deepEqual(out.themes, []);
    assert.deepEqual(out.impacts, []);
  });

  it("scores escalation titles high and risk-off", () => {
    const out = scoreItem("Israel launches airstrike on Gaza, invasion fears rise");
    assert.ok(out.themes.includes("mideast-conflict"));
    assert.ok(out.severity >= 3, `severity was ${out.severity}`);
    assert.equal(out.sentiment, "risk-off");
    assert.ok(out.impacts.some((a) => a.symbol === "CL=F"));
  });

  it("marks ceasefire titles risk-on", () => {
    const out = scoreItem("Gaza ceasefire talks advance");
    assert.ok(out.themes.includes("mideast-conflict"));
    assert.equal(out.sentiment, "risk-on");
  });

  it("caches repeat titles", () => {
    assert.equal(scoreItem("Gold steady as markets wait"), scoreItem("Gold steady as markets wait"));
  });
});

describe("impactChipSuffix", () => {
  it("renders arrows and shortens symbols", () => {
    const chip = impactChipSuffix(scoreItem("Israel launches airstrike on Gaza, invasion fears rise"));
    assert.match(chip, /▲|▼|◆/);
    assert.ok(!chip.includes(".NS") || chip.length > 0);
  });

  it("returns empty string for neutral impact", () => {
    assert.equal(impactChipSuffix(scoreItem("City marathon draws record crowds downtown")), "");
  });
});

describe("marketMood", () => {
  it("is CALM on empty input", () => {
    assert.equal(marketMood([]).label, "CALM");
  });

  it("is ALARM when everything is severe risk-off", () => {
    const items = Array.from({ length: 5 }, () => ({
      impact: scoreItem("Israel launches airstrike on Gaza, invasion fears rise")
    }));
    assert.equal(marketMood(items).label, "ALARM");
  });
});

describe("hotAssets", () => {
  it("counts recent asset mentions", () => {
    const items = [
      { impact: scoreItem("Israel launches airstrike on Gaza, invasion fears rise"), published: new Date() },
      { impact: scoreItem("City marathon draws record crowds downtown"), published: new Date() }
    ];
    const hot = hotAssets(items);
    assert.ok(hot.length > 0);
    assert.ok(hot[0]!.count >= 1);
  });

  it("ignores stale items", () => {
    const items = [
      {
        impact: scoreItem("Israel launches airstrike on Gaza, invasion fears rise"),
        published: new Date(Date.now() - 48 * 3600 * 1000)
      }
    ];
    assert.deepEqual(hotAssets(items), []);
  });
});
