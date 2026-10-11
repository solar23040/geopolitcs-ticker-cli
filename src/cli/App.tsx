import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import open from "open";
import Header from "./components/Header.js";
import Marquee from "./components/Marquee.js";
import FilterBar, { FILTERS } from "./components/FilterBar.js";
import HeadlineList from "./components/HeadlineList.js";
import ImpactPane from "./components/ImpactPane.js";
import HotAssets from "./components/HotAssets.js";
import HelpOverlay from "./components/HelpOverlay.js";
import Footer from "./components/Footer.js";
import { useNews } from "./hooks/useNews.js";
import { useQuotes } from "./hooks/useQuotes.js";
import { useTick } from "./hooks/useTick.js";
import { marketMood } from "../lib/impact.js";
import { THEME_NAMES, getUiTheme } from "./ui-theme.js";
import type { ThemeName } from "./ui-theme.js";
import type { RegionFilter } from "../lib/types.js";

interface Props {
  initialRegion: RegionFilter;
  speed: number;
  intervalSec: number;
  noColor: boolean;
  pricesEnabled: boolean;
}

type Focus = "list" | "impact";

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function App({ initialRegion, speed, intervalSec, noColor, pricesEnabled }: Props): React.JSX.Element {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { items, updatedAt, offline, loading, refresh } = useNews(intervalSec * 1000);
  const tick = useTick(100);

  const [filter, setFilter] = useState<RegionFilter>(initialRegion);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [search, setSearch] = useState("");
  const [impactOnly, setImpactOnly] = useState(false);
  const [focus, setFocus] = useState<Focus>("list");
  const [assetScroll, setAssetScroll] = useState(0);
  const [pricesOn, setPricesOn] = useState(pricesEnabled);
  const [showHelp, setShowHelp] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);

  const themeName: ThemeName = THEME_NAMES[themeIdx % THEME_NAMES.length] as ThemeName;
  const theme = useMemo(() => getUiTheme(themeName, noColor), [themeName, noColor]);

  const nowClock = useMemo(() => new Date(), [Math.floor(tick / 10)]);
  const nowSlow = useMemo(() => new Date(), [Math.floor(tick / 300)]);
  const pulse = tick % 10 < 5;

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: items.length };
    for (const f of FILTERS) {
      if (f === "All") continue;
      c[f] = items.filter((it) => it.region === f).length;
    }
    return c;
  }, [items]);

  const impactCount = useMemo(() => items.filter((it) => it.impact.severity >= 3).length, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (filter !== "All" && it.region !== filter) return false;
      if (impactOnly && it.impact.severity < 3) return false;
      if (q && !`${it.title} ${it.source}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, impactOnly, search]);

  useEffect(() => {
    setSelected((s) => Math.max(0, Math.min(s, Math.max(0, filtered.length - 1))));
    setAssetScroll(0);
  }, [filtered.length, filter, search, impactOnly]);

  const mood = useMemo(() => marketMood(filtered.length > 0 ? filtered : items), [filtered, items]);

  const quoteSymbols = useMemo(() => {
    const out: string[] = [];
    for (const it of filtered.slice(0, 12)) {
      for (const a of it.impact.impacts.slice(0, 4)) {
        if (!out.includes(a.symbol)) out.push(a.symbol);
        if (out.length >= 20) break;
      }
      if (out.length >= 20) break;
    }
    return out;
  }, [filtered]);

  const quotes = useQuotes(quoteSymbols, pricesOn && pricesEnabled);

  const cycleFilter = (dir: 1 | -1): void => {
    setFilter((f) => {
      const idx = FILTERS.indexOf(f);
      const next = (idx + dir + FILTERS.length) % FILTERS.length;
      return FILTERS[next] as RegionFilter;
    });
    setSelected(0);
    setAssetScroll(0);
  };

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }
    if (showHelp) {
      if (input === "?" || key.escape) {
        setShowHelp(false);
        return;
      }
      if (input === "q") {
        exit();
        return;
      }
      return;
    }
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setSearch("");
        setSelected(0);
        return;
      }
      if (key.return) {
        setSearchMode(false);
        setSelected(0);
        return;
      }
      if (key.backspace || key.delete) {
        setSearch((s) => s.slice(0, -1));
        setSelected(0);
        return;
      }
      if (!key.ctrl && !key.meta && input && input.length === 1) {
        setSearch((s) => (s + input).slice(0, 80));
        setSelected(0);
        return;
      }
      return;
    }

    if (key.tab) {
      setFocus((f) => (f === "list" ? "impact" : "list"));
      return;
    }
    if (input === "q") {
      exit();
      return;
    }
    if (key.escape && search) {
      setSearch("");
      setSelected(0);
      return;
    }
    if (input === "?") {
      setShowHelp(true);
      return;
    }
    if (input === "t") {
      setThemeIdx((i) => (i + 1) % THEME_NAMES.length);
      return;
    }
    if (input === "i") {
      setImpactOnly((v) => !v);
      setSelected(0);
      setAssetScroll(0);
      return;
    }
    if (input === "p") {
      setPricesOn((v) => !v);
      return;
    }
    if (input === "/") {
      setSearchMode(true);
      return;
    }
    if (input === " ") {
      setPaused((p) => !p);
      return;
    }
    if (input === "r") {
      refresh();
      return;
    }
    if (key.return || input === "o") {
      const it = filtered[selected];
      if (it?.link) void open(it.link).catch(() => undefined);
      return;
    }
    if (key.upArrow || input === "k") {
      if (focus === "impact") setAssetScroll((s) => Math.max(0, s - 1));
      else setSelected((s) => Math.max(0, s - 1));
      return;
    }
    if (key.downArrow || input === "j") {
      if (focus === "impact") setAssetScroll((s) => s + 1);
      else setSelected((s) => Math.min(Math.max(0, filtered.length - 1), s + 1));
      return;
    }
    if (key.leftArrow) {
      cycleFilter(-1);
      return;
    }
    if (key.rightArrow) {
      cycleFilter(1);
      return;
    }
    if (/^[0-5]$/.test(input)) {
      const f = FILTERS[Number(input)];
      if (f) {
        setFilter(f);
        setSelected(0);
        setAssetScroll(0);
      }
    }
  });

  const columns = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;
  const wide = columns >= 100;

  const speedClamped = Math.max(1, Math.min(60, speed));
  const offsetChars = paused ? 0 : Math.floor((tick * speedClamped) / 10);
  const [frozenOffset, setFrozenOffset] = useState(0);
  useEffect(() => {
    if (!paused) setFrozenOffset(offsetChars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, paused]);
  const effectiveOffset = paused ? frozenOffset : offsetChars;

  const marqueeItems = useMemo(() => {
    const src = filtered.length > 0 ? filtered : items;
    return src.slice(0, 20);
  }, [filtered, items]);

  const selectedItem = filtered[selected] ?? null;
  const listWidth = wide ? Math.floor((columns - 8) * 0.55) : Math.max(10, columns - 4);
  const sideWidth = wide ? columns - listWidth - 8 : Math.max(10, columns - 4);
  const listHeight = Math.max(4, rows - 12);
  const impactHeight = Math.max(6, wide ? rows - 16 : 12);

  if (loading && items.length === 0) {
    const frame = SPINNER[tick % SPINNER.length];
    return (
      <Box width={columns} height={rows} flexDirection="column" alignItems="center" justifyContent="center">
        <Text color={noColor ? undefined : "yellow"} bold>
          {frame} GEOPOLITICS LIVE — fetching feeds…
        </Text>
        <Text color={noColor ? undefined : "gray"}>BBC · Al Jazeera · Guardian · DW · NPR</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={columns} height={rows} paddingLeft={1} paddingRight={1}>
      <Header updatedAt={updatedAt} offline={offline} now={nowClock} noColor={noColor} mood={mood} theme={theme} pricesOn={pricesOn && pricesEnabled} />
      <Marquee
        items={marqueeItems}
        width={Math.max(10, columns - 6)}
        offsetChars={effectiveOffset}
        now={nowSlow}
        noColor={noColor}
        theme={theme}
        pulse={pulse}
      />
      <FilterBar
        active={filter}
        counts={counts}
        impactOnly={impactOnly}
        impactCount={impactCount}
        search={search}
        searchMode={searchMode}
        noColor={noColor}
        theme={theme}
      />
      {showHelp ? (
        <HelpOverlay />
      ) : wide ? (
        <Box width="100%" flexGrow={1} gap={1} overflow="hidden">
          <Box width={listWidth} flexShrink={0} flexDirection="column" overflow="hidden">
            <HeadlineList
              items={filtered}
              selected={selected}
              height={listHeight}
              width={listWidth}
              now={nowSlow}
              noColor={noColor}
              theme={theme}
              focused={focus === "list"}
            />
          </Box>
          <Box width={sideWidth} flexShrink={0} flexDirection="column" gap={1} overflow="hidden">
            <ImpactPane
              item={selectedItem}
              quotes={quotes}
              pricesOn={pricesOn && pricesEnabled}
              focused={focus === "impact"}
              scroll={assetScroll}
              height={impactHeight}
              width={sideWidth}
              now={nowSlow}
              noColor={noColor}
              theme={theme}
            />
            <HotAssets items={items} noColor={noColor} theme={theme} />
          </Box>
        </Box>
      ) : (
        <Box width="100%" flexDirection="column" flexGrow={1} gap={1} overflow="hidden">
          <HeadlineList
            items={filtered}
            selected={selected}
            height={Math.max(4, Math.floor(listHeight / 2))}
            width={Math.max(10, columns - 4)}
            now={nowSlow}
            noColor={noColor}
            theme={theme}
            focused={focus === "list"}
          />
          <ImpactPane
            item={selectedItem}
            quotes={quotes}
            pricesOn={pricesOn && pricesEnabled}
            focused={focus === "impact"}
            scroll={assetScroll}
            height={impactHeight}
            width={Math.max(10, columns - 4)}
            now={nowSlow}
            noColor={noColor}
            theme={theme}
          />
          <HotAssets items={items} noColor={noColor} theme={theme} />
        </Box>
      )}
      <Footer noColor={noColor} themeLabel={theme.label} />
    </Box>
  );
}

export default App;
