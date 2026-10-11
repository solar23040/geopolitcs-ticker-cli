import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { severityMeter, sparkline, timeAgo, truncateByWidth } from "../../lib/format.js";
import type { Quote } from "../../lib/quotes.js";
import type { NewsItem } from "../../lib/types.js";
import type { UiTheme } from "../ui-theme.js";
import { themeColor } from "../ui-theme.js";

interface Props {
  item: NewsItem | null;
  quotes: Map<string, Quote>;
  pricesOn: boolean;
  focused: boolean;
  scroll: number;
  height: number;
  width: number;
  now: Date;
  noColor: boolean;
  theme: UiTheme;
}

function arrowFor(d: string): { arrow: string; kind: "up" | "down" | "mixed" } {
  if (d === "up") return { arrow: "▲", kind: "up" };
  if (d === "down") return { arrow: "▼", kind: "down" };
  return { arrow: "◆", kind: "mixed" };
}

function ImpactPane({ item, quotes, pricesOn, focused, scroll, height, width, now, noColor, theme }: Props): React.JSX.Element {
  const border = themeColor(theme.border, theme.borderFallback, noColor);
  const accent = themeColor(theme.accent, theme.accentFallback, noColor);
  const gain = themeColor(theme.gain, theme.gainFallback, noColor);
  const loss = themeColor(theme.loss, theme.lossFallback, noColor);
  const mixedC = themeColor(theme.mixed, "yellow", noColor);
  const rows = useMemo(() => item?.impact.impacts ?? [], [item]);
  const maxRows = Math.max(1, height - 8);
  const start = Math.max(0, Math.min(scroll, Math.max(0, rows.length - maxRows)));
  const slice = rows.slice(start, start + maxRows);

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
          IMPACT
        </Text>
        <Text color={noColor ? undefined : "gray"}>{focused ? " · FOCUSED" : " · tab"}</Text>
      </Box>
      {!item ? (
        <Text color={noColor ? undefined : "gray"}>Select a headline to see impact.</Text>
      ) : (
        <>
          <Text bold wrap="truncate">
            {truncateByWidth(item.title, Math.max(10, width - 4))}
          </Text>
          <Box gap={1}>
            <Text color={item.impact.severity >= 3 ? loss : noColor ? undefined : "gray"}>
              {severityMeter(item.impact.severity)} {item.impact.severity}/5
            </Text>
            <Text
              color={noColor ? undefined : item.impact.sentiment === "risk-off" ? "white" : item.impact.sentiment === "risk-on" ? "black" : "gray"}
              backgroundColor={
                noColor ? undefined : item.impact.sentiment === "risk-off" ? "red" : item.impact.sentiment === "risk-on" ? "green" : undefined
              }
              bold
            >
              {` ${item.impact.sentiment.toUpperCase()} `}
            </Text>
            <Text color={noColor ? undefined : "gray"}>{timeAgo(item.published, now)}</Text>
          </Box>
          <Text color={accent} bold>
            AFFECTED ASSETS
          </Text>
          {slice.length === 0 ? (
            <Text color={noColor ? undefined : "gray"}>No strong asset link for this story.</Text>
          ) : (
            slice.map((a) => {
              const { arrow, kind } = arrowFor(a.direction);
              const color = kind === "up" ? gain : kind === "down" ? loss : mixedC;
              const q = pricesOn ? quotes.get(a.symbol) : undefined;
              const price = q ? q.price.toFixed(2) : "--";
              const chg = q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "--";
              const spark = q ? sparkline(q.points) : "─";
              const line = `${a.symbol} ${a.name} ${price} ${chg} ${spark} ${a.reason}`;
              return (
                <Box key={a.symbol} width="100%">
                  <Text color={color} bold>
                    {arrow}{" "}
                  </Text>
                  <Text wrap="truncate">
                    <Text bold>{a.symbol}</Text>
                    <Text color={noColor ? undefined : "gray"}> {truncateByWidth(a.name, 14)} </Text>
                    <Text>{price} </Text>
                    <Text color={q && q.changePct < 0 ? loss : gain}>{chg} </Text>
                    <Text color={noColor ? undefined : "gray"}>{spark} </Text>
                    <Text color={noColor ? undefined : "gray"}>{truncateByWidth(a.reason, 24)}</Text>
                  </Text>
                  <Text color={noColor ? undefined : "gray"}>{line.length > width ? "" : ""}</Text>
                </Box>
              );
            })
          )}
          {rows.length > maxRows ? (
            <Text color={noColor ? undefined : "gray"}>
              {start + 1}-{start + slice.length}/{rows.length} ↑↓ scroll
            </Text>
          ) : null}
        </>
      )}
    </Box>
  );
}

export default React.memo(ImpactPane);
