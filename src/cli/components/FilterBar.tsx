import React from "react";
import { Box, Text } from "ink";
import type { RegionFilter } from "../../lib/types.js";
import type { UiTheme } from "../ui-theme.js";
import { themeColor } from "../ui-theme.js";

export const FILTERS: RegionFilter[] = ["All", "India", "Middle East", "Europe", "Asia-Pacific", "Americas", "Africa"];

interface Props {
  active: RegionFilter;
  counts: Record<string, number>;
  impactOnly: boolean;
  impactCount: number;
  search: string;
  searchMode: boolean;
  noColor: boolean;
  theme: UiTheme;
}

function FilterBar({ active, counts, impactOnly, impactCount, search, searchMode, noColor, theme }: Props): React.JSX.Element {
  const accent = themeColor(theme.accent, theme.accentFallback, noColor);
  return (
    <Box width="100%" gap={1} flexWrap="wrap">
      {FILTERS.map((f, i) => {
        const isActive = f === active;
        const label = ` ${i} ${f} (${counts[f] ?? 0}) `;
        return (
          <Text
            key={f}
            color={noColor ? undefined : isActive ? "black" : accent}
            backgroundColor={noColor ? undefined : isActive ? accent : undefined}
            bold={isActive}
          >
            {label}
          </Text>
        );
      })}
      <Text
        color={noColor ? undefined : impactOnly ? "black" : "red"}
        backgroundColor={noColor ? undefined : impactOnly ? "red" : undefined}
        bold={impactOnly}
      >
        {` i IMPACT≥3 (${impactCount}) `}
      </Text>
      {searchMode || search ? <Text color={noColor ? undefined : "cyan"}> /{search}█</Text> : null}
    </Box>
  );
}

export default React.memo(FilterBar);
