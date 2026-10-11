import stringWidth from "string-width";

export function timeAgo(d: Date, now: Date = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export function formatClock(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function truncateByWidth(s: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  if (stringWidth(s) <= maxWidth) return s;
  if (maxWidth === 1) return "…";
  let w = 0;
  let out = "";
  for (const ch of s) {
    const cw = stringWidth(ch);
    if (w + cw > maxWidth - 1) break;
    out += ch;
    w += cw;
  }
  return out + "…";
}

export function sliceByDisplayWidth(
  chars: string[],
  widths: number[],
  startCol: number,
  widthCols: number,
  totalCols: number
): string[] {
  const out: string[] = [];
  if (widthCols <= 0 || totalCols <= 0) return out;
  let s = ((startCol % totalCols) + totalCols) % totalCols;
  // find start index: first char whose column range contains s
  let col = 0;
  let idx = 0;
  for (let i = 0; i < chars.length; i++) {
    const w = widths[i] ?? 0;
    if (col + w > s) {
      idx = i;
      break;
    }
    col += w;
    idx = i + 1;
    if (idx >= chars.length) idx = 0;
  }
  let used = 0;
  // if we start mid-char, skip it to avoid breaking alignment
  let firstOffset = 0;
  {
    let c = 0;
    for (let i = 0; i < idx; i++) c += widths[i] ?? 0;
    firstOffset = s - c;
  }
  let i = idx;
  if (firstOffset > 0) {
    i = (idx + 1) % chars.length;
  }
  let guard = 0;
  while (used < widthCols && guard < chars.length + 2) {
    guard++;
    if (i >= chars.length) i = 0;
    if (chars.length === 0) break;
    const w = widths[i] ?? 0;
    if (used + w > widthCols) break;
    out.push(chars[i] as string);
    used += w;
    i++;
  }
  while (used < widthCols) {
    out.push(" ");
    used += 1;
  }
  return out;
}

export function sparkline(points: number[]): string {
  const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  if (points.length === 0) return "─";
  const min = Math.min(...points);
  const max = Math.max(...points);
  if (max === min) return bars[3]?.repeat(Math.max(1, Math.min(12, points.length))) ?? "─";
  return points
    .slice(-12)
    .map((p) => {
      const r = (p - min) / (max - min);
      const idx = Math.max(0, Math.min(bars.length - 1, Math.floor(r * bars.length)));
      return bars[idx] ?? "─";
    })
    .join("");
}

export function severityMeter(sev: number): string {
  return "●".repeat(Math.max(0, Math.min(5, sev))) + "○".repeat(5 - Math.max(0, Math.min(5, sev)));
}

export { stringWidth };
