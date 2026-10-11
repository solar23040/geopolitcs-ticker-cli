# GEOPOLITICS LIVE — Terminal News Ticker

A Bloomberg-terminal-style geopolitics news ticker for your terminal.
Live RSS headlines, a scrolling marquee, region filters, and a rule-based
**market impact engine** that answers: *"which stocks will this affect?"*

## Features

- **Live headlines** from BBC World, Al Jazeera, Google News, The Guardian, DW, and NPR World (parallel fetch, 5s timeout each, deduped, newest first)
- **Scrolling marquee** (~12 chars/sec, ~10fps, width-safe for emoji/wide chars) with per-headline impact chips like `▲OIL ▼INDIGO ▲HAL`
- **Market impact engine** (`src/lib/themes.ts` + `src/lib/impact.ts`): ~25 editable themes mapping stories → impacted symbols (NSE, US, EU, commodities, FX, crypto), with severity 1–5 and risk-on/risk-off sentiment
- **Best-effort live quotes** from Yahoo Finance chart endpoint (4s timeout, 60s cache, never blocks the UI), with sparklines, price, and day change %
- **Impact pane**: severity meter (●●●○○), sentiment badge, AFFECTED ASSETS table (arrow, symbol, price, change, sparkline, reason)
- **Market mood gauge** (CALM / WARY / TENSE / ALARM) + **Hot Assets** panel (top 5 symbols in the last hour)
- **Split layout**: headlines (55%) + impact (45%), stacked vertically under 100 columns; rounded bordered panels, 3 color themes, `NEW` badges, dimmed old stories
- **Search, region + impact-only filters, help overlay, loading splash**, graceful offline mode ("OFFLINE, RETRYING" keeps old data)

## Requirements

- Node 18+

## Install & Run

```sh
cd /mnt/media/projects/geoticker
npm install
npm run build

# One-shot headlines (also used for non-TTY / piped output)
node dist/index.js --once

# Interactive full-screen UI
node dist/index.js
npm run dev   # dev mode with tsx
npm start     # same as node dist/index.js
```

## Flags

| Flag | Default | Description |
|---|---|---|
| `--region <name>` | `All` | Start filtered (All, Middle East, Europe, Asia-Pacific, Americas, Africa, Global) |
| `--speed <n>` | `12` | Marquee chars per second |
| `--interval <seconds>` | `60` | Feed refresh interval |
| `--once` | — | Print latest 20 headlines with impact chips + severity, then exit (no UI) |
| `--no-prices` | — | Skip all quote network calls |

Also respects `NO_COLOR` and falls back to plain output when stdout is not a TTY.

## Keys

| Key | Action |
|---|---|
| `0–5`, `←`/`→` | Change region filter |
| `↑`/`↓` or `j`/`k` | Move selection (scrolls assets when impact pane focused) |
| `Tab` | Switch focus: list ↔ impact pane |
| `Enter` / `o` | Open selected link in browser |
| `Space` | Pause / resume marquee |
| `r` | Refresh now |
| `/` then `Esc` | Search headlines / clear |
| `i` | Toggle impact-only filter (severity ≥ 3) |
| `p` | Toggle live prices |
| `t` | Cycle color theme (Amber Terminal, Midnight Blue, Mono) |
| `?` | Help overlay |
| `q` / `Ctrl+C` | Quit |

## Extending the impact rules

All rules live in one file: `src/lib/themes.ts`. Each theme is:

```ts
{
  id: "hormuz-blockade",
  label: "Strait of Hormuz risk",
  patterns: ["hormuz", "tanker seized", ...],
  impacts: [
    { symbol: "BZ=F", name: "Brent Crude", market: "COM",
      direction: "up", reason: "Chokepoint threatens oil flows" },
    ...
  ]
}
```

Matching is case-insensitive substring on the headline; severity blends
escalation words (strike, invasion, sanctions, blockade, coup, nuclear,
missile…) with theme count; duplicate symbols merge to the strongest
direction (conflicts become `mixed`). Scores are memoized per title.

## Project structure

```
src/
  index.tsx            CLI flags, --once mode, Ink render, exit cleanup
  App.tsx              layout, filters, focus, key handling, themes
  components/
    Header.tsx         title, clock, online pill, market mood gauge
    Marquee.tsx        scrolling ticker + impact chips
    FilterBar.tsx      region + impact filter chips
    HeadlineList.tsx   scrollable headlines, pills, NEW badges
    ImpactPane.tsx     severity, sentiment, affected-assets table
    HotAssets.tsx      most-impacted symbols, last hour
    HelpOverlay.tsx    key reference
    Footer.tsx         hints + disclaimer
  lib/
    feeds.ts           feed list, parallel fetch, dedupe
    regions.ts         keyword → region tagging
    themes.ts          impact rules (edit me)
    impact.ts          scoring, chips, mood, hot assets
    quotes.ts          Yahoo Finance quotes, cached
    format.ts          relative time, truncation, sparkline
    types.ts           NewsItem, Region, impact types
    ui-theme.ts        3 color themes
  hooks/
    useNews.ts         polling, keeps old data on failure
    useQuotes.ts       non-blocking quote fetching
    useTick.ts         shared 100ms timer
```

## Notes

- Feeds are real; on failure the app keeps previous data and retries.
- Quotes are best-effort: missing prices render as `--`, never crash the UI.
- *Rule-based signals, not financial advice.*
