import type { Region } from "./types.js";

const KEYWORDS: Record<Exclude<Region, "Global">, string[]> = {
  India: [
    "india", "indian", "new delhi", "delhi", "mumbai", "modi",
    " rbi ", "sensex", "nifty", "rupee", "brics", "kashmir",
    " lac ", "pakistan border", "isro", "bengaluru", "chennai",
    "kolkata", "jaishankar", "adani", "reliance", "tata", "quad"
  ],
  "Middle East": [
    "israel", "gaza", "palestine", "palestinian", "hamas", "hezbollah",
    "iran", "tehran", "iraq", "baghdad", "syria", "damascus", "lebanon",
    "beirut", "yemen", "houthi", "saudi", "riyadh", "qatar", "doha",
    "uae", "emirates", "abu dhabi", "dubai", "jordan", "amman",
    "turkiye", "turkey", "erdogan", "ankara", "netanyahu", "jerusalem",
    "tel aviv", "gulf", "opec", "red sea", "sinai", "kurd"
  ],
  Europe: [
    "europe", "european", "eu ", "ukraine", "kyiv", "kiev", "zelensky",
    "zelenskyy", "russia", "putin", "kremlin", "moscow", "france", "macron",
    "paris", "germany", "berlin", "merz", "scholz", "britain", "london",
    "starmer", "united kingdom", "italy", "rome", "meloni", "spain",
    "madrid", "poland", "warsaw", "nato", "brussels", "balkans", "serbia",
    "belgrade", "hungary", "orban", "budapest", "belarus", "minsk",
    "moldova", "georgia", "tbilisi", "armenia", "azerbaijan", "eu,",
    "e.u.", "brexit", "oslo", "stockholm", "helsinki", "copenhagen"
  ],
  "Asia-Pacific": [
    "china", "beijing", "xi jinping", "taiwan", "taipei", "hong kong",
    "japan", "tokyo", "ishiba", "korea", "seoul", "pyongyang",
    "kim jong", "india", "modi", "new delhi", "delhi", "pakistan",
    "islamabad", "kashmir", "australia", "canberra", "asean",
    "south china sea", "philippines", "manila", "marcos", "vietnam",
    "hanoi", "indonesia", "jakarta", "thailand", "bangkok", "myanmar",
    "bangladesh", "dhaka", "sri lanka", "afghanistan", "kabul",
    "pacific", "apec", "quad", "aukus", "north korea", "south korea",
    "mongolia", "singapore", "malaysia", "kuala lumpur", "new zealand"
  ],
  Americas: [
    "united states", "america", "washington", "white house", "biden",
    "trump", "vance", "rubio", "congress", "senate", "pentagon",
    "state department", "canada", "ottawa", "carney", "mexico",
    "mexico city", "sheinbaum", "brazil", "brasilia", "lula",
    "argentina", "milei", "buenos aires", "venezuela", "caracas",
    "maduro", "colombia", "bogota", "petro", "cuba", "havana",
    "latin america", "panama", "greenland", "oas", "us-mexico",
    "u.s.", "u.s ", " usa", "usa ", "us "
  ],
  Africa: [
    "africa", "african", "nigeria", "abuja", "tinubu", "kenya",
    "nairobi", "ruto", "ethiopia", "addis", "sudan", "khartoum",
    "south africa", "pretoria", "ramaphosa", "rwanda", "kigali",
    "kagame", "congo", "kinshasa", "sahel", "mali", "bamako",
    "niger ", "niamey", "somalia", "mogadishu", "libya", "tripoli",
    "algeria", "algiers", "morocco", "rabat", "tunisia", "tunis",
    "egypt", "cairo", "sisi", "ghana", "accra", "senegal", "dakar",
    "au summit", "african union", "darfur", "tigray"
  ]
};

const GLOBAL_KEYWORDS = [
  "united nations", "u.n.", "security council", "g7", "g-7", "g20",
  "g-20", "world bank", "imf", "wto", "climate summit", "cop30",
  "cop29", "global", "world order", "nuclear treaty", "geneva talks"
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary match: \b only where the keyword edge is a word char,
// so "quad" never matches inside "squad" but "u.s." still matches.
export function keywordRegex(kw: string): RegExp {
  const t = kw.trim().toLowerCase();
  const esc = escapeRegExp(t);
  const pre = /^\w/.test(t) ? "\\b" : "";
  const suf = /\w$/.test(t) ? "\\b" : "";
  return new RegExp(`${pre}${esc}${suf}`, "i");
}

export function tagRegion(text: string): Region {
  const t = ` ${text.toLowerCase()} `;
  const regions = Object.keys(KEYWORDS) as Array<Exclude<Region, "Global">>;
  for (const region of regions) {
    for (const kw of KEYWORDS[region]) {
      if (keywordRegex(kw).test(t)) return region;
    }
  }
  for (const kw of GLOBAL_KEYWORDS) {
    if (keywordRegex(kw).test(t)) return "Global";
  }
  return "Global";
}

export function normalizeRegionName(name: string): Region | "All" | null {
  const n = name.trim().toLowerCase();
  if (n === "all") return "All";
  if (n === "middle east" || n === "middle-east" || n === "mideast" || n === "me") return "Middle East";
  if (n === "europe" || n === "eu") return "Europe";
  if (n === "india") return "India";
  if (n === "asia-pacific" || n === "asia pacific" || n === "asia" || n === "apac" || n === "indo-pacific") return "Asia-Pacific";
  if (n === "americas" || n === "america" || n === "us" || n === "americas ") return "Americas";
  if (n === "africa") return "Africa";
  if (n === "global" || n === "world" || n === "other") return "Global";
  return null;
}
