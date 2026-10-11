import React from "react";
import { Box, Text } from "ink";

function Footer({ noColor, themeLabel }: { noColor: boolean; themeLabel: string }): React.JSX.Element {
  return (
    <Box width="100%" flexDirection="column">
      <Text color={noColor ? undefined : "gray"} wrap="truncate">
        tab focus · i impact · p prices · ? help · t theme({themeLabel}) · q quit
      </Text>
      <Text color={noColor ? undefined : "gray"} dimColor={!noColor}>
        Rule-based signals, not financial advice.
      </Text>
    </Box>
  );
}

export default React.memo(Footer);
