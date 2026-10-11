import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import type { Headline, ImpactDirection, QuoteData } from "../core/model";

export interface HotAsset {
  symbol: string;
  name: string;
  direction: ImpactDirection;
  count: number;
}

/** Top impacted symbols in the last hour (browser-local port of the shared helper). */
export function hotAssetSymbols(items: Headline[], hours = 1, top = 5): HotAsset[] {
  const cutoff = Date.now() - hours * 3600 * 1000;
  const counts = new Map<string, { name: string; up: number; down: number; mixed: number }>();
  for (const it of items) {
    if (it.published.getTime() < cutoff) continue;
    for (const a of it.impact.impacts.slice(0, 4)) {
      const e = counts.get(a.symbol) ?? { name: a.name, up: 0, down: 0, mixed: 0 };
      if (a.direction === "up") e.up++;
      else if (a.direction === "down") e.down++;
      else e.mixed++;
      counts.set(a.symbol, e);
    }
  }
  return [...counts.entries()]
    .map(([symbol, e]) => {
      const total = e.up + e.down + e.mixed;
      const direction: ImpactDirection =
        e.up >= e.down && e.up >= e.mixed ? "up" : e.down >= e.mixed ? "down" : "mixed";
      return { symbol, name: e.name, direction, count: total };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

@Component({
  selector: "app-hot-assets",
  template: `
    <section class="hot" aria-label="Hot assets">
      <h2>HOT ASSETS <span class="dim">· last hour</span></h2>
      @if (hot().length > 0) {
        <ul>
          @for (h of hot(); track h.symbol) {
            <li>
              @if (h.direction === "up") {
                <span class="up" aria-label="up">▲</span>
              } @else if (h.direction === "down") {
                <span class="down" aria-label="down">▼</span>
              } @else {
                <span class="mixed" aria-label="mixed">◆</span>
              }
              <span class="sym">{{ h.symbol }}</span>
              <span class="nm">{{ h.name }}</span>
              <span class="ct">×{{ h.count }}</span>
              @if (price(h.symbol); as p) {
                <span class="pr">{{ p }}</span>
              }
            </li>
          }
        </ul>
      } @else {
        <p class="dim">No impacted assets in the last hour.</p>
      }
    </section>
  `,
  styleUrl: "./hot-assets.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotAssetsComponent {
  readonly items = input<Headline[]>([]);
  readonly quotes = input<Record<string, QuoteData>>({});

  readonly hot = computed(() => hotAssetSymbols(this.items()));

  price(sym: string): string | null {
    const q = this.quotes()[sym];
    return q ? q.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : null;
  }
}
