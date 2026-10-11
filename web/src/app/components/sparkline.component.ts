import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

/** Inline SVG sparkline. Green when up, red when down, amber when flat. */
@Component({
  selector: "app-sparkline",
  template: `
    <svg viewBox="0 0 60 16" width="60" height="16" aria-hidden="true" class="spark">
      <polyline [attr.points]="pts()" [attr.class]="cls()" fill="none" stroke-width="1.5" />
    </svg>
  `,
  styleUrl: "./sparkline.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineComponent {
  readonly points = input<number[]>([]);

  readonly pts = computed(() => {
    const p = this.points();
    if (p.length === 0) return "0,8 60,8";
    const min = Math.min(...p);
    const max = Math.max(...p);
    const n = p.length;
    return p
      .map((v, i) => {
        const x = n === 1 ? 60 : (i / (n - 1)) * 60;
        const y = max === min ? 8 : 14 - ((v - min) / (max - min)) * 12;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  });

  readonly cls = computed(() => {
    const p = this.points();
    if (p.length < 2) return "flat";
    const first = p[0] ?? 0;
    const last = p[p.length - 1] ?? 0;
    if (last > first) return "up";
    if (last < first) return "down";
    return "flat";
  });
}
