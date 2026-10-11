import React from "react";
import { Box, Text } from "ink";

const ROWS: Array<[string, string]> = [
  ["0-5 / ←/→", "change region filter"],
  ["↑/↓ or j/k", "move selection (scroll assets when impact focused)"],
  ["Tab", "switch focus list / impact"],
  ["Enter / o", "open link in browser"],
  ["Space", "pause / resume marquee"],
  ["r", "refresh now"],
  ["/ then Esc", "search headlines / clear"],
  ["i", "toggle impact-only filter (severity ≥ 3)"],
  ["p", "toggle live prices"],
  ["t", "cycle color theme"],
  ["?", "toggle this help"],
  ["q / Ctrl+C", "quit"]
];

function HelpOverlay(): React.JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingLeft={2} paddingRight={2}>
      <Text color="cyan" bold>
        KEYS
      </Text>
      {ROWS.map(([k, d]) => (
        <Text key={k}>
          <Text bold>{k.padEnd(18, " ")}</Text>
          <Text> {d}</Text>
        </Text>
      ))}
      <Text color="gray">Press ? or Esc to close</Text>
    </Box>
  );
}

export default React.memo(HelpOverlay);
