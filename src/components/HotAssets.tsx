import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { hotAssets } from "../lib/impact.js";
import type { NewsItem } from "../lib/types.js";
import type { UiTheme } from "../lib/ui-theme.js";
import { themeColor } from "../lib/ui-theme.js";

interface Props {
  items: NewsItem[];
  noColor: boolean;
  theme: UiTheme;
}

function HotAssets({ items, noColor, theme }: Props): React.JSX.Element {
  const border = themeColor(theme.border, theme.borderFallback, noColor);
  const accent = themeColor(theme.accent, theme.accentFallback, noColor);
  const gain = themeColor(theme.gain, theme.gainFallback, noColor);
  const loss = themeColor(theme.loss, theme.lossFallback, noColor);
  const mixed = themeColor(theme.mixed, "yellow", noColor);
  const hot = useMemo(() => hotAssets(items, 1, 5), [items]);
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={border} paddingLeft={1} paddingRight={1}>
      <Text color={accent} bold>
        HOT ASSETS · 1H
      </Text>
      {hot.length === 0 ? (
        <Text color={noColor ? undefined : "gray"}>Not enough fresh signal yet.</Text>
      ) : (
        hot.map((h) => {
          const arrow = h.direction === "up" ? "▲" : h.direction === "down" ? "▼" : "◆";
          const color = h.direction === "up" ? gain : h.direction === "down" ? loss : mixed;
          return (
            <Text key={h.symbol} wrap="truncate">
              <Text color={color} bold>
                {arrow}{" "}
              </Text>
              <Text bold>{h.symbol}</Text>
              <Text color={noColor ? undefined : "gray"}>
                {" "}
                {h.name} ×{h.count}
              </Text>
            </Text>
          );
        })
      )}
    </Box>
  );
}

export default React.memo(HotAssets);
