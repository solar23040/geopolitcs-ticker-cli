export type ThemeName = "amber" | "midnight" | "mono";

export interface UiTheme {
  name: ThemeName;
  label: string;
  accent: string | undefined;
  accentFallback: string;
  border: string | undefined;
  borderFallback: string;
  gain: string | undefined;
  loss: string | undefined;
  gainFallback: string;
  lossFallback: string;
  mixed: string | undefined;
  cyan: string | undefined;
}

function supportsTruecolor(): boolean {
  const ct = (process.env.COLORTERM ?? "").toLowerCase();
  return ct.includes("truecolor") || ct.includes("24bit");
}

export const THEME_NAMES: ThemeName[] = ["amber", "midnight", "mono"];

export function getUiTheme(name: ThemeName, noColor: boolean): UiTheme {
  const tc = !noColor && supportsTruecolor();
  if (noColor) {
    const plain: UiTheme = {
      name, label: name, accent: undefined, accentFallback: "yellow",
      border: undefined, borderFallback: "gray",
      gain: undefined, loss: undefined, gainFallback: "green",
      lossFallback: "red", mixed: undefined, cyan: undefined
    };
    return plain;
  }
  if (name === "midnight") {
    return {
      name, label: "Midnight Blue",
      accent: tc ? "#6CB8FF" : undefined, accentFallback: "blue",
      border: tc ? "#3A5A8C" : undefined, borderFallback: "blue",
      gain: tc ? "#3DDC84" : undefined, loss: tc ? "#FF5C5C" : undefined,
      gainFallback: "green", lossFallback: "red",
      mixed: tc ? "#FFB000" : undefined, cyan: tc ? "#56E6E6" : undefined
    };
  }
  if (name === "mono") {
    return {
      name, label: "Mono",
      accent: undefined, accentFallback: "white",
      border: undefined, borderFallback: "gray",
      gain: undefined, loss: undefined, gainFallback: "white",
      lossFallback: "white", mixed: undefined, cyan: undefined
    };
  }
  return {
    name, label: "Amber Terminal",
    accent: tc ? "#FFB000" : undefined, accentFallback: "yellow",
    border: tc ? "#8A6D1B" : undefined, borderFallback: "yellow",
    gain: tc ? "#3DDC84" : undefined, loss: tc ? "#FF5C5C" : undefined,
    gainFallback: "green", lossFallback: "red",
    mixed: tc ? "#FFB000" : undefined, cyan: tc ? "#56E6E6" : undefined
  };
}

export function themeColor(hex: string | undefined, fallback: string, noColor: boolean): string | undefined {
  if (noColor) return undefined;
  if (hex) return hex;
  return fallback;
}
