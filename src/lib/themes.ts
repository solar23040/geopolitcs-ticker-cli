import type { AssetImpact } from "./types.js";

export interface ThemeDef {
  id: string;
  label: string;
  patterns: string[];
  impacts: AssetImpact[];
}

// One editable data file: add keywords + impacted symbols per theme.
// Reasons capped at 8 words.
export const THEMES: ThemeDef[] = [
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
