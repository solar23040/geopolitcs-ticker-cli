#!/usr/bin/env node

// src/index.tsx
import { Command } from "commander";
import { render } from "ink";
import chalk from "chalk";
import stringWidth3 from "string-width";

// src/App.tsx
import { useEffect as useEffect4, useMemo as useMemo5, useState as useState4 } from "react";
import { Box as Box9, Text as Text9, useApp, useInput, useStdout } from "ink";
import open from "open";

// src/components/Header.tsx
import React from "react";
import { Box, Text } from "ink";

// src/lib/format.ts
import stringWidth from "string-width";
function timeAgo(d, now = /* @__PURE__ */ new Date()) {
  const s = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1e3));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
function formatClock(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function truncateByWidth(s, maxWidth) {
  if (maxWidth <= 0) return "";
  if (stringWidth(s) <= maxWidth) return s;
  if (maxWidth === 1) return "\u2026";
  let w = 0;
  let out = "";
  for (const ch of s) {
    const cw = stringWidth(ch);
    if (w + cw > maxWidth - 1) break;
    out += ch;
    w += cw;
  }
  return out + "\u2026";
}
function sparkline(points) {
  const bars = ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"];
  if (points.length === 0) return "\u2500";
  const min = Math.min(...points);
  const max = Math.max(...points);
  if (max === min) return bars[3]?.repeat(Math.max(1, Math.min(12, points.length))) ?? "\u2500";
  return points.slice(-12).map((p) => {
    const r = (p - min) / (max - min);
    const idx = Math.max(0, Math.min(bars.length - 1, Math.floor(r * bars.length)));
    return bars[idx] ?? "\u2500";
  }).join("");
}
function severityMeter(sev) {
  return "\u25CF".repeat(Math.max(0, Math.min(5, sev))) + "\u25CB".repeat(5 - Math.max(0, Math.min(5, sev)));
}

// src/lib/ui-theme.ts
function supportsTruecolor() {
  const ct = (process.env.COLORTERM ?? "").toLowerCase();
  return ct.includes("truecolor") || ct.includes("24bit");
}
var THEME_NAMES = ["amber", "midnight", "mono"];
function getUiTheme(name, noColor2) {
  const tc = !noColor2 && supportsTruecolor();
  if (noColor2) {
    const plain = {
      name,
      label: name,
      accent: void 0,
      accentFallback: "yellow",
      border: void 0,
      borderFallback: "gray",
      gain: void 0,
      loss: void 0,
      gainFallback: "green",
      lossFallback: "red",
      mixed: void 0,
      cyan: void 0
    };
    return plain;
  }
  if (name === "midnight") {
    return {
      name,
      label: "Midnight Blue",
      accent: tc ? "#6CB8FF" : void 0,
      accentFallback: "blue",
      border: tc ? "#3A5A8C" : void 0,
      borderFallback: "blue",
      gain: tc ? "#3DDC84" : void 0,
      loss: tc ? "#FF5C5C" : void 0,
      gainFallback: "green",
      lossFallback: "red",
      mixed: tc ? "#FFB000" : void 0,
      cyan: tc ? "#56E6E6" : void 0
    };
  }
  if (name === "mono") {
    return {
      name,
      label: "Mono",
      accent: void 0,
      accentFallback: "white",
      border: void 0,
      borderFallback: "gray",
      gain: void 0,
      loss: void 0,
      gainFallback: "white",
      lossFallback: "white",
      mixed: void 0,
      cyan: void 0
    };
  }
  return {
    name,
    label: "Amber Terminal",
    accent: tc ? "#FFB000" : void 0,
    accentFallback: "yellow",
    border: tc ? "#8A6D1B" : void 0,
    borderFallback: "yellow",
    gain: tc ? "#3DDC84" : void 0,
    loss: tc ? "#FF5C5C" : void 0,
    gainFallback: "green",
    lossFallback: "red",
    mixed: tc ? "#FFB000" : void 0,
    cyan: tc ? "#56E6E6" : void 0
  };
}
function themeColor(hex, fallback, noColor2) {
  if (noColor2) return void 0;
  if (hex) return hex;
  return fallback;
}

// src/components/Header.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var GRAD = ["#FFB000", "#FF9E00", "#FF8C00", "#FF7A00", "#FF6B00"];
function GradientTitle({ text, noColor: noColor2 }) {
  if (noColor2) return /* @__PURE__ */ jsx(Text, { bold: true, children: text });
  return /* @__PURE__ */ jsx(Text, { bold: true, children: text.split("").map((ch, i) => /* @__PURE__ */ jsx(Text, { color: GRAD[i % GRAD.length], children: ch }, i)) });
}
function MoodBar({ mood, noColor: noColor2, theme }) {
  const total = 10;
  const filled = Math.round(mood.score * total);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(total - filled);
  const color = mood.label === "CALM" ? themeColor(theme.gain, theme.gainFallback, noColor2) : mood.label === "WARY" ? themeColor(theme.mixed, "yellow", noColor2) : themeColor(theme.loss, theme.lossFallback, noColor2);
  return /* @__PURE__ */ jsxs(Text, { children: [
    /* @__PURE__ */ jsx(Text, { color: noColor2 ? void 0 : "gray", children: "MOOD " }),
    /* @__PURE__ */ jsxs(Text, { color, bold: true, children: [
      bar,
      " ",
      mood.label
    ] })
  ] });
}
function Header({ updatedAt, offline, now, noColor: noColor2, mood, theme, pricesOn }) {
  const blinkOn = Math.floor(now.getTime() / 500) % 2 === 0;
  const updated = updatedAt ? timeAgo(updatedAt, now) : "never";
  const accent = themeColor(theme.accent, theme.accentFallback, noColor2);
  return /* @__PURE__ */ jsxs(Box, { width: "100%", flexDirection: "column", children: [
    /* @__PURE__ */ jsxs(Box, { width: "100%", justifyContent: "space-between", children: [
      /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Text, { color: noColor2 ? void 0 : blinkOn ? "#FF5C5C" : "#7A2E2E", children: blinkOn ? "\u25CF " : "\u25CB " }),
        /* @__PURE__ */ jsx(GradientTitle, { text: "GEOPOLITICS LIVE", noColor: noColor2 }),
        /* @__PURE__ */ jsxs(Text, { color: noColor2 ? void 0 : "gray", children: [
          " ",
          formatClock(now)
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Box, { gap: 1, children: [
        offline ? /* @__PURE__ */ jsx(Text, { color: noColor2 ? void 0 : "white", backgroundColor: noColor2 ? void 0 : "red", bold: true, children: " OFFLINE " }) : /* @__PURE__ */ jsx(Text, { color: noColor2 ? void 0 : "black", backgroundColor: noColor2 ? void 0 : "green", bold: true, children: " LIVE " }),
        /* @__PURE__ */ jsxs(Text, { color: noColor2 ? void 0 : "gray", children: [
          "upd ",
          updated
        ] }),
        !pricesOn ? /* @__PURE__ */ jsx(Text, { color: noColor2 ? void 0 : "gray", children: "$-off" }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Box, { width: "100%", justifyContent: "space-between", children: [
      /* @__PURE__ */ jsx(MoodBar, { mood, noColor: noColor2, theme }),
      /* @__PURE__ */ jsxs(Text, { color: noColor2 ? void 0 : "gray", children: [
        "risk-off ",
        /* @__PURE__ */ jsx(Text, { color: accent, children: mood.riskOff }),
        " \xB7 risk-on ",
        mood.riskOn
      ] })
    ] })
  ] });
}
var Header_default = React.memo(Header);

// src/components/Marquee.tsx
import React2, { useMemo } from "react";
import { Box as Box2, Text as Text2 } from "ink";
import stringWidth2 from "string-width";

// src/lib/themes.ts
var THEMES = [
  {
    id: "mideast-conflict",
    label: "Middle East conflict",
    patterns: ["israel", "gaza", "hamas", "hezbollah", "lebanon", "beirut", "west bank", "tel aviv", "jerusalem", "netanyahu"],
    impacts: [
      { symbol: "CL=F", name: "WTI Crude", market: "COM", direction: "up", reason: "War risk lifts crude prices" },
      { symbol: "GC=F", name: "Gold", market: "COM", direction: "up", reason: "Safe haven bids gold" },
      { symbol: "LMT", name: "Lockheed Martin", market: "US", direction: "up", reason: "Defense orders likely rise" },
      { symbol: "INDIGO.NS", name: "InterGlobe Aviation", market: "NSE", direction: "down", reason: "Fuel costs squeeze airlines" }
    ]
  },
  {
    id: "iran-tensions",
    label: "Iran tensions",
    patterns: ["iran", "tehran", "irgc", "khamenei", "natanz", "hormuz"],
    impacts: [
      { symbol: "BZ=F", name: "Brent Crude", market: "COM", direction: "up", reason: "Iran supply risk premium" },
      { symbol: "ONGC.NS", name: "ONGC", market: "NSE", direction: "up", reason: "Higher crude realisations help" },
      { symbol: "BPCL.NS", name: "BPCL", market: "NSE", direction: "down", reason: "Marketing margins get squeezed" },
      { symbol: "HINDPETRO.NS", name: "HPCL", market: "NSE", direction: "down", reason: "OMC margins get squeezed" },
      { symbol: "GC=F", name: "Gold", market: "COM", direction: "up", reason: "Safe haven bids gold" }
    ]
  },
  {
    id: "hormuz-blockade",
    label: "Strait of Hormuz risk",
    patterns: ["hormuz", "strait blockade", "tanker seized", "tanker attack", "gulf shipping"],
    impacts: [
      { symbol: "BZ=F", name: "Brent Crude", market: "COM", direction: "up", reason: "Chokepoint threatens oil flows" },
      { symbol: "CL=F", name: "WTI Crude", market: "COM", direction: "up", reason: "Chokepoint threatens oil flows" },
      { symbol: "OIL.NS", name: "Oil India", market: "NSE", direction: "up", reason: "Domestic producers gain pricing" },
      { symbol: "IOC.NS", name: "Indian Oil", market: "NSE", direction: "down", reason: "Refining margins under pressure" }
    ]
  },
  {
    id: "russia-ukraine",
    label: "Russia-Ukraine war",
    patterns: ["ukraine", "kyiv", "kiev", "zelensky", "donetsk", "kharkiv", "russia", "putin", "kremlin"],
    impacts: [
      { symbol: "NG=F", name: "Nat Gas", market: "COM", direction: "up", reason: "Supply fears lift gas" },
      { symbol: "ZW=F", name: "Wheat", market: "COM", direction: "up", reason: "Black Sea crop risk" },
      { symbol: "RHM.DE", name: "Rheinmetall", market: "EU", direction: "up", reason: "European rearmament demand" },
      { symbol: "BAESY", name: "BAE Systems", market: "UK", direction: "up", reason: "Defense budgets keep rising" }
    ]
  },
  {
    id: "nato-europe",
    label: "NATO / Europe security",
    patterns: ["nato", "stoltenberg", "rutte nato", "baltic", "poland", "warsaw", "brussels", "european defense"],
    impacts: [
      { symbol: "RHM.DE", name: "Rheinmetall", market: "EU", direction: "up", reason: "NATO spending pledges rise" },
      { symbol: "BAESY", name: "BAE Systems", market: "UK", direction: "up", reason: "Orders backlog likely grows" },
      { symbol: "NG=F", name: "Nat Gas", market: "COM", direction: "up", reason: "Energy security premium stays" }
    ]
  },
  {
    id: "taiwan-strait",
    label: "Taiwan tensions",
    patterns: ["taiwan", "taipei", "taiwan strait", "pla drills", "cross-strait"],
    impacts: [
      { symbol: "TSM", name: "TSMC", market: "US", direction: "down", reason: "Fab disruption fears weigh" },
      { symbol: "NVDA", name: "Nvidia", market: "US", direction: "down", reason: "Chip supply chain risk" },
      { symbol: "LMT", name: "Lockheed Martin", market: "US", direction: "up", reason: "Deterrence spending supports stock" },
      { symbol: "GC=F", name: "Gold", market: "COM", direction: "up", reason: "Safe haven bids gold" }
    ]
  },
  {
    id: "scs-tensions",
    label: "South China Sea",
    patterns: ["south china sea", "scarborough", "second thomas", "philippines", "manila", "vietnam", "hanoi"],
    impacts: [
      { symbol: "TSM", name: "TSMC", market: "US", direction: "down", reason: "Regional risk hurts semis" },
      { symbol: "MAERSK-B.CO", name: "Maersk", market: "EU", direction: "mixed", reason: "Rerouting lifts rates, costs" },
      { symbol: "RTX", name: "RTX", market: "US", direction: "up", reason: "Naval demand supports defense" }
    ]
  },
  {
    id: "china-tensions",
    label: "China tensions / slowdown",
    patterns: ["xi jinping", "beijing", "china", "shanghai", "hong kong", "evergrande", "country garden"],
    impacts: [
      { symbol: "TSM", name: "TSMC", market: "US", direction: "down", reason: "China demand worries weigh" },
      { symbol: "NVDA", name: "Nvidia", market: "US", direction: "down", reason: "Export curb exposure hurts" },
      { symbol: "SI=F", name: "Silver", market: "COM", direction: "mixed", reason: "Industrial demand may soften" }
    ]
  },
  {
    id: "trade-war",
    label: "US-China trade war",
    patterns: ["trade war", "tariff", "tariffs", "section 301", "export control", "decoupling"],
    impacts: [
      { symbol: "NVDA", name: "Nvidia", market: "US", direction: "down", reason: "Chip curbs hit sales" },
      { symbol: "AAPL", name: "Apple", market: "US", direction: "down", reason: "Supply chain cost fears" },
      { symbol: "USDINR=X", name: "USD/INR", market: "FX", direction: "up", reason: "Risk aversion lifts dollar" }
    ]
  },
  {
    id: "tariff-exporters",
    label: "Tariffs on exporters",
    patterns: ["duty hike", "anti-dumping", "import duty", "reciprocal tariff"],
    impacts: [
      { symbol: "TATAMOTORS.NS", name: "Tata Motors", market: "NSE", direction: "down", reason: "Export margins face pressure" },
      { symbol: "INFY.NS", name: "Infosys", market: "NSE", direction: "mixed", reason: "Client budgets may tighten" },
      { symbol: "RELIANCE.NS", name: "Reliance", market: "NSE", direction: "mixed", reason: "Diversified cushion offsets partly" }
    ]
  },
  {
    id: "russia-sanctions",
    label: "Sanctions on Russia",
    patterns: ["sanctions on russia", "russian oil", "ural crude", "price cap", "shadow fleet"],
    impacts: [
      { symbol: "CL=F", name: "WTI Crude", market: "COM", direction: "up", reason: "Tighter barrels lift oil" },
      { symbol: "NG=F", name: "Nat Gas", market: "COM", direction: "up", reason: "Gas rerouting costs rise" },
      { symbol: "MAERSK-B.CO", name: "Maersk", market: "EU", direction: "mixed", reason: "Tanker rates swing widely" }
    ]
  },
  {
    id: "iran-sanctions",
    label: "Sanctions on Iran",
    patterns: ["sanctions on iran", "iranian oil", "iran sanctions", "maximum pressure iran"],
    impacts: [
      { symbol: "BZ=F", name: "Brent Crude", market: "COM", direction: "up", reason: "Lost barrels tighten market" },
      { symbol: "ONGC.NS", name: "ONGC", market: "NSE", direction: "up", reason: "Price upside helps producers" },
      { symbol: "HDFCBANK.NS", name: "HDFC Bank", market: "NSE", direction: "mixed", reason: "Compliance costs may rise" }
    ]
  },
  {
    id: "opec-cuts",
    label: "OPEC cuts",
    patterns: ["opec", "opec+", "output cut", "production cut", "saudi aramco", "riyadh oil"],
    impacts: [
      { symbol: "XOM", name: "Exxon Mobil", market: "US", direction: "up", reason: "Higher prices aid majors" },
      { symbol: "CVX", name: "Chevron", market: "US", direction: "up", reason: "Higher prices aid majors" },
      { symbol: "ASIANPAINT.NS", name: "Asian Paints", market: "NSE", direction: "down", reason: "Input costs hurt paints" },
      { symbol: "MRF.NS", name: "MRF", market: "NSE", direction: "down", reason: "Costlier inputs pressure tyres" }
    ]
  },
  {
    id: "oil-supply",
    label: "Oil supply shock",
    patterns: ["oil surge", "crude surge", "gasoline spike", "refinery outage", "pipeline attack", "fuel shortage"],
    impacts: [
      { symbol: "XOM", name: "Exxon Mobil", market: "US", direction: "up", reason: "Upstream margins expand fast" },
      { symbol: "APOLLOTYRE.NS", name: "Apollo Tyres", market: "NSE", direction: "down", reason: "Rubber, freight costs bite" },
      { symbol: "INDIGO.NS", name: "InterGlobe Aviation", market: "NSE", direction: "down", reason: "Fuel is top cost" }
    ]
  },
  {
    id: "red-sea",
    label: "Red Sea disruption",
    patterns: ["red sea", "houthi", "suez", "bab el-mandeb", "aden"],
    impacts: [
      { symbol: "MAERSK-B.CO", name: "Maersk", market: "EU", direction: "up", reason: "Freight rates spike higher" },
      { symbol: "BZ=F", name: "Brent Crude", market: "COM", direction: "up", reason: "Longer routes delay oil" },
      { symbol: "RELIANCE.NS", name: "Reliance", market: "NSE", direction: "mixed", reason: "Refining gains, retail costs" }
    ]
  },
  {
    id: "shipping-freight",
    label: "Shipping / freight squeeze",
    patterns: ["freight rates", "container rates", "shipping lanes", "port strike", "panama canal"],
    impacts: [
      { symbol: "MAERSK-B.CO", name: "Maersk", market: "EU", direction: "up", reason: "Tight capacity lifts pricing" },
      { symbol: "TATAMOTORS.NS", name: "Tata Motors", market: "NSE", direction: "down", reason: "Logistics costs dent exporters" }
    ]
  },
  {
    id: "fed-policy",
    label: "Fed rate decision",
    patterns: ["federal reserve", "fed ", "powell", "fomc", "us inflation", "us jobs"],
    impacts: [
      { symbol: "HDFCBANK.NS", name: "HDFC Bank", market: "NSE", direction: "mixed", reason: "Rate path drives banks" },
      { symbol: "INFY.NS", name: "Infosys", market: "NSE", direction: "up", reason: "US demand outlook improves" },
      { symbol: "BTC-USD", name: "Bitcoin", market: "CRYPTO", direction: "mixed", reason: "Liquidity bets swing crypto" }
    ]
  },
  {
    id: "ecb-policy",
    label: "ECB rate decision",
    patterns: ["ecb", "lagarde", "eurozone inflation", "euro rate"],
    impacts: [
      { symbol: "BAESY", name: "BAE Systems", market: "UK", direction: "mixed", reason: "Financing costs shift outlook" },
      { symbol: "USDINR=X", name: "USD/INR", market: "FX", direction: "mixed", reason: "Cross-currency flows swing pair" }
    ]
  },
  {
    id: "rbi-policy",
    label: "RBI rate decision",
    patterns: ["rbi", "repo rate", "shaktikanta", "malhotra rbi", "mpc", "india inflation", "nbfc"],
    impacts: [
      { symbol: "HDFCBANK.NS", name: "HDFC Bank", market: "NSE", direction: "up", reason: "NIM outlook improves" },
      { symbol: "SBIN.NS", name: "SBI", market: "NSE", direction: "up", reason: "PSU banks track rates" },
      { symbol: "TCS.NS", name: "TCS", market: "NSE", direction: "mixed", reason: "Domestic demand cues mixed" }
    ]
  },
  {
    id: "india-pakistan",
    label: "India-Pakistan flare-up",
    patterns: ["pakistan", "islamabad", "loc", "line of control", "kashmir", "balakot", "sindoor"],
    impacts: [
      { symbol: "HAL.NS", name: "HAL", market: "NSE", direction: "up", reason: "Defense orders accelerate" },
      { symbol: "BEL.NS", name: "BEL", market: "NSE", direction: "up", reason: "Defense electronics demand rises" },
      { symbol: "HDFCBANK.NS", name: "HDFC Bank", market: "NSE", direction: "down", reason: "Risk-off hits lenders" }
    ]
  },
  {
    id: "india-china-border",
    label: "India-China border",
    patterns: ["ladakh", "galwan", "lac", "arunachal", "doklam", "indo-china border"],
    impacts: [
      { symbol: "HAL.NS", name: "HAL", market: "NSE", direction: "up", reason: "Border buildup aids defense" },
      { symbol: "MAZDOCK.NS", name: "Mazagon Dock", market: "NSE", direction: "up", reason: "Naval orders support growth" },
      { symbol: "BDL.NS", name: "BDL", market: "NSE", direction: "up", reason: "Missile demand seen rising" }
    ]
  },
  {
    id: "cyber-chips",
    label: "Cyberattack / chip controls",
    patterns: ["cyberattack", "ransomware", "chip ban", "export controls chips", "semiconductor curb", "huawei"],
    impacts: [
      { symbol: "NVDA", name: "Nvidia", market: "US", direction: "down", reason: "Curbs threaten chip sales" },
      { symbol: "MSFT", name: "Microsoft", market: "US", direction: "down", reason: "Cloud security fears weigh" },
      { symbol: "TCS.NS", name: "TCS", market: "NSE", direction: "mixed", reason: "Security deals offset weakness" }
    ]
  },
  {
    id: "ai-regulation",
    label: "AI regulation",
    patterns: ["ai regulation", "ai safety", "frontier ai", "eu ai act", "openai"],
    impacts: [
      { symbol: "NVDA", name: "Nvidia", market: "US", direction: "mixed", reason: "Rules cloud AI rollout" },
      { symbol: "MSFT", name: "Microsoft", market: "US", direction: "mixed", reason: "Compliance costs may rise" },
      { symbol: "INFY.NS", name: "Infosys", market: "NSE", direction: "up", reason: "AI services demand grows" }
    ]
  },
  {
    id: "grain-ban",
    label: "Food / grain export bans",
    patterns: ["wheat ban", "rice ban", "grain deal", "black sea grain", "fertilizer shortage", "food prices", "export ban"],
    impacts: [
      { symbol: "ZW=F", name: "Wheat", market: "COM", direction: "up", reason: "Tight supply lifts wheat" },
      { symbol: "CHAMBLFERT.NS", name: "Chambal Fertilisers", market: "NSE", direction: "up", reason: "Fertilizer pricing firms up" },
      { symbol: "HINDUNILVR.NS", name: "HUL", market: "NSE", direction: "down", reason: "Input inflation pressures FMCG" }
    ]
  },
  {
    id: "dollar-surge",
    label: "Dollar surge / FX stress",
    patterns: ["dollar surge", "dollar index", "rupee falls", "rupee hits", "currency crisis", "forex reserves", "devaluation"],
    impacts: [
      { symbol: "USDINR=X", name: "USD/INR", market: "FX", direction: "up", reason: "Dollar strength pressures rupee" },
      { symbol: "INFY.NS", name: "Infosys", market: "NSE", direction: "up", reason: "Weak rupee aids exporters" },
      { symbol: "INDIGO.NS", name: "InterGlobe Aviation", market: "NSE", direction: "down", reason: "Dollar costs hurt importers" }
    ]
  },
  {
    id: "election-unrest",
    label: "Elections / coup / unrest",
    patterns: ["coup", "martial law", "election crisis", "protests erupt", "unrest", "state of emergency", "parliament dissolved"],
    impacts: [
      { symbol: "^VIX", name: "VIX", market: "US", direction: "up", reason: "Political risk lifts volatility" },
      { symbol: "GC=F", name: "Gold", market: "COM", direction: "up", reason: "Uncertainty drives haven flows" },
      { symbol: "BTC-USD", name: "Bitcoin", market: "CRYPTO", direction: "mixed", reason: "Risk-off swings crypto both" }
    ]
  },
  {
    id: "gold-haven",
    label: "Gold / safe-haven flight",
    patterns: ["gold hits", "safe haven", "flight to safety", "record gold", "central bank buying gold"],
    impacts: [
      { symbol: "GC=F", name: "Gold", market: "COM", direction: "up", reason: "Haven demand lifts bullion" },
      { symbol: "TITAN.NS", name: "Titan", market: "NSE", direction: "mixed", reason: "Jewellery margins get squeezed" },
      { symbol: "^VIX", name: "VIX", market: "US", direction: "up", reason: "Fear gauge usually rises" }
    ]
  },
  {
    id: "crypto-riskoff",
    label: "Crypto on risk-off",
    patterns: ["bitcoin", "crypto crash", "crypto selloff", "stablecoin", "etf outflow"],
    impacts: [
      { symbol: "BTC-USD", name: "Bitcoin", market: "CRYPTO", direction: "down", reason: "Risk-off triggers crypto selling" },
      { symbol: "GC=F", name: "Gold", market: "COM", direction: "up", reason: "Rotation favors hard havens" }
    ]
  }
];

// src/lib/types.ts
var NEUTRAL_IMPACT = {
  themes: [],
  impacts: [],
  severity: 1,
  sentiment: "neutral"
};

// src/lib/impact.ts
var ESCALATION = [
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
var DEESCALATION = ["ceasefire", "peace deal", "truce", "armistice", "rate cut", "dovish pause", "breakthrough talks"];
var RISKOFF_HINTS = ["war", "attack", "crisis", "surge", "ban", "tariff", "sanction", "coup", "missile", "strike", "fear", "plunge"];
function rankDir(d) {
  if (d === "up") return 2;
  if (d === "down") return 2;
  return 1;
}
var cache = /* @__PURE__ */ new Map();
function normKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
}
function scoreItem(title, _snippet = "") {
  const key = normKey(title);
  const hit = cache.get(key);
  if (hit) return hit;
  const t = ` ${title.toLowerCase()} `;
  const matchedThemes = [];
  const bySymbol = /* @__PURE__ */ new Map();
  for (const theme of THEMES) {
    const matched = theme.patterns.some((p) => t.includes(p));
    if (!matched) continue;
    matchedThemes.push(theme.id);
    for (const imp of theme.impacts) {
      const prev = bySymbol.get(imp.symbol);
      if (!prev) {
        bySymbol.set(imp.symbol, { ...imp });
      } else if (prev.direction !== imp.direction) {
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
    if (t.includes(e.w)) esc += e.pts;
  }
  const raw = 1 + Math.min(2, matchedThemes.length - 1) + Math.min(2, esc);
  const severity = Math.max(1, Math.min(5, raw));
  const hasDeesc = DEESCALATION.some((w) => t.includes(w));
  const hasRiskOff = RISKOFF_HINTS.some((w) => t.includes(w));
  let sentiment = "neutral";
  if (hasDeesc && severity <= 3) sentiment = "risk-on";
  else if (severity >= 3 || hasRiskOff) sentiment = "risk-off";
  const impacts = [...bySymbol.values()].sort((a, b) => {
    const ra = rankDir(a.direction) - rankDir(b.direction);
    if (ra !== 0) return -ra;
    return a.symbol.localeCompare(b.symbol);
  }).slice(0, 8);
  const out = { themes: matchedThemes, impacts, severity, sentiment };
  if (cache.size > 2e3) cache.clear();
  cache.set(key, out);
  return out;
}
function impactChipSuffix(impact, top = 3) {
  if (impact.impacts.length === 0) return "";
  const arrow = (d) => d === "up" ? "\u25B2" : d === "down" ? "\u25BC" : "\u25C6";
  const short = (s) => s.replace(/\.NS$/, "").replace(/-USD$/, "").replace(/=F$/, "").replace(/=X$/, "").replace(/\.DE$/, "").replace(/-B\.CO$/, "");
  return impact.impacts.slice(0, top).map((a) => `${arrow(a.direction)}${short(a.symbol)}`).join(" ");
}
function marketMood(items) {
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
  const net = (riskOff - riskOn) / items.length;
  const score = Math.max(0, Math.min(1, 0.55 * avgSev + 0.45 * (net * 0.5 + 0.5)));
  const label = score < 0.3 ? "CALM" : score < 0.5 ? "WARY" : score < 0.7 ? "TENSE" : "ALARM";
  return { label, score, riskOff, riskOn };
}
function hotAssets(items, hours = 1, top = 5) {
  const cutoff = Date.now() - hours * 3600 * 1e3;
  const counts = /* @__PURE__ */ new Map();
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
  return [...counts.entries()].map(([symbol, e]) => {
    const direction = e.up >= e.down && e.up >= e.mixed ? "up" : e.down >= e.mixed ? "down" : "mixed";
    return { symbol, name: e.name, direction, count: e.total };
  }).sort((a, b) => b.count - a.count).slice(0, top);
}

// src/components/Marquee.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function regionColor(r) {
  switch (r) {
    case "Middle East":
      return "red";
    case "Europe":
      return "blue";
    case "Asia-Pacific":
      return "green";
    case "Americas":
      return "yellow";
    case "Africa":
      return "magenta";
    default:
      return "white";
  }
}
function Marquee({ items, width, offsetChars, now, noColor: noColor2, theme, pulse }) {
  const sep = pulse ? " \u25C6 " : " \u25AA ";
  const runs = useMemo(() => {
    if (items.length === 0) return [{ text: " Loading headlines\u2026 ", color: "gray" }];
    const gain = themeColor(theme.gain, theme.gainFallback, noColor2);
    const loss = themeColor(theme.loss, theme.lossFallback, noColor2);
    const mixed = themeColor(theme.mixed, "yellow", noColor2);
    const out = [];
    items.forEach((it, i) => {
      if (i > 0) out.push({ text: sep, color: "gray", dim: true });
      out.push({ text: ` ${it.region} `, color: regionColor(it.region), bold: true });
      out.push({ text: ` ${it.title} ` });
      const chip = impactChipSuffix(it.impact, 3);
      if (chip) {
        out.push({ text: ` ${chip} `, color: void 0, bold: true });
        void gain;
        void loss;
        void mixed;
      }
      out.push({ text: `\u2014 ${it.source} \xB7 ${timeAgo(it.published, now)}`, color: "gray" });
    });
    out.push({ text: sep, color: "gray", dim: true });
    return out;
  }, [items, now, sep, noColor2, theme]);
  const window_ = useMemo(() => {
    const w = Math.max(1, width);
    const chars = [];
    const colors = [];
    const bolds = [];
    for (const r of runs) {
      for (const ch of r.text) {
        chars.push(ch);
        colors.push(noColor2 ? void 0 : r.color);
        bolds.push(Boolean(r.bold));
      }
    }
    const widths = chars.map((c) => Math.max(0, stringWidth2(c)));
    const total = widths.reduce((a, b) => a + b, 0);
    if (total === 0) return [{ text: " ".repeat(w) }];
    const start = (offsetChars % total + total) % total;
    let col = 0;
    let idx = 0;
    for (let i2 = 0; i2 < chars.length; i2++) {
      const cw = widths[i2] ?? 0;
      if (col + cw > start) {
        idx = col < start ? i2 + 1 : i2;
        break;
      }
      col += cw;
      idx = i2 + 1;
    }
    let used = 0;
    let i = idx % Math.max(1, chars.length);
    const picked = [];
    let guard = 0;
    while (used < w && guard < chars.length * 3 + 10) {
      guard++;
      if (chars.length === 0) break;
      if (i >= chars.length) i = 0;
      const cw = widths[i] ?? 0;
      if (used + cw > w) break;
      picked.push({ ch: chars[i], color: colors[i], bold: bolds[i] });
      used += cw;
      i++;
    }
    while (used < w) {
      picked.push({ ch: " ", color: void 0, bold: false });
      used += 1;
    }
    const res = [];
    for (const p of picked) {
      const last = res[res.length - 1];
      if (last && last.color === p.color && Boolean(last.bold) === p.bold) last.text += p.ch;
      else res.push({ text: p.ch, color: p.color, bold: p.bold });
    }
    return res;
  }, [runs, width, offsetChars, noColor2]);
  return /* @__PURE__ */ jsxs2(Box2, { width: "100%", overflow: "hidden", children: [
    /* @__PURE__ */ jsx2(Text2, { color: noColor2 ? void 0 : "gray", dimColor: !noColor2, children: "\u25C0" }),
    /* @__PURE__ */ jsx2(Text2, { wrap: "truncate", children: window_.map((r, i) => /* @__PURE__ */ jsx2(Text2, { color: r.color, bold: r.bold, children: r.text }, i)) }),
    /* @__PURE__ */ jsx2(Text2, { color: noColor2 ? void 0 : "gray", dimColor: !noColor2, children: "\u25B6" })
  ] });
}
var Marquee_default = React2.memo(Marquee);

// src/components/FilterBar.tsx
import React3 from "react";
import { Box as Box3, Text as Text3 } from "ink";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var FILTERS = ["All", "Middle East", "Europe", "Asia-Pacific", "Americas", "Africa"];
function FilterBar({ active, counts, impactOnly, impactCount, search, searchMode, noColor: noColor2, theme }) {
  const accent = themeColor(theme.accent, theme.accentFallback, noColor2);
  return /* @__PURE__ */ jsxs3(Box3, { width: "100%", gap: 1, flexWrap: "wrap", children: [
    FILTERS.map((f, i) => {
      const isActive = f === active;
      const label = ` ${i} ${f} (${counts[f] ?? 0}) `;
      return /* @__PURE__ */ jsx3(
        Text3,
        {
          color: noColor2 ? void 0 : isActive ? "black" : accent,
          backgroundColor: noColor2 ? void 0 : isActive ? accent : void 0,
          bold: isActive,
          children: label
        },
        f
      );
    }),
    /* @__PURE__ */ jsx3(
      Text3,
      {
        color: noColor2 ? void 0 : impactOnly ? "black" : "red",
        backgroundColor: noColor2 ? void 0 : impactOnly ? "red" : void 0,
        bold: impactOnly,
        children: ` i IMPACT\u22653 (${impactCount}) `
      }
    ),
    searchMode || search ? /* @__PURE__ */ jsxs3(Text3, { color: noColor2 ? void 0 : "cyan", children: [
      " /",
      search,
      "\u2588"
    ] }) : null
  ] });
}
var FilterBar_default = React3.memo(FilterBar);

// src/components/HeadlineList.tsx
import React4, { useMemo as useMemo2 } from "react";
import { Box as Box4, Text as Text4 } from "ink";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function ageDim(published, now) {
  return now.getTime() - published.getTime() > 3 * 3600 * 1e3;
}
function isNew(published, now) {
  return now.getTime() - published.getTime() < 5 * 60 * 1e3;
}
function HeadlineList({ items, selected, height, width, now, noColor: noColor2, theme, focused }) {
  const border = themeColor(theme.border, theme.borderFallback, noColor2);
  const accent = themeColor(theme.accent, theme.accentFallback, noColor2);
  const cyan = themeColor(theme.cyan, "cyan", noColor2);
  const visible = useMemo2(() => {
    const h = Math.max(1, height);
    if (items.length === 0) return { slice: [], start: 0 };
    let start = 0;
    if (selected >= h) start = Math.min(selected - h + 1, Math.max(0, items.length - h));
    start = Math.max(0, Math.min(start, Math.max(0, items.length - h)));
    return { slice: items.slice(start, start + h), start };
  }, [items, selected, height]);
  return /* @__PURE__ */ jsxs4(
    Box4,
    {
      flexDirection: "column",
      flexGrow: 1,
      overflow: "hidden",
      borderStyle: "round",
      borderColor: border,
      paddingLeft: 1,
      paddingRight: 1,
      children: [
        /* @__PURE__ */ jsxs4(Box4, { children: [
          /* @__PURE__ */ jsx4(Text4, { color: accent, bold: true, children: "HEADLINES" }),
          /* @__PURE__ */ jsxs4(Text4, { color: noColor2 ? void 0 : "gray", children: [
            " ",
            items.length,
            " \xB7 ",
            focused ? "FOCUSED" : "tab to focus"
          ] })
        ] }),
        items.length === 0 ? /* @__PURE__ */ jsxs4(Box4, { flexDirection: "column", children: [
          /* @__PURE__ */ jsx4(Text4, { color: noColor2 ? void 0 : "gray", children: "No headlines match this view." }),
          /* @__PURE__ */ jsx4(Text4, { color: noColor2 ? void 0 : "gray", children: "Try clearing search (Esc) or toggling filters." })
        ] }) : visible.slice.map((it, i) => {
          const globalIdx = visible.start + i;
          const isSel = globalIdx === selected;
          const dim = ageDim(it.published, now);
          const fresh = isNew(it.published, now);
          const chip = impactChipSuffix(it.impact, 3);
          const ago = timeAgo(it.published, now);
          const inner = `${it.title} \u2014 ${it.source} \xB7 ${ago}${chip ? ` ${chip}` : ""}`;
          const truncated = truncateByWidth(inner, Math.max(10, width - 14));
          return /* @__PURE__ */ jsxs4(Box4, { width: "100%", children: [
            /* @__PURE__ */ jsx4(Text4, { color: noColor2 ? void 0 : isSel ? cyan : border, children: isSel ? "\u258C" : " " }),
            /* @__PURE__ */ jsx4(Text4, { color: regionColor(it.region), backgroundColor: void 0, bold: true, children: ` ${it.region.toUpperCase().slice(0, 12).padEnd(12, " ")} ` }),
            /* @__PURE__ */ jsx4(
              Text4,
              {
                color: noColor2 ? void 0 : isSel ? "black" : dim ? "gray" : void 0,
                backgroundColor: noColor2 ? void 0 : isSel ? cyan : void 0,
                bold: isSel,
                dimColor: !noColor2 && dim && !isSel,
                wrap: "truncate",
                children: truncated
              }
            ),
            fresh ? /* @__PURE__ */ jsx4(Text4, { color: noColor2 ? void 0 : "black", backgroundColor: noColor2 ? void 0 : "green", bold: true, children: " NEW " }) : null
          ] }, `${globalIdx}-${it.title}`);
        })
      ]
    }
  );
}
var HeadlineList_default = React4.memo(HeadlineList);

// src/components/ImpactPane.tsx
import React5, { useMemo as useMemo3 } from "react";
import { Box as Box5, Text as Text5 } from "ink";
import { Fragment, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function arrowFor(d) {
  if (d === "up") return { arrow: "\u25B2", kind: "up" };
  if (d === "down") return { arrow: "\u25BC", kind: "down" };
  return { arrow: "\u25C6", kind: "mixed" };
}
function ImpactPane({ item, quotes, pricesOn, focused, scroll, height, width, now, noColor: noColor2, theme }) {
  const border = themeColor(theme.border, theme.borderFallback, noColor2);
  const accent = themeColor(theme.accent, theme.accentFallback, noColor2);
  const gain = themeColor(theme.gain, theme.gainFallback, noColor2);
  const loss = themeColor(theme.loss, theme.lossFallback, noColor2);
  const mixedC = themeColor(theme.mixed, "yellow", noColor2);
  const rows = useMemo3(() => item?.impact.impacts ?? [], [item]);
  const maxRows = Math.max(1, height - 8);
  const start = Math.max(0, Math.min(scroll, Math.max(0, rows.length - maxRows)));
  const slice = rows.slice(start, start + maxRows);
  return /* @__PURE__ */ jsxs5(
    Box5,
    {
      flexDirection: "column",
      flexGrow: 1,
      overflow: "hidden",
      borderStyle: "round",
      borderColor: border,
      paddingLeft: 1,
      paddingRight: 1,
      children: [
        /* @__PURE__ */ jsxs5(Box5, { children: [
          /* @__PURE__ */ jsx5(Text5, { color: accent, bold: true, children: "IMPACT" }),
          /* @__PURE__ */ jsx5(Text5, { color: noColor2 ? void 0 : "gray", children: focused ? " \xB7 FOCUSED" : " \xB7 tab" })
        ] }),
        !item ? /* @__PURE__ */ jsx5(Text5, { color: noColor2 ? void 0 : "gray", children: "Select a headline to see impact." }) : /* @__PURE__ */ jsxs5(Fragment, { children: [
          /* @__PURE__ */ jsx5(Text5, { bold: true, wrap: "truncate", children: truncateByWidth(item.title, Math.max(10, width - 4)) }),
          /* @__PURE__ */ jsxs5(Box5, { gap: 1, children: [
            /* @__PURE__ */ jsxs5(Text5, { color: item.impact.severity >= 3 ? loss : noColor2 ? void 0 : "gray", children: [
              severityMeter(item.impact.severity),
              " ",
              item.impact.severity,
              "/5"
            ] }),
            /* @__PURE__ */ jsx5(
              Text5,
              {
                color: noColor2 ? void 0 : item.impact.sentiment === "risk-off" ? "white" : item.impact.sentiment === "risk-on" ? "black" : "gray",
                backgroundColor: noColor2 ? void 0 : item.impact.sentiment === "risk-off" ? "red" : item.impact.sentiment === "risk-on" ? "green" : void 0,
                bold: true,
                children: ` ${item.impact.sentiment.toUpperCase()} `
              }
            ),
            /* @__PURE__ */ jsx5(Text5, { color: noColor2 ? void 0 : "gray", children: timeAgo(item.published, now) })
          ] }),
          /* @__PURE__ */ jsx5(Text5, { color: accent, bold: true, children: "AFFECTED ASSETS" }),
          slice.length === 0 ? /* @__PURE__ */ jsx5(Text5, { color: noColor2 ? void 0 : "gray", children: "No strong asset link for this story." }) : slice.map((a) => {
            const { arrow, kind } = arrowFor(a.direction);
            const color = kind === "up" ? gain : kind === "down" ? loss : mixedC;
            const q = pricesOn ? quotes.get(a.symbol) : void 0;
            const price = q ? q.price.toFixed(2) : "--";
            const chg = q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "--";
            const spark = q ? sparkline(q.points) : "\u2500";
            const line = `${a.symbol} ${a.name} ${price} ${chg} ${spark} ${a.reason}`;
            return /* @__PURE__ */ jsxs5(Box5, { width: "100%", children: [
              /* @__PURE__ */ jsxs5(Text5, { color, bold: true, children: [
                arrow,
                " "
              ] }),
              /* @__PURE__ */ jsxs5(Text5, { wrap: "truncate", children: [
                /* @__PURE__ */ jsx5(Text5, { bold: true, children: a.symbol }),
                /* @__PURE__ */ jsxs5(Text5, { color: noColor2 ? void 0 : "gray", children: [
                  " ",
                  truncateByWidth(a.name, 14),
                  " "
                ] }),
                /* @__PURE__ */ jsxs5(Text5, { children: [
                  price,
                  " "
                ] }),
                /* @__PURE__ */ jsxs5(Text5, { color: q && q.changePct < 0 ? loss : gain, children: [
                  chg,
                  " "
                ] }),
                /* @__PURE__ */ jsxs5(Text5, { color: noColor2 ? void 0 : "gray", children: [
                  spark,
                  " "
                ] }),
                /* @__PURE__ */ jsx5(Text5, { color: noColor2 ? void 0 : "gray", children: truncateByWidth(a.reason, 24) })
              ] }),
              /* @__PURE__ */ jsx5(Text5, { color: noColor2 ? void 0 : "gray", children: line.length > width ? "" : "" })
            ] }, a.symbol);
          }),
          rows.length > maxRows ? /* @__PURE__ */ jsxs5(Text5, { color: noColor2 ? void 0 : "gray", children: [
            start + 1,
            "-",
            start + slice.length,
            "/",
            rows.length,
            " \u2191\u2193 scroll"
          ] }) : null
        ] })
      ]
    }
  );
}
var ImpactPane_default = React5.memo(ImpactPane);

// src/components/HotAssets.tsx
import React6, { useMemo as useMemo4 } from "react";
import { Box as Box6, Text as Text6 } from "ink";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function HotAssets({ items, noColor: noColor2, theme }) {
  const border = themeColor(theme.border, theme.borderFallback, noColor2);
  const accent = themeColor(theme.accent, theme.accentFallback, noColor2);
  const gain = themeColor(theme.gain, theme.gainFallback, noColor2);
  const loss = themeColor(theme.loss, theme.lossFallback, noColor2);
  const mixed = themeColor(theme.mixed, "yellow", noColor2);
  const hot = useMemo4(() => hotAssets(items, 1, 5), [items]);
  return /* @__PURE__ */ jsxs6(Box6, { flexDirection: "column", borderStyle: "round", borderColor: border, paddingLeft: 1, paddingRight: 1, children: [
    /* @__PURE__ */ jsx6(Text6, { color: accent, bold: true, children: "HOT ASSETS \xB7 1H" }),
    hot.length === 0 ? /* @__PURE__ */ jsx6(Text6, { color: noColor2 ? void 0 : "gray", children: "Not enough fresh signal yet." }) : hot.map((h) => {
      const arrow = h.direction === "up" ? "\u25B2" : h.direction === "down" ? "\u25BC" : "\u25C6";
      const color = h.direction === "up" ? gain : h.direction === "down" ? loss : mixed;
      return /* @__PURE__ */ jsxs6(Text6, { wrap: "truncate", children: [
        /* @__PURE__ */ jsxs6(Text6, { color, bold: true, children: [
          arrow,
          " "
        ] }),
        /* @__PURE__ */ jsx6(Text6, { bold: true, children: h.symbol }),
        /* @__PURE__ */ jsxs6(Text6, { color: noColor2 ? void 0 : "gray", children: [
          " ",
          h.name,
          " \xD7",
          h.count
        ] })
      ] }, h.symbol);
    })
  ] });
}
var HotAssets_default = React6.memo(HotAssets);

// src/components/HelpOverlay.tsx
import React7 from "react";
import { Box as Box7, Text as Text7 } from "ink";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var ROWS = [
  ["0-5 / \u2190/\u2192", "change region filter"],
  ["\u2191/\u2193 or j/k", "move selection (scroll assets when impact focused)"],
  ["Tab", "switch focus list / impact"],
  ["Enter / o", "open link in browser"],
  ["Space", "pause / resume marquee"],
  ["r", "refresh now"],
  ["/ then Esc", "search headlines / clear"],
  ["i", "toggle impact-only filter (severity \u2265 3)"],
  ["p", "toggle live prices"],
  ["t", "cycle color theme"],
  ["?", "toggle this help"],
  ["q / Ctrl+C", "quit"]
];
function HelpOverlay() {
  return /* @__PURE__ */ jsxs7(Box7, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingLeft: 2, paddingRight: 2, children: [
    /* @__PURE__ */ jsx7(Text7, { color: "cyan", bold: true, children: "KEYS" }),
    ROWS.map(([k, d]) => /* @__PURE__ */ jsxs7(Text7, { children: [
      /* @__PURE__ */ jsx7(Text7, { bold: true, children: k.padEnd(18, " ") }),
      /* @__PURE__ */ jsxs7(Text7, { children: [
        " ",
        d
      ] })
    ] }, k)),
    /* @__PURE__ */ jsx7(Text7, { color: "gray", children: "Press ? or Esc to close" })
  ] });
}
var HelpOverlay_default = React7.memo(HelpOverlay);

// src/components/Footer.tsx
import React8 from "react";
import { Box as Box8, Text as Text8 } from "ink";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function Footer({ noColor: noColor2, themeLabel }) {
  return /* @__PURE__ */ jsxs8(Box8, { width: "100%", flexDirection: "column", children: [
    /* @__PURE__ */ jsxs8(Text8, { color: noColor2 ? void 0 : "gray", wrap: "truncate", children: [
      "tab focus \xB7 i impact \xB7 p prices \xB7 ? help \xB7 t theme(",
      themeLabel,
      ") \xB7 q quit"
    ] }),
    /* @__PURE__ */ jsx8(Text8, { color: noColor2 ? void 0 : "gray", dimColor: !noColor2, children: "Rule-based signals, not financial advice." })
  ] });
}
var Footer_default = React8.memo(Footer);

// src/hooks/useNews.ts
import { useCallback, useEffect, useRef, useState } from "react";

// src/lib/feeds.ts
import Parser from "rss-parser";

// src/lib/regions.ts
var KEYWORDS = {
  "Middle East": [
    "israel",
    "gaza",
    "palestine",
    "palestinian",
    "hamas",
    "hezbollah",
    "iran",
    "tehran",
    "iraq",
    "baghdad",
    "syria",
    "damascus",
    "lebanon",
    "beirut",
    "yemen",
    "houthi",
    "saudi",
    "riyadh",
    "qatar",
    "doha",
    "uae",
    "emirates",
    "abu dhabi",
    "dubai",
    "jordan",
    "amman",
    "turkiye",
    "turkey",
    "erdogan",
    "ankara",
    "netanyahu",
    "jerusalem",
    "tel aviv",
    "gulf",
    "opec",
    "red sea",
    "sinai",
    "kurd"
  ],
  Europe: [
    "europe",
    "european",
    "eu ",
    "ukraine",
    "kyiv",
    "kiev",
    "zelensky",
    "zelenskyy",
    "russia",
    "putin",
    "kremlin",
    "moscow",
    "france",
    "macron",
    "paris",
    "germany",
    "berlin",
    "merz",
    "scholz",
    "britain",
    "london",
    "starmer",
    "united kingdom",
    "italy",
    "rome",
    "meloni",
    "spain",
    "madrid",
    "poland",
    "warsaw",
    "nato",
    "brussels",
    "balkans",
    "serbia",
    "belgrade",
    "hungary",
    "orban",
    "budapest",
    "belarus",
    "minsk",
    "moldova",
    "georgia",
    "tbilisi",
    "armenia",
    "azerbaijan",
    "eu,",
    "e.u.",
    "brexit",
    "oslo",
    "stockholm",
    "helsinki",
    "copenhagen"
  ],
  "Asia-Pacific": [
    "china",
    "beijing",
    "xi jinping",
    "taiwan",
    "taipei",
    "hong kong",
    "japan",
    "tokyo",
    "ishiba",
    "korea",
    "seoul",
    "pyongyang",
    "kim jong",
    "india",
    "modi",
    "new delhi",
    "delhi",
    "pakistan",
    "islamabad",
    "kashmir",
    "australia",
    "canberra",
    "asean",
    "south china sea",
    "philippines",
    "manila",
    "marcos",
    "vietnam",
    "hanoi",
    "indonesia",
    "jakarta",
    "thailand",
    "bangkok",
    "myanmar",
    "bangladesh",
    "dhaka",
    "sri lanka",
    "afghanistan",
    "kabul",
    "pacific",
    "apec",
    "quad",
    "aukus",
    "north korea",
    "south korea",
    "mongolia",
    "singapore",
    "malaysia",
    "kuala lumpur",
    "new zealand"
  ],
  Americas: [
    "united states",
    "america",
    "washington",
    "white house",
    "biden",
    "trump",
    "vance",
    "rubio",
    "congress",
    "senate",
    "pentagon",
    "state department",
    "canada",
    "ottawa",
    "carney",
    "mexico",
    "mexico city",
    "sheinbaum",
    "brazil",
    "brasilia",
    "lula",
    "argentina",
    "milei",
    "buenos aires",
    "venezuela",
    "caracas",
    "maduro",
    "colombia",
    "bogota",
    "petro",
    "cuba",
    "havana",
    "latin america",
    "panama",
    "greenland",
    "oas",
    "us-mexico",
    "u.s.",
    "u.s ",
    " usa",
    "usa ",
    "us "
  ],
  Africa: [
    "africa",
    "african",
    "nigeria",
    "abuja",
    "tinubu",
    "kenya",
    "nairobi",
    "ruto",
    "ethiopia",
    "addis",
    "sudan",
    "khartoum",
    "south africa",
    "pretoria",
    "ramaphosa",
    "rwanda",
    "kigali",
    "kagame",
    "congo",
    "kinshasa",
    "sahel",
    "mali",
    "bamako",
    "niger ",
    "niamey",
    "somalia",
    "mogadishu",
    "libya",
    "tripoli",
    "algeria",
    "algiers",
    "morocco",
    "rabat",
    "tunisia",
    "tunis",
    "egypt",
    "cairo",
    "sisi",
    "ghana",
    "accra",
    "senegal",
    "dakar",
    "au summit",
    "african union",
    "darfur",
    "tigray"
  ]
};
var GLOBAL_KEYWORDS = [
  "united nations",
  "u.n.",
  "security council",
  "g7",
  "g-7",
  "g20",
  "g-20",
  "world bank",
  "imf",
  "wto",
  "climate summit",
  "cop30",
  "cop29",
  "global",
  "world order",
  "nuclear treaty",
  "geneva talks"
];
function tagRegion(text) {
  const t = ` ${text.toLowerCase()} `;
  const regions = Object.keys(KEYWORDS);
  for (const region of regions) {
    for (const kw of KEYWORDS[region]) {
      if (t.includes(kw)) return region;
    }
  }
  for (const kw of GLOBAL_KEYWORDS) {
    if (t.includes(kw)) return "Global";
  }
  return "Global";
}
function normalizeRegionName(name) {
  const n = name.trim().toLowerCase();
  if (n === "all") return "All";
  if (n === "middle east" || n === "middle-east" || n === "mideast" || n === "me") return "Middle East";
  if (n === "europe" || n === "eu") return "Europe";
  if (n === "asia-pacific" || n === "asia pacific" || n === "asia" || n === "apac" || n === "indo-pacific") return "Asia-Pacific";
  if (n === "americas" || n === "america" || n === "us" || n === "americas ") return "Americas";
  if (n === "africa") return "Africa";
  if (n === "global" || n === "world" || n === "other") return "Global";
  return null;
}

// src/lib/feeds.ts
var FEEDS = [
  { name: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=geopolitics+OR+diplomacy+OR+sanctions+when:1d"
  },
  { name: "Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "DW", url: "https://rss.dw.com/rdf/rss-en-world" },
  { name: "NPR", url: "https://feeds.npr.org/1004/rss.xml" }
];
var parser = new Parser({ timeout: 5e3 });
function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}
function withTimeout(p, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("feed timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
async function fetchOne(feed) {
  const data = await withTimeout(parser.parseURL(feed.url), 5e3);
  const items = Array.isArray(data.items) ? data.items : [];
  const out = [];
  for (const it of items) {
    try {
      const rawTitle = typeof it.title === "string" ? it.title.trim() : "";
      if (!rawTitle) continue;
      const title = rawTitle.replace(/\s+/g, " ");
      const link = typeof it.link === "string" ? it.link : "";
      let published = /* @__PURE__ */ new Date();
      if (typeof it.pubDate === "string" && it.pubDate) {
        const d = new Date(it.pubDate);
        if (!Number.isNaN(d.getTime())) published = d;
      } else if (typeof it.isoDate === "string" && it.isoDate) {
        const d = new Date(it.isoDate);
        if (!Number.isNaN(d.getTime())) published = d;
      }
      out.push({
        title,
        source: feed.name,
        link,
        published,
        region: tagRegion(`${title} ${it.contentSnippet ?? ""}`),
        impact: scoreItem(title)
      });
    } catch {
      continue;
    }
  }
  return out;
}
async function fetchFeeds() {
  const settled = await Promise.allSettled(FEEDS.map((f) => fetchOne(f)));
  const all = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      for (const n of r.value) all.push(n);
    }
  }
  if (all.length === 0) {
    throw new Error("all feeds failed");
  }
  const seen = /* @__PURE__ */ new Map();
  for (const item of all) {
    const key = normalizeTitle(item.title);
    if (!key) continue;
    const prev = seen.get(key);
    if (!prev || item.published.getTime() > prev.published.getTime()) {
      seen.set(key, item);
    }
  }
  const deduped = [...seen.values()];
  deduped.sort((a, b) => b.published.getTime() - a.published.getTime());
  return deduped.slice(0, 80);
}

// src/hooks/useNews.ts
function useNews(intervalMs) {
  const [items, setItems] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const mounted = useRef(true);
  const load = useCallback(async () => {
    try {
      const fresh = await fetchFeeds();
      if (!mounted.current) return;
      setItems(fresh);
      setUpdatedAt(/* @__PURE__ */ new Date());
      setOffline(false);
      setLoading(false);
    } catch {
      if (!mounted.current) return;
      setOffline(true);
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load, refreshCount]);
  useEffect(() => {
    if (intervalMs <= 0) return;
    const t = setInterval(() => {
      void load();
    }, intervalMs);
    return () => clearInterval(t);
  }, [load, intervalMs]);
  const refresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);
  return { items, updatedAt, offline, loading, refresh, refreshCount };
}

// src/hooks/useQuotes.ts
import { useEffect as useEffect2, useState as useState2 } from "react";

// src/lib/quotes.ts
var cache2 = /* @__PURE__ */ new Map();
var TTL = 60 * 1e3;
function withTimeout2(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}
async function fetchOne2(symbol) {
  const cached = cache2.get(symbol);
  if (cached && Date.now() - cached.ts < TTL) return cached.q;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  const { signal, done } = withTimeout2(4e3);
  try {
    const res = await fetch(url, { signal, headers: { "User-Agent": "geoticker/1.0" } });
    if (!res.ok) return cached?.q ?? null;
    const j = await res.json();
    const r = j.chart?.result?.[0];
    const price = r?.meta?.regularMarketPrice;
    if (typeof price !== "number" || !Number.isFinite(price)) return cached?.q ?? null;
    const prev = r?.meta?.previousClose ?? r?.meta?.chartPreviousClose;
    const closes = r?.indicators?.quote?.[0]?.close ?? [];
    const pts = closes.filter((v) => typeof v === "number" && Number.isFinite(v)).slice(-20);
    const changePct = typeof prev === "number" && prev !== 0 ? (price - prev) / prev * 100 : 0;
    const q = { symbol, price, changePct, points: pts.length > 0 ? pts : [price] };
    cache2.set(symbol, { q, ts: Date.now() });
    return q;
  } catch {
    return cached?.q ?? null;
  } finally {
    done();
  }
}
async function fetchQuotes(symbols) {
  const uniq = [...new Set(symbols)].slice(0, 24);
  const out = /* @__PURE__ */ new Map();
  const missing = [];
  for (const s of uniq) {
    const c = cache2.get(s);
    if (c && Date.now() - c.ts < TTL) out.set(s, c.q);
    else missing.push(s);
  }
  if (missing.length === 0) return out;
  const settled = await Promise.allSettled(missing.map((s) => fetchOne2(s)));
  settled.forEach((r, i) => {
    const sym = missing[i];
    if (r.status === "fulfilled" && r.value) out.set(sym, r.value);
  });
  return out;
}

// src/hooks/useQuotes.ts
function useQuotes(symbols, enabled) {
  const [quotes, setQuotes] = useState2(/* @__PURE__ */ new Map());
  const key = symbols.slice().sort().join(",");
  useEffect2(() => {
    if (!enabled || symbols.length === 0) return;
    let alive = true;
    void fetchQuotes(symbols).then((m) => {
      if (alive && m.size > 0) setQuotes(m);
    }).catch(() => void 0);
    return () => {
      alive = false;
    };
  }, [key, enabled]);
  return quotes;
}

// src/hooks/useTick.ts
import { useEffect as useEffect3, useState as useState3 } from "react";
function useTick(intervalMs) {
  const [tick, setTick] = useState3(0);
  useEffect3(() => {
    if (intervalMs <= 0) return;
    const t = setInterval(() => {
      setTick((v) => v + 1);
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return tick;
}

// src/App.tsx
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var SPINNER = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
function App({ initialRegion: initialRegion2, speed: speed2, intervalSec: intervalSec2, noColor: noColor2, pricesEnabled: pricesEnabled2 }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { items, updatedAt, offline, loading, refresh } = useNews(intervalSec2 * 1e3);
  const tick = useTick(100);
  const [filter, setFilter] = useState4(initialRegion2);
  const [selected, setSelected] = useState4(0);
  const [paused, setPaused] = useState4(false);
  const [searchMode, setSearchMode] = useState4(false);
  const [search, setSearch] = useState4("");
  const [impactOnly, setImpactOnly] = useState4(false);
  const [focus, setFocus] = useState4("list");
  const [assetScroll, setAssetScroll] = useState4(0);
  const [pricesOn, setPricesOn] = useState4(pricesEnabled2);
  const [showHelp, setShowHelp] = useState4(false);
  const [themeIdx, setThemeIdx] = useState4(0);
  const themeName = THEME_NAMES[themeIdx % THEME_NAMES.length];
  const theme = useMemo5(() => getUiTheme(themeName, noColor2), [themeName, noColor2]);
  const nowClock = useMemo5(() => /* @__PURE__ */ new Date(), [Math.floor(tick / 10)]);
  const nowSlow = useMemo5(() => /* @__PURE__ */ new Date(), [Math.floor(tick / 300)]);
  const pulse = tick % 10 < 5;
  const counts = useMemo5(() => {
    const c = { All: items.length };
    for (const f of FILTERS) {
      if (f === "All") continue;
      c[f] = items.filter((it) => it.region === f).length;
    }
    return c;
  }, [items]);
  const impactCount = useMemo5(() => items.filter((it) => it.impact.severity >= 3).length, [items]);
  const filtered = useMemo5(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (filter !== "All" && it.region !== filter) return false;
      if (impactOnly && it.impact.severity < 3) return false;
      if (q && !`${it.title} ${it.source}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, impactOnly, search]);
  useEffect4(() => {
    setSelected((s) => Math.max(0, Math.min(s, Math.max(0, filtered.length - 1))));
    setAssetScroll(0);
  }, [filtered.length, filter, search, impactOnly]);
  const mood = useMemo5(() => marketMood(filtered.length > 0 ? filtered : items), [filtered, items]);
  const quoteSymbols = useMemo5(() => {
    const out = [];
    for (const it of filtered.slice(0, 12)) {
      for (const a of it.impact.impacts.slice(0, 4)) {
        if (!out.includes(a.symbol)) out.push(a.symbol);
        if (out.length >= 20) break;
      }
      if (out.length >= 20) break;
    }
    return out;
  }, [filtered]);
  const quotes = useQuotes(quoteSymbols, pricesOn && pricesEnabled2);
  const cycleFilter = (dir) => {
    setFilter((f) => {
      const idx = FILTERS.indexOf(f);
      const next = (idx + dir + FILTERS.length) % FILTERS.length;
      return FILTERS[next];
    });
    setSelected(0);
    setAssetScroll(0);
  };
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }
    if (showHelp) {
      if (input === "?" || key.escape) {
        setShowHelp(false);
        return;
      }
      if (input === "q") {
        exit();
        return;
      }
      return;
    }
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setSearch("");
        setSelected(0);
        return;
      }
      if (key.return) {
        setSearchMode(false);
        setSelected(0);
        return;
      }
      if (key.backspace || key.delete) {
        setSearch((s) => s.slice(0, -1));
        setSelected(0);
        return;
      }
      if (!key.ctrl && !key.meta && input && input.length === 1) {
        setSearch((s) => (s + input).slice(0, 80));
        setSelected(0);
        return;
      }
      return;
    }
    if (key.tab) {
      setFocus((f) => f === "list" ? "impact" : "list");
      return;
    }
    if (input === "q") {
      exit();
      return;
    }
    if (key.escape && search) {
      setSearch("");
      setSelected(0);
      return;
    }
    if (input === "?") {
      setShowHelp(true);
      return;
    }
    if (input === "t") {
      setThemeIdx((i) => (i + 1) % THEME_NAMES.length);
      return;
    }
    if (input === "i") {
      setImpactOnly((v) => !v);
      setSelected(0);
      setAssetScroll(0);
      return;
    }
    if (input === "p") {
      setPricesOn((v) => !v);
      return;
    }
    if (input === "/") {
      setSearchMode(true);
      return;
    }
    if (input === " ") {
      setPaused((p) => !p);
      return;
    }
    if (input === "r") {
      refresh();
      return;
    }
    if (key.return || input === "o") {
      const it = filtered[selected];
      if (it?.link) void open(it.link).catch(() => void 0);
      return;
    }
    if (key.upArrow || input === "k") {
      if (focus === "impact") setAssetScroll((s) => Math.max(0, s - 1));
      else setSelected((s) => Math.max(0, s - 1));
      return;
    }
    if (key.downArrow || input === "j") {
      if (focus === "impact") setAssetScroll((s) => s + 1);
      else setSelected((s) => Math.min(Math.max(0, filtered.length - 1), s + 1));
      return;
    }
    if (key.leftArrow) {
      cycleFilter(-1);
      return;
    }
    if (key.rightArrow) {
      cycleFilter(1);
      return;
    }
    if (/^[0-5]$/.test(input)) {
      const f = FILTERS[Number(input)];
      if (f) {
        setFilter(f);
        setSelected(0);
        setAssetScroll(0);
      }
    }
  });
  const columns = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;
  const wide = columns >= 100;
  const speedClamped = Math.max(1, Math.min(60, speed2));
  const offsetChars = paused ? 0 : Math.floor(tick * speedClamped / 10);
  const [frozenOffset, setFrozenOffset] = useState4(0);
  useEffect4(() => {
    if (!paused) setFrozenOffset(offsetChars);
  }, [tick, paused]);
  const effectiveOffset = paused ? frozenOffset : offsetChars;
  const marqueeItems = useMemo5(() => {
    const src = filtered.length > 0 ? filtered : items;
    return src.slice(0, 20);
  }, [filtered, items]);
  const selectedItem = filtered[selected] ?? null;
  const listWidth = wide ? Math.floor((columns - 8) * 0.55) : Math.max(10, columns - 4);
  const sideWidth = wide ? columns - listWidth - 8 : Math.max(10, columns - 4);
  const listHeight = Math.max(4, rows - 12);
  const impactHeight = Math.max(6, wide ? rows - 16 : 12);
  if (loading && items.length === 0) {
    const frame = SPINNER[tick % SPINNER.length];
    return /* @__PURE__ */ jsxs9(Box9, { width: columns, height: rows, flexDirection: "column", alignItems: "center", justifyContent: "center", children: [
      /* @__PURE__ */ jsxs9(Text9, { color: noColor2 ? void 0 : "yellow", bold: true, children: [
        frame,
        " GEOPOLITICS LIVE \u2014 fetching feeds\u2026"
      ] }),
      /* @__PURE__ */ jsx9(Text9, { color: noColor2 ? void 0 : "gray", children: "BBC \xB7 Al Jazeera \xB7 Guardian \xB7 DW \xB7 NPR" })
    ] });
  }
  return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", width: columns, height: rows, paddingLeft: 1, paddingRight: 1, children: [
    /* @__PURE__ */ jsx9(Header_default, { updatedAt, offline, now: nowClock, noColor: noColor2, mood, theme, pricesOn: pricesOn && pricesEnabled2 }),
    /* @__PURE__ */ jsx9(
      Marquee_default,
      {
        items: marqueeItems,
        width: Math.max(10, columns - 6),
        offsetChars: effectiveOffset,
        now: nowSlow,
        noColor: noColor2,
        theme,
        pulse
      }
    ),
    /* @__PURE__ */ jsx9(
      FilterBar_default,
      {
        active: filter,
        counts,
        impactOnly,
        impactCount,
        search,
        searchMode,
        noColor: noColor2,
        theme
      }
    ),
    showHelp ? /* @__PURE__ */ jsx9(HelpOverlay_default, {}) : wide ? /* @__PURE__ */ jsxs9(Box9, { width: "100%", flexGrow: 1, gap: 1, overflow: "hidden", children: [
      /* @__PURE__ */ jsx9(Box9, { width: listWidth, flexShrink: 0, flexDirection: "column", overflow: "hidden", children: /* @__PURE__ */ jsx9(
        HeadlineList_default,
        {
          items: filtered,
          selected,
          height: listHeight,
          width: listWidth,
          now: nowSlow,
          noColor: noColor2,
          theme,
          focused: focus === "list"
        }
      ) }),
      /* @__PURE__ */ jsxs9(Box9, { width: sideWidth, flexShrink: 0, flexDirection: "column", gap: 1, overflow: "hidden", children: [
        /* @__PURE__ */ jsx9(
          ImpactPane_default,
          {
            item: selectedItem,
            quotes,
            pricesOn: pricesOn && pricesEnabled2,
            focused: focus === "impact",
            scroll: assetScroll,
            height: impactHeight,
            width: sideWidth,
            now: nowSlow,
            noColor: noColor2,
            theme
          }
        ),
        /* @__PURE__ */ jsx9(HotAssets_default, { items, noColor: noColor2, theme })
      ] })
    ] }) : /* @__PURE__ */ jsxs9(Box9, { width: "100%", flexDirection: "column", flexGrow: 1, gap: 1, overflow: "hidden", children: [
      /* @__PURE__ */ jsx9(
        HeadlineList_default,
        {
          items: filtered,
          selected,
          height: Math.max(4, Math.floor(listHeight / 2)),
          width: Math.max(10, columns - 4),
          now: nowSlow,
          noColor: noColor2,
          theme,
          focused: focus === "list"
        }
      ),
      /* @__PURE__ */ jsx9(
        ImpactPane_default,
        {
          item: selectedItem,
          quotes,
          pricesOn: pricesOn && pricesEnabled2,
          focused: focus === "impact",
          scroll: assetScroll,
          height: impactHeight,
          width: Math.max(10, columns - 4),
          now: nowSlow,
          noColor: noColor2,
          theme
        }
      ),
      /* @__PURE__ */ jsx9(HotAssets_default, { items, noColor: noColor2, theme })
    ] }),
    /* @__PURE__ */ jsx9(Footer_default, { noColor: noColor2, themeLabel: theme.label })
  ] });
}
var App_default = App;

// src/index.tsx
import { jsx as jsx10 } from "react/jsx-runtime";
var program = new Command();
program.name("geoticker").description("Geopolitics news ticker for the terminal").option("--region <name>", "start with a filter (All, Middle East, Europe, Asia-Pacific, Americas, Africa, Global)").option("--speed <n>", "marquee chars per second", (v) => Number(v), 12).option("--interval <seconds>", "refresh interval in seconds", (v) => Number(v), 60).option("--once", "print latest 20 headlines and exit", false).option("--no-prices", "skip all network calls for quotes", false);
program.parse(process.argv);
var opts = program.opts();
var initialRegion = "All";
if (opts.region) {
  const r = normalizeRegionName(opts.region);
  if (r) initialRegion = r;
  else console.error(`Unknown region "${opts.region}", using All.`);
}
var speed = Number.isFinite(opts.speed) && opts.speed > 0 ? opts.speed : 12;
var intervalSec = Number.isFinite(opts.interval) && opts.interval > 0 ? Math.floor(opts.interval) : 60;
var pricesEnabled = opts.prices !== false;
var noColor = Boolean(process.env.NO_COLOR) || !process.stdout.isTTY;
if (noColor) chalk.level = 0;
function restoreTerminal() {
  try {
    if (process.stdout.isTTY) process.stdout.write("\x1B[?25h\x1B[0m\n");
  } catch {
  }
}
async function runOnce() {
  const width = process.stdout.columns ?? 100;
  try {
    const items = await fetchFeeds();
    let list = items.slice(0, 20);
    if (initialRegion !== "All") list = list.filter((it) => it.region === initialRegion).slice(0, 20);
    const now = /* @__PURE__ */ new Date();
    for (const it of list) {
      const chip = impactChipSuffix(it.impact, 3);
      const sev = severityMeter(it.impact.severity);
      if (noColor) {
        const tail = `${chip ? ` | ${chip}` : ""} [${sev} ${it.impact.sentiment}]`;
        const head = truncateByWidth(`[${it.region}] ${it.title} \u2014 ${it.source} \xB7 ${timeAgo(it.published, now)}`, Math.max(20, width - stringWidth3(tail) - 1));
        console.log(head + tail);
      } else {
        let color = chalk.white;
        if (it.region === "Middle East") color = chalk.red;
        else if (it.region === "Europe") color = chalk.blue;
        else if (it.region === "Asia-Pacific") color = chalk.green;
        else if (it.region === "Americas") color = chalk.yellow;
        else if (it.region === "Africa") color = chalk.magenta;
        const chipStr = chip ? chalk.cyan(` ${chip}`) : "";
        const sevStr = it.impact.severity >= 3 ? chalk.red(sev) : chalk.gray(sev);
        console.log(
          `${color(`[${it.region}]`)} ${chalk.yellow(truncateByWidth(it.title, Math.max(20, width - 60)))}${chipStr} ${chalk.gray(`\u2014 ${it.source} \xB7 ${timeAgo(it.published, now)}`)} ${sevStr} ${chalk.gray(it.impact.sentiment)}`
        );
      }
    }
    if (list.length === 0) console.log("No headlines found.");
  } catch (err) {
    console.error(`Failed to fetch feeds: ${err.message}`);
    process.exitCode = 1;
  }
}
async function main() {
  if (opts.once) {
    await runOnce();
    return;
  }
  if (!process.stdout.isTTY) {
    await runOnce();
    return;
  }
  const app = render(
    /* @__PURE__ */ jsx10(App_default, { initialRegion, speed, intervalSec, noColor, pricesEnabled }),
    { exitOnCtrlC: false }
  );
  const cleanup = () => {
    try {
      app.unmount();
    } catch {
    }
    restoreTerminal();
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  process.on("uncaughtException", (e) => {
    cleanup();
    console.error(e);
    process.exit(1);
  });
  await app.waitUntilExit();
  restoreTerminal();
}
void main();
