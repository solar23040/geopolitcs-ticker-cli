import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map, timer } from "rxjs";
import { TimeAgoPipe } from "../pipes/time-ago.pipe";
import type { Mood } from "../core/model";

@Component({
  selector: "app-header",
  imports: [TimeAgoPipe],
  template: `
    <header class="hd">
      <div class="brand">
        <span class="dot" aria-hidden="true"></span>
        <h1 class="title">GEOPOLITICS LIVE</h1>
      </div>
      <div class="meta">
        <span class="clock" aria-label="Local time">{{ now().toLocaleTimeString() }}</span>
        <span class="updated">updated {{ updatedAt() | timeAgo: now() }}</span>
        @if (online()) {
          <span class="pill live">LIVE</span>
        } @else {
          <span class="pill offline">OFFLINE</span>
        }
        <span
          class="mood mood-{{ mood().label.toLowerCase() }}"
          [attr.aria-label]="'Market mood: ' + mood().label"
          title="Rule-based market mood from visible headlines"
        >
          <span class="bar" aria-hidden="true"><span [style.width.%]="mood().score * 100"></span></span>
          {{ mood().label }}
        </span>
      </div>
    </header>
  `,
  styleUrl: "./header.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly mood = input.required<Mood>();
  readonly updatedAt = input<Date | null>(null);
  readonly online = input<boolean>(true);

  readonly now = toSignal(timer(0, 1000).pipe(map(() => new Date())), {
    initialValue: new Date(),
  });
}
