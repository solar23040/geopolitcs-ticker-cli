import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { TimeAgoPipe } from "../pipes/time-ago.pipe";
import { shortSymbol } from "../core/model";
import type { Headline } from "../core/model";

const NEW_MS = 5 * 60 * 1000;
const OLD_MS = 3 * 3600 * 1000;

@Component({
  selector: "app-headline-list",
  imports: [TimeAgoPipe],
  template: `
    <ul class="list" role="listbox" aria-label="Headlines">
      @for (it of items(); track it.link || it.title) {
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
            <span class="region">{{ it.region }}</span>
            <span class="ttl">{{ it.title }}</span>
            @if (isNew(it)) {
              <span class="new">NEW</span>
            }
            <span class="sub">{{ it.source }} · {{ it.published | timeAgo: now() }}</span>
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
  readonly select = output<number>();

  isNew(it: Headline): boolean {
    return Date.now() - it.published.getTime() < NEW_MS;
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
