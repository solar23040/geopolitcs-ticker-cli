import { Injectable, effect, signal } from "@angular/core";
import type { RegionFilter } from "./model";

export type ThemeId = "amber" | "midnight" | "light";

export const THEMES: Array<{ id: ThemeId; label: string }> = [
  { id: "amber", label: "Amber Terminal" },
  { id: "midnight", label: "Midnight Blue" },
  { id: "light", label: "Light" },
];

const THEME_KEY = "geoticker-theme";
const FILTER_KEY = "geoticker-filter";

function readTheme(): ThemeId {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    if (v === "amber" || v === "midnight" || v === "light") return v;
  } catch {
    // ignore
  }
  return "amber";
}

@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly theme = signal<ThemeId>(readTheme());

  constructor() {
    document.documentElement.dataset["theme"] = this.theme();
    effect(() => {
      const t = this.theme();
      document.documentElement.dataset["theme"] = t;
      try {
        window.localStorage.setItem(THEME_KEY, t);
      } catch {
        // ignore
      }
    });
  }

  cycle(): void {
    const order: ThemeId[] = ["amber", "midnight", "light"];
    const next = order[(order.indexOf(this.theme()) + 1) % order.length];
    if (next) this.theme.set(next);
  }

  loadFilter(): RegionFilter {
    try {
      const v = window.localStorage.getItem(FILTER_KEY);
      if (
        v === "All" ||
        v === "Middle East" ||
        v === "Europe" ||
        v === "Asia-Pacific" ||
        v === "Americas" ||
        v === "Africa"
      ) {
        return v;
      }
    } catch {
      // ignore
    }
    return "All";
  }

  saveFilter(f: RegionFilter): void {
    try {
      window.localStorage.setItem(FILTER_KEY, f);
    } catch {
      // ignore
    }
  }
}
