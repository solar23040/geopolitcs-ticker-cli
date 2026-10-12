import { ChangeDetectionStrategy, Component, input, output, signal } from "@angular/core";
import { TimeAgoPipe } from "../pipes/time-ago.pipe";
import { shortSymbol } from "../core/model";
import type { Headline } from "../core/model";

const OLD_MS = 3 * 3600 * 1000;

@Component({
  selector: "app-headline-list",
  imports: [TimeAgoPipe],
  template: `
    <ul class="list" role="listbox" aria-label="Headlines">
      @for (it of items(); track it.cluster_id || it.link || it.title) {
        <li>
          <button
            type="button"
            class="row"
            role="option"
            [class.selected]="$index === selected()"
            [class.dimmed]="isOld(it)"
            [attr.aria-selected]="$index === selected()"
            (click)="select.emit($index)"
          >
            <span class="region" [class.india]="it.region === 'India'">{{ it.region }}</span>
            <span class="ttl">{{ it.title }}</span>
            @if (isNew(it)) {
              <span class="new">NEW</span>
            }
            <span class="sub">{{ it.source }} · {{ it.published | timeAgo: now() }}</span>
            @if ((it.source_count ?? 1) > 1) {
              <span
                class="srcs"
                role="button"
                tabindex="0"
                [attr.aria-expanded]="isExpanded(it)"
                (click)="toggle(it, $event)"
                (keydown.enter)="toggle(it, $event)"
              >Reported by {{ it.source_count }} sources {{ isExpanded(it) ? "▾" : "▸" }}</span>
              @if (isExpanded(it)) {
                <span class="srclist">
                  @for (s of it.sources ?? []; track s.name) {
                    <a [href]="s.link" target="_blank" rel="noopener" (click)="$event.stopPropagation()">{{ s.name }}</a>
                  }
                </span>
              }
            }
            @if (chips(it).length > 0) {
              <span class="chips">{{ chips(it) }}</span>
            }
          </button>
        </li>
      }
    </ul>
  `,
  styleUrl: "./headline-list.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadlineListComponent {
  readonly items = input<Headline[]>([]);
  readonly selected = input<number>(0);
  readonly now = input<Date>(new Date());
  /** Epoch ms the user last saw the list; items fetched after it are NEW. */
  readonly lastSeenAt = input<number | null>(null);
  readonly select = output<number>();

  private readonly expanded = signal<string[]>([]);

  private key(it: Headline): string {
    return it.cluster_id || it.link || it.title;
  }

  isExpanded(it: Headline): boolean {
    return this.expanded().includes(this.key(it));
  }

  toggle(it: Headline, ev: Event): void {
    ev.stopPropagation();
    const k = this.key(it);
    this.expanded.update((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));
  }

  isNew(it: Headline): boolean {
    const seen = this.lastSeenAt();
    if (seen === null) return false;
    return it.fetched_at instanceof Date && it.fetched_at.getTime() > seen;
  }

  isOld(it: Headline): boolean {
    return Date.now() - it.published.getTime() > OLD_MS;
  }

  chips(it: Headline): string {
    return it.impact.impacts
      .slice(0, 3)
      .map((a) => {
        const arrow = a.direction === "up" ? "▲" : a.direction === "down" ? "▼" : "◆";
        return `${arrow}${shortSymbol(a.symbol)}`;
      })
      .join(" ");
  }
}
