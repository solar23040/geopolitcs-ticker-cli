import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { timeAgo, truncateByWidth } from "../lib/format.js";
import { impactChipSuffix } from "../lib/impact.js";
import { regionColor } from "./Marquee.js";
import type { NewsItem } from "../lib/types.js";
import type { UiTheme } from "../lib/ui-theme.js";
import { themeColor } from "../lib/ui-theme.js";

interface Props {
  items: NewsItem[];
  selected: number;
  height: number;
  width: number;
  now: Date;
  noColor: boolean;
  theme: UiTheme;
  focused: boolean;
}

function ageDim(published: Date, now: Date): boolean {
  return now.getTime() - published.getTime() > 3 * 3600 * 1000;
}
function isNew(published: Date, now: Date): boolean {
  return now.getTime() - published.getTime() < 5 * 60 * 1000;
}

function HeadlineList({ items, selected, height, width, now, noColor, theme, focused }: Props): React.JSX.Element {
  const border = themeColor(theme.border, theme.borderFallback, noColor);
  const accent = themeColor(theme.accent, theme.accentFallback, noColor);
  const cyan = themeColor(theme.cyan, "cyan", noColor);
  const visible = useMemo(() => {
    const h = Math.max(1, height);
    if (items.length === 0) return { slice: [] as NewsItem[], start: 0 };
    let start = 0;
    if (selected >= h) start = Math.min(selected - h + 1, Math.max(0, items.length - h));
    start = Math.max(0, Math.min(start, Math.max(0, items.length - h)));
    return { slice: items.slice(start, start + h), start };
  }, [items, selected, height]);

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      overflow="hidden"
      borderStyle="round"
      borderColor={border}
      paddingLeft={1}
      paddingRight={1}
    >
      <Box>
        <Text color={accent} bold>
          HEADLINES
        </Text>
        <Text color={noColor ? undefined : "gray"}>
          {" "}
          {items.length} · {focused ? "FOCUSED" : "tab to focus"}
        </Text>
      </Box>
      {items.length === 0 ? (
        <Box flexDirection="column">
          <Text color={noColor ? undefined : "gray"}>No headlines match this view.</Text>
          <Text color={noColor ? undefined : "gray"}>Try clearing search (Esc) or toggling filters.</Text>
        </Box>
      ) : (
        visible.slice.map((it, i) => {
          const globalIdx = visible.start + i;
          const isSel = globalIdx === selected;
          const dim = ageDim(it.published, now);
          const fresh = isNew(it.published, now);
          const chip = impactChipSuffix(it.impact, 3);
          const ago = timeAgo(it.published, now);
          const inner = `${it.title} — ${it.source} · ${ago}${chip ? ` ${chip}` : ""}`;
          const truncated = truncateByWidth(inner, Math.max(10, width - 14));
          return (
            <Box key={`${globalIdx}-${it.title}`} width="100%">
              <Text color={noColor ? undefined : isSel ? cyan : border}>{isSel ? "▌" : " "}</Text>
              <Text color={regionColor(it.region)} backgroundColor={undefined} bold>
                {` ${it.region.toUpperCase().slice(0, 12).padEnd(12, " ")} `}
              </Text>
              <Text
                color={noColor ? undefined : isSel ? "black" : dim ? "gray" : undefined}
                backgroundColor={noColor ? undefined : isSel ? cyan : undefined}
                bold={isSel}
                dimColor={!noColor && dim && !isSel}
                wrap="truncate"
              >
                {truncated}
              </Text>
              {fresh ? (
                <Text color={noColor ? undefined : "black"} backgroundColor={noColor ? undefined : "green"} bold>
                  {" NEW "}
                </Text>
              ) : null}
            </Box>
          );
        })
      )}
    </Box>
  );
}

export default React.memo(HeadlineList);
