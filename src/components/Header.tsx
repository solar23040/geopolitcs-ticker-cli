import React from "react";
import { Box, Text } from "ink";
import { formatClock, timeAgo } from "../lib/format.js";
import type { Mood } from "../lib/impact.js";
import type { UiTheme } from "../lib/ui-theme.js";
import { themeColor } from "../lib/ui-theme.js";

interface Props {
  updatedAt: Date | null;
  offline: boolean;
  now: Date;
  noColor: boolean;
  mood: Mood;
  theme: UiTheme;
  pricesOn: boolean;
}

const GRAD = ["#FFB000", "#FF9E00", "#FF8C00", "#FF7A00", "#FF6B00"];

function GradientTitle({ text, noColor }: { text: string; noColor: boolean }): React.JSX.Element {
  if (noColor) return <Text bold>{text}</Text>;
  return (
    <Text bold>
      {text.split("").map((ch, i) => (
        <Text key={i} color={GRAD[i % GRAD.length]}>
          {ch}
        </Text>
      ))}
    </Text>
  );
}

function MoodBar({ mood, noColor, theme }: { mood: Mood; noColor: boolean; theme: UiTheme }): React.JSX.Element {
  const total = 10;
  const filled = Math.round(mood.score * total);
  const bar = "█".repeat(filled) + "░".repeat(total - filled);
  const color =
    mood.label === "CALM"
      ? themeColor(theme.gain, theme.gainFallback, noColor)
      : mood.label === "WARY"
        ? themeColor(theme.mixed, "yellow", noColor)
        : themeColor(theme.loss, theme.lossFallback, noColor);
  return (
    <Text>
      <Text color={noColor ? undefined : "gray"}>MOOD </Text>
      <Text color={color} bold>
        {bar} {mood.label}
      </Text>
    </Text>
  );
}

function Header({ updatedAt, offline, now, noColor, mood, theme, pricesOn }: Props): React.JSX.Element {
  const blinkOn = Math.floor(now.getTime() / 500) % 2 === 0;
  const updated = updatedAt ? timeAgo(updatedAt, now) : "never";
  const accent = themeColor(theme.accent, theme.accentFallback, noColor);
  return (
    <Box width="100%" flexDirection="column">
      <Box width="100%" justifyContent="space-between">
        <Box>
          <Text color={noColor ? undefined : blinkOn ? "#FF5C5C" : "#7A2E2E"}>{blinkOn ? "● " : "○ "}</Text>
          <GradientTitle text="GEOPOLITICS LIVE" noColor={noColor} />
          <Text color={noColor ? undefined : "gray"}> {formatClock(now)}</Text>
        </Box>
        <Box gap={1}>
          {offline ? (
            <Text color={noColor ? undefined : "white"} backgroundColor={noColor ? undefined : "red"} bold>
              {" OFFLINE "}
            </Text>
          ) : (
            <Text color={noColor ? undefined : "black"} backgroundColor={noColor ? undefined : "green"} bold>
              {" LIVE "}
            </Text>
          )}
          <Text color={noColor ? undefined : "gray"}>upd {updated}</Text>
          {!pricesOn ? <Text color={noColor ? undefined : "gray"}>$-off</Text> : null}
        </Box>
      </Box>
      <Box width="100%" justifyContent="space-between">
        <MoodBar mood={mood} noColor={noColor} theme={theme} />
        <Text color={noColor ? undefined : "gray"}>
          risk-off <Text color={accent}>{mood.riskOff}</Text> · risk-on {mood.riskOn}
        </Text>
      </Box>
    </Box>
  );
}

export default React.memo(Header);
