import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { TimeAgoPipe } from "../pipes/time-ago.pipe";
import { shortSymbol } from "../core/model";
import type { Headline } from "../core/model";

/**
 * Full-width CSS marquee. The track renders the list twice for a seamless
 * loop; rows are tracked by link so polling does not recreate the DOM
 * (and therefore does not restart the animation) unless the filter changes.
 */
@Component({
  selector: "app-ticker",
  imports: [TimeAgoPipe],
  template: `
    <div class="marquee" role="marquee" aria-label="Latest headlines ticker">
      <div class="track" [style.animation-duration]="duration()">
        @for (copy of [0, 1]; track copy) {
          <span class="run" [attr.aria-hidden]="copy === 1 ? 'true' : null">
            @for (it of items(); track it.link || it.title) {
              <span class="tick">
                <span class="region" [class.india]="it.region === 'India'">{{ it.region }}</span>
                <a [href]="it.link" target="_blank" rel="noopener">{{ it.title }}</a>
                <span class="src">{{ it.source }} · {{ it.published | timeAgo }}</span>
                @for (chip of chips(it); track chip) {
                  <span class="chip">{{ chip }}</span>
                }
              </span>
              <span class="sep" aria-hidden="true">///</span>
            }
          </span>
        }
      </div>
    </div>
  `,
  styleUrl: "./ticker.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TickerComponent {
  readonly items = input<Headline[]>([]);

  readonly duration = computed(() => `${Math.max(40, this.items().length * 12)}s`);

  chips(it: Headline): string[] {
    return it.impact.impacts.slice(0, 3).map((a) => {
      const arrow = a.direction === "up" ? "▲" : a.direction === "down" ? "▼" : "◆";
      return `${arrow}${shortSymbol(a.symbol)}`;
    });
  }

  protected readonly shortSymbol = shortSymbol;
}
