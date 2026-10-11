export type Region =
  | "Middle East"
  | "Europe"
  | "Asia-Pacific"
  | "Americas"
  | "Africa"
  | "Global";

export type ImpactDirection = "up" | "down" | "mixed";

export interface AssetImpact {
  symbol: string;
  name: string;
  market: string;
  direction: ImpactDirection;
  reason: string;
}

export interface ItemImpact {
  themes: string[];
  impacts: AssetImpact[];
  severity: 1 | 2 | 3 | 4 | 5;
  sentiment: "risk-off" | "risk-on" | "neutral";
}

export interface NewsItem {
  title: string;
  source: string;
  link: string;
  published: Date;
  region: Region;
  impact: ItemImpact;
}

export const ALL_REGIONS: Region[] = [
  "Middle East",
  "Europe",
  "Asia-Pacific",
  "Americas",
  "Africa",
  "Global"
];

export type RegionFilter = "All" | Region;

export const NEUTRAL_IMPACT: ItemImpact = {
  themes: [],
  impacts: [],
  severity: 1,
  sentiment: "neutral"
};
