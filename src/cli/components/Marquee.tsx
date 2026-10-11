import React, { useMemo } from "react";
import { Box, Text } from "ink";
import stringWidth from "string-width";
import { timeAgo } from "../../lib/format.js";
import { impactChipSuffix } from "../../lib/impact.js";
import type { NewsItem, Region } from "../../lib/types.js";
import type { UiTheme } from "../ui-theme.js";
import { themeColor } from "../ui-theme.js";

export function regionColor(r: Region): string {
  switch (r) {
    case "Middle East":
      return "red";
    case "Europe":
      return "blue";
    case "Asia-Pacific":
      return "green";
    case "Americas":
      return "yellow";
    case "Africa":
      return "magenta";
    default:
      return "white";
  }
}

interface Props {
  items: NewsItem[];
  width: number;
  offsetChars: number;
  now: Date;
  noColor: boolean;
  theme: UiTheme;
  pulse: boolean;
}

interface Run {
  text: string;
  color?: string;
  bold?: boolean;
  dim?: boolean;
}

function Marquee({ items, width, offsetChars, now, noColor, theme, pulse }: Props): React.JSX.Element {
  const sep = pulse ? " ◆ " : " ▪ ";
  const runs = useMemo<Run[]>(() => {
    if (items.length === 0) return [{ text: " Loading headlines… ", color: "gray" }];
    const gain = themeColor(theme.gain, theme.gainFallback, noColor);
    const loss = themeColor(theme.loss, theme.lossFallback, noColor);
    const mixed = themeColor(theme.mixed, "yellow", noColor);
    const out: Run[] = [];
    items.forEach((it, i) => {
      if (i > 0) out.push({ text: sep, color: "gray", dim: true });
      out.push({ text: ` ${it.region} `, color: regionColor(it.region), bold: true });
      out.push({ text: ` ${it.title} ` });
      const chip = impactChipSuffix(it.impact, 3);
      if (chip) {
        // color whole chip neutrally; arrows already encode direction in text
        out.push({ text: ` ${chip} `, color: undefined, bold: true });
        void gain;
        void loss;
        void mixed;
      }
      out.push({ text: `— ${it.source} · ${timeAgo(it.published, now)}`, color: "gray" });
    });
    out.push({ text: sep, color: "gray", dim: true });
    return out;
  }, [items, now, sep, noColor, theme]);

  const window_ = useMemo<Run[]>(() => {
    const w = Math.max(1, width);
    const chars: string[] = [];
    const colors: Array<string | undefined> = [];
    const bolds: boolean[] = [];
    for (const r of runs) {
      for (const ch of r.text) {
        chars.push(ch);
        colors.push(noColor ? undefined : r.color);
        bolds.push(Boolean(r.bold));
      }
    }
    const widths = chars.map((c) => Math.max(0, stringWidth(c)));
    const total = widths.reduce((a, b) => a + b, 0);
    if (total === 0) return [{ text: " ".repeat(w) }];
    const start = ((offsetChars % total) + total) % total;
    let col = 0;
    let idx = 0;
    for (let i = 0; i < chars.length; i++) {
      const cw = widths[i] ?? 0;
      if (col + cw > start) {
        idx = col < start ? i + 1 : i;
        break;
      }
      col += cw;
      idx = i + 1;
    }
    let used = 0;
    let i = idx % Math.max(1, chars.length);
    const picked: Array<{ ch: string; color?: string; bold: boolean }> = [];
    let guard = 0;
    while (used < w && guard < chars.length * 3 + 10) {
      guard++;
      if (chars.length === 0) break;
      if (i >= chars.length) i = 0;
      const cw = widths[i] ?? 0;
      if (used + cw > w) break;
      picked.push({ ch: chars[i] as string, color: colors[i], bold: bolds[i] as boolean });
      used += cw;
      i++;
    }
    while (used < w) {
      picked.push({ ch: " ", color: undefined, bold: false });
      used += 1;
    }
    const res: Run[] = [];
    for (const p of picked) {
      const last = res[res.length - 1];
      if (last && last.color === p.color && Boolean(last.bold) === p.bold) last.text += p.ch;
      else res.push({ text: p.ch, color: p.color, bold: p.bold });
    }
    return res;
  }, [runs, width, offsetChars, noColor]);

  return (
    <Box width="100%" overflow="hidden">
      <Text color={noColor ? undefined : "gray"} dimColor={!noColor}>
        {"◀"}
      </Text>
      <Text wrap="truncate">
        {window_.map((r, i) => (
          <Text key={i} color={r.color} bold={r.bold}>
            {r.text}
          </Text>
        ))}
      </Text>
      <Text color={noColor ? undefined : "gray"} dimColor={!noColor}>
        {"▶"}
      </Text>
    </Box>
  );
}

export default React.memo(Marquee);
