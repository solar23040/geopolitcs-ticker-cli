import { Pipe, PipeTransform } from "@angular/core";

/** Pure relative-time pipe. Pass a ticking `now` to refresh, e.g. `{{ d | timeAgo: now }}`. */
@Pipe({ name: "timeAgo" })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | null, now?: Date | number): string {
    if (!value) return "—";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    const n = now instanceof Date ? now : new Date(now ?? Date.now());
    const s = Math.max(0, Math.floor((n.getTime() - d.getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
}
