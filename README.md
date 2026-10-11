# GEOPOLITICS LIVE — Terminal + Web News Ticker

A Bloomberg-terminal-style geopolitics news ticker for your terminal
**and** your browser. Live RSS headlines, a scrolling marquee, region
filters, and a rule-based **market impact engine** that answers:
*"which stocks will this affect?"*

The CLI and the web app share the same logic in `src/lib/`
(feeds, regions, impact rules, quotes, formatting, types).

## Screenshots

> Placeholder — drop screenshots here.
>
> - `docs/cli.png` — terminal UI
> - `docs/web.png` — browser UI

## Features

- **Live headlines** from BBC World, Al Jazeera, Google News, The Guardian, DW, and NPR World (parallel fetch, 5s timeout each, deduped, newest first)
- **Scrolling marquee** with per-headline impact chips like `▲OIL ▼INDIGO ▲HAL`
- **Market impact engine** (`src/lib/themes.ts` + `src/lib/impact.ts`): ~25 editable themes mapping stories → impacted symbols (NSE, US, EU, commodities, FX, crypto), with severity 1–5 and risk-on/risk-off sentiment
- **Best-effort live quotes** from Yahoo Finance chart endpoint (4s timeout, 60s cache, never blocks the UI), with sparklines, price, and day change %
- **Impact pane**: severity meter (●●●○○), sentiment badge, AFFECTED ASSETS table (arrow, symbol, price, change, sparkline, reason)
- **Market mood gauge** (CALM / WARY / TENSE / ALARM) + **Hot Assets** panel (top 5 symbols in the last hour)
- **Web UI** (Angular): same palette as the CLI, 3 themes, search, keyboard shortcuts, bottom-sheet detail on mobile, reduced-motion support
- **Search, region + impact-only filters, help overlay, loading states**, graceful offline mode (keeps old data)

## Requirements

- Node 18+

## CLI usage

```sh
npm install
npm run build:cli

# One-shot headlines (also used for non-TTY / piped output)
node dist/index.js --once

# Interactive full-screen UI
node dist/index.js
npm run dev:cli   # dev mode with tsx
```

### Flags

| Flag | Default | Description |
|---|---|---|
| `--region <name>` | `All` | Start filtered (All, Middle East, Europe, Asia-Pacific, Americas, Africa, Global) |
| `--speed <n>` | `12` | Marquee chars per second |
| `--interval <seconds>` | `60` | Feed refresh interval |
| `--once` | — | Print latest 20 headlines with impact chips + severity, then exit (no UI) |
| `--no-prices` | — | Skip all quote network calls |

Also respects `NO_COLOR` and falls back to plain output when stdout is not a TTY.

### Keys (CLI)

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

## Web usage

```sh
npm install          # root deps (CLI + server)
npm --prefix web install  # Angular deps (once)

npm run dev          # server (:3000) + web dev server (:4200, proxies /api)
npm start            # production: built server serves web/dist/web/browser
```

Then open http://localhost:3000 (prod) or http://localhost:4200 (dev).

Web keys: `j`/`k` or arrows to move, `Enter`/`o` to open, `1–6` filters,
`/` search, `t` theme, `?` shortcuts overlay.

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/news` | `NewsItem[]` with impact, newest first, max 80. Optional `?region=` and `?minSeverity=`. |
| `GET /api/quotes?symbols=CL=F,GC=F` | `{ [symbol]: { price, changePct, spark } }`. Max 30 symbols; fails soft per symbol. |
| `GET /api/health` | `{ ok: true, updated: <ISO> }` |

News and quotes are cached 60s in memory with background refresh, so
requests never wait on slow feeds. Rate limited to 60 req/min per IP.

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

## Project layout

```
src/
  lib/               shared logic (Node + browser type-imports only)
    feeds.ts         feed list, parallel fetch, dedupe
    regions.ts       keyword → region tagging
    themes.ts        impact rules (edit me)
    impact.ts        scoring, chips, mood, hot assets
    quotes.ts        Yahoo Finance quotes, cached
    format.ts        relative time, truncation, sparkline (pure TS)
    types.ts         NewsItem, Region, impact types
  cli/               terminal UI (Ink/React)
    index.tsx        CLI flags, --once mode, Ink render, exit cleanup
    App.tsx          layout, filters, focus, key handling, themes
    ui-theme.ts      3 terminal color themes
    components/      Header, Marquee, FilterBar, HeadlineList,
                     ImpactPane, HotAssets, HelpOverlay, Footer
    hooks/           useNews, useQuotes, useTick
  server/
    index.ts         Hono API + static Angular hosting
web/                 Angular app (standalone, signals, OnPush)
  proxy.conf.json    dev proxy for /api → :3000
  src/app/
    app.component.ts shell, layout, keyboard handling
    core/            news/quotes/theme services, shared model
    components/      header, ticker, filter-bar, headline-list,
                     detail-panel, hot-assets, sparkline,
                     shortcuts-overlay
    pipes/           time-ago pipe
```

The web app imports only **types** from `src/lib` (via the `@lib/*`
tsconfig path alias, `import type`); all fetching goes through `/api/*`
because browsers can't call the RSS/Yahoo endpoints directly (CORS).

## Scripts

| Script | Action |
|---|---|
| `npm run dev:cli` | CLI in dev mode |
| `npm run dev:server` | API server in dev mode |
| `npm run dev:web` | Angular dev server |
| `npm run dev` | Server + web together |
| `npm run build:cli` | Build CLI + server to `dist/` |
| `npm run build:web` | Build Angular to `web/dist/` |
| `npm run build` | Both |
| `npm start` | Run built server (serves API + web UI) |

## Deploy

The repo ships a multi-stage `Dockerfile`: it builds the CLI, the server
and the Angular app, then runs the slim runtime (`node dist/server.js`)
which serves both the API and the static web build.

```sh
docker build -t geoticker .
docker run -p 3000:3000 geoticker
```

### Render / Railway / Fly

All three support deploying from a Dockerfile:

- **Render**: New → Web Service → point at the repo, set runtime to
  *Docker*, port `3000`. Set `PORT=3000` if required.
- **Railway**: New Project → Deploy from repo; Railway auto-detects the
  `Dockerfile`. Exposed port `3000`.
- **Fly**: `fly launch` (choose the Dockerfile), ensure
  `internal_port = 3000` in `fly.toml`, then `fly deploy`.

No secrets or env files are required; `PORT` (default `3000`) is the only
knob.

## Notes

- Feeds and quotes are real; on failure the app keeps previous data and retries.
- Quotes are best-effort: missing prices render as `—`, never crash the UI.
- *Rule-based signals, not financial advice.*
