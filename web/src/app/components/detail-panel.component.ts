import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TimeAgoPipe } from "../pipes/time-ago.pipe";
import { SparklineComponent } from "./sparkline.component";
import type { Headline, QuoteData } from "../core/model";

@Component({
  selector: "app-detail-panel",
  imports: [TimeAgoPipe, SparklineComponent],
  template: `
    @if (item(); as it) {
      <article class="detail" aria-label="Headline detail">
        <h2 class="ttl">{{ it.title }}</h2>
        <p class="sub">{{ it.source }} · {{ it.published | timeAgo }}</p>
        <div class="badges">
          <span class="sev" aria-label="Severity {{ it.impact.severity }} of 5">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <span [class.on]="i <= it.impact.severity">●</span>
            }
          </span>
          <span class="sent sent-{{ it.impact.sentiment }}">{{ it.impact.sentiment }}</span>
        </div>
        @if (it.impact.impacts.length > 0) {
          <h3 class="assets-h">AFFECTED ASSETS</h3>
          <table class="assets">
            <thead>
              <tr>
                <th scope="col"><span class="vh">Direction</span></th>
                <th scope="col">Symbol</th>
                <th scope="col">Name</th>
                <th scope="col">Price</th>
                <th scope="col">Day %</th>
                <th scope="col">Trend</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              @for (a of it.impact.impacts; track a.symbol) {
                <tr>
                  <td>
                    @if (a.direction === "up") {
                      <span class="up" aria-label="up">▲</span>
                    } @else if (a.direction === "down") {
                      <span class="down" aria-label="down">▼</span>
                    } @else {
                      <span class="mixed" aria-label="mixed">◆</span>
                    }
                  </td>
                  <td class="sym">{{ a.symbol }}</td>
                  <td>{{ a.name }}</td>
                  <td class="num">{{ price(a.symbol) }}</td>
                  <td class="num" [class.up]="chg(a.symbol) > 0" [class.down]="chg(a.symbol) < 0">
                    {{ chgStr(a.symbol) }}
                  </td>
                  <td><app-sparkline [points]="spark(a.symbol)" /></td>
                  <td class="reason">{{ a.reason }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="none">No mapped market impact for this story.</p>
        }
        <p class="open">
          <a [href]="it.link" target="_blank" rel="noopener">Open full story ↗</a>
        </p>
      </article>
    } @else {
      <p class="none">Select a headline to see market impact.</p>
    }
  `,
  styleUrl: "./detail-panel.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPanelComponent {
  readonly item = input<Headline | null>(null);
  readonly quotes = input<Record<string, QuoteData>>({});

  quote(sym: string): QuoteData | null {
    return this.quotes()[sym] ?? null;
  }

  price(sym: string): string {
    const q = this.quote(sym);
    return q ? q.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
  }

  chg(sym: string): number {
    return this.quote(sym)?.changePct ?? 0;
  }

  chgStr(sym: string): string {
    const q = this.quote(sym);
    if (!q) return "—";
    const v = q.changePct;
    return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
  }

  spark(sym: string): number[] {
    return this.quote(sym)?.spark ?? [];
  }
}
