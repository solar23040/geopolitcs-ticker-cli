import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { HeaderComponent } from "./components/header.component";
import { TickerComponent } from "./components/ticker.component";
import { FilterBarComponent } from "./components/filter-bar.component";
import { HeadlineListComponent } from "./components/headline-list.component";
import { DetailPanelComponent } from "./components/detail-panel.component";
import { HotAssetsComponent, hotAssetSymbols } from "./components/hot-assets.component";
import { ShortcutsOverlayComponent } from "./components/shortcuts-overlay.component";
import { NewsService } from "./core/news.service";
import { QuotesService } from "./core/quotes.service";
import { ThemeService } from "./core/theme.service";
import { FILTERS, marketMood } from "./core/model";
import type { RegionFilter } from "./core/model";

@Component({
  selector: "app-root",
  imports: [
    HeaderComponent,
    TickerComponent,
    FilterBarComponent,
    HeadlineListComponent,
    DetailPanelComponent,
    HotAssetsComponent,
    ShortcutsOverlayComponent,
  ],
  template: `
    <div class="shell">
      <app-header [mood]="mood()" [updatedAt]="news.updatedAt()" [online]="news.online()" />

      <app-ticker [items]="marqueeItems()" />

      @if (news.error(); as err) {
        <p class="err" role="alert">
          {{ err }}
          <button type="button" (click)="news.refresh()">Retry</button>
        </p>
      }

      <app-filter-bar
        [(active)]="filter"
        [(impactOnly)]="impactOnly"
        [(search)]="search"
        [counts]="counts()"
        [impactCount]="impactCount()"
      />

      <main class="split">
        <section class="list-pane" aria-label="Headlines">
          @if (news.loading() && filtered().length === 0) {
            <div class="skel" aria-label="Loading headlines">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="sk"></div>
              }
            </div>
          } @else if (filtered().length === 0) {
            <p class="empty">No headlines match this filter. Try another region or clear the search.</p>
          } @else {
            <app-headline-list
              [items]="filtered()"
              [selected]="selected()"
              [now]="tick()"
              (select)="pick($event)"
            />
          }
        </section>
        <aside class="detail-pane" [class.open]="detailOpen()" aria-label="Story detail">
          <button type="button" class="sheet-close" (click)="detailOpen.set(false)" aria-label="Close detail">
            ✕
          </button>
          <app-detail-panel [item]="selectedItem()" [quotes]="quotesSvc.quotes()" />
          <app-hot-assets [items]="news.headlines()" [quotes]="quotesSvc.quotes()" />
        </aside>
      </main>

      <footer class="ft">
        <span>Rule-based signals, not financial advice.</span>
        <span class="keys">j/k move · Enter open · 1-7 filter · / search · t theme · ? help</span>
      </footer>

      @if (showHelp()) {
        <app-shortcuts-overlay (close)="showHelp.set(false)" />
      }
    </div>
  `,
  styleUrl: "./app.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly news = inject(NewsService);
  protected readonly quotesSvc = inject(QuotesService);
  protected readonly themes = inject(ThemeService);

  readonly filter = signal<RegionFilter>(this.themes.loadFilter());
  readonly impactOnly = signal<boolean>(false);
  readonly search = signal<string>("");
  readonly selected = signal<number>(0);
  readonly detailOpen = signal<boolean>(false);
  readonly showHelp = signal<boolean>(false);
  readonly tick = signal<Date>(new Date());

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const f = this.filter();
    const io = this.impactOnly();
    return this.news.headlines().filter((it) => {
      if (f !== "All" && it.region !== f) return false;
      if (io && it.impact.severity < 3) return false;
      if (q && !`${it.title} ${it.source}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  readonly counts = computed(() => {
    const items = this.news.headlines();
    const c: Record<string, number> = { All: items.length };
    for (const f of FILTERS) {
      if (f === "All") continue;
      c[f] = items.filter((it) => it.region === f).length;
    }
    return c;
  });

  readonly impactCount = computed(
    () => this.news.headlines().filter((it) => it.impact.severity >= 3).length,
  );

  readonly mood = computed(() => {
    const vis = this.filtered();
    return marketMood(vis.length > 0 ? vis : this.news.headlines());
  });

  readonly marqueeItems = computed(() => {
    const vis = this.filtered();
    return (vis.length > 0 ? vis : this.news.headlines()).slice(0, 20);
  });

  readonly selectedItem = computed(() => this.filtered()[this.selected()] ?? null);

  constructor() {
    window.setInterval(() => this.tick.set(new Date()), 30_000);
    // Clamp selection when the list shrinks.
    effect(() => {
      const len = this.filtered().length;
      if (this.selected() > Math.max(0, len - 1)) this.selected.set(Math.max(0, len - 1));
    });
    // Persist last filter.
    effect(() => this.themes.saveFilter(this.filter()));
    // Fetch quotes for the selected headline + hot assets, never blocking render.
    effect(() => {
      const sel = this.selectedItem();
      const syms = new Set<string>();
      for (const a of sel?.impact.impacts.slice(0, 4) ?? []) syms.add(a.symbol);
      for (const h of hotAssetSymbols(this.news.headlines())) syms.add(h.symbol);
      if (syms.size > 0) this.quotesSvc.ensure([...syms]);
    });
  }

  pick(i: number): void {
    this.selected.set(i);
    this.detailOpen.set(true);
  }

  private move(d: 1 | -1): void {
    const len = this.filtered().length;
    if (len === 0) return;
    this.selected.set((this.selected() + d + len) % len);
  }

  @HostListener("window:keydown", ["$event"])
  onKey(e: KeyboardEvent): void {
    const t = e.target as HTMLElement | null;
    const inField =
      !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
    if (inField) {
      if (e.key === "Escape") t?.blur();
      return;
    }
    if (this.showHelp()) {
      if (e.key === "?" || e.key === "Escape") this.showHelp.set(false);
      return;
    }
    switch (e.key) {
      case "j":
      case "ArrowDown":
        this.move(1);
        e.preventDefault();
        break;
      case "k":
      case "ArrowUp":
        this.move(-1);
        e.preventDefault();
        break;
      case "Enter":
      case "o": {
        const link = this.selectedItem()?.link;
        if (link) window.open(link, "_blank", "noopener");
        break;
      }
      case "/": {
        document.getElementById("gt-search")?.focus();
        e.preventDefault();
        break;
      }
      case "t":
        this.themes.cycle();
        break;
      case "?":
        this.showHelp.set(true);
        break;
      case "Escape":
        if (this.search()) this.search.set("");
        else this.detailOpen.set(false);
        break;
      default: {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= FILTERS.length) {
          const f = FILTERS[n - 1];
          if (f) {
            this.filter.set(f);
            this.selected.set(0);
          }
        }
      }
    }
  }
}
