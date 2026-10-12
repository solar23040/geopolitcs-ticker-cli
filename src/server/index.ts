import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { serveStatic } from "@hono/node-server/serve-static";
import { fetchFeeds } from "../lib/feeds.js";
import { getRecent, initDb, toNewsItem } from "../lib/db/items.js";
import { fetchQuotes } from "../lib/quotes.js";
import { normalizeRegionName } from "../lib/regions.js";
import { NEUTRAL_IMPACT } from "../lib/types.js";
import type { NewsItem } from "../lib/types.js";

const PORT = Number(process.env.PORT) || 3000;
const CACHE_TTL = 60 * 1000;
const QUOTE_CACHE_TTL = 60 * 1000;

interface NewsCache {
  items: NewsItem[];
  updatedAt: string;
  error: string | null;
}

let newsCache: NewsCache = { items: [], updatedAt: new Date(0).toISOString(), error: null };
let refreshing = false;

async function refreshNews(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    const items = await fetchFeeds();
    newsCache = { items, updatedAt: new Date().toISOString(), error: null };
  } catch (err) {
    const message = (err as Error).message;
    // Feeds failed: fall back to recent stored items, else keep old data.
    try {
      const rows = await getRecent(48);
      if (rows.length > 0) {
        newsCache = { items: rows.map(toNewsItem), updatedAt: newsCache.updatedAt, error: message };
      } else {
        newsCache = { ...newsCache, error: message };
      }
    } catch (dbErr) {
      console.error("[db] fallback failed:", (dbErr as Error)?.message ?? dbErr);
      newsCache = { ...newsCache, error: message };
    }
  } finally {
    refreshing = false;
  }
}

function scheduleNewsRefresh(): void {
  void refreshNews();
  setInterval(() => void refreshNews(), CACHE_TTL);
}

interface QuotePayload {
  price: number;
  changePct: number;
  spark: number[];
}

const quoteCache = new Map<string, { q: QuotePayload; ts: number }>();
let quoteRefreshInFlight: Promise<void> | null = null;

async function refreshQuotes(symbols: string[]): Promise<void> {
  const uniq = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))].slice(0, 30);
  if (uniq.length === 0) return;
  try {
    const map = await fetchQuotes(uniq);
    const now = Date.now();
    for (const [sym, q] of map) {
      quoteCache.set(sym, { q: { price: q.price, changePct: q.changePct, spark: q.points }, ts: now });
    }
  } catch {
    // fail soft — keep stale entries
  }
}

function getCachedQuotes(symbols: string[]): Record<string, QuotePayload> {
  const out: Record<string, QuotePayload> = {};
  for (const s of symbols) {
    const c = quoteCache.get(s);
    if (c && Date.now() - c.ts < QUOTE_CACHE_TTL) out[s] = c.q;
  }
  return out;
}

// Background refresh loop for recently-requested symbols.
const watchedSymbols = new Set<string>();
setInterval(() => {
  if (watchedSymbols.size === 0) return;
  if (quoteRefreshInFlight) return;
  quoteRefreshInFlight = refreshQuotes([...watchedSymbols]).finally(() => {
    quoteRefreshInFlight = null;
  });
}, 30 * 1000);

// ---- rate limit: 60 req/min per IP ----
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 1000;
  const arr = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 60;
}

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

export function createApp(): Hono {
  const app = new Hono();

  app.use("*", cors());
  app.use("*", compress());

  app.use("/api/*", async (c, next) => {
    if (rateLimited(clientIp(c))) return c.json({ error: "rate limit exceeded" }, 429);
    await next();
  });

  app.get("/api/health", (c) =>
    c.json({ ok: true, updated: newsCache.updatedAt, newsError: newsCache.error })
  );

  app.get("/api/news", (c) => {
    // Never wait on slow feeds: serve cache, refresh in background if stale.
    const cacheAge = Date.now() - Date.parse(newsCache.updatedAt);
    const isStale = cacheAge > CACHE_TTL;
    if (isStale && newsCache.items.length > 0) {
      void refreshNews();
    } else if (newsCache.items.length === 0 && !refreshing) {
      void refreshNews();
    }
    let items = newsCache.items;
    const regionParam = c.req.query("region");
    if (regionParam) {
      const r = normalizeRegionName(regionParam);
      if (r && r !== "All") items = items.filter((it) => it.region === r);
    }
    const minSev = Number(c.req.query("minSeverity"));
    if (Number.isFinite(minSev) && minSev > 0) {
      items = items.filter((it) => it.impact.severity >= Math.floor(minSev));
    }
    if (isStale && newsCache.items.length > 0) {
      c.header("X-Cache-Stale", "true");
    }
    return c.json(
      items.slice(0, 80).map((it) => ({
        title: it.title,
        source: it.source,
        link: it.link,
        published: it.published instanceof Date ? it.published.toISOString() : String(it.published),
        region: it.region,
        impact: it.impact ?? NEUTRAL_IMPACT,
        // Added fields only; original shape untouched.
        cluster_id: it.cluster_id ?? null,
        sources: it.sources ?? [{ name: it.source, link: it.link }],
        source_count: it.source_count ?? 1,
        fetched_at:
          it.fetched_at instanceof Date ? it.fetched_at.toISOString() : (it.fetched_at ?? null),
        summary: it.summary ?? null,
        classified_by: it.classified_by ?? "keyword",
        stale: isStale,
      }))
    );
  });

  app.get("/api/quotes", async (c) => {
    const raw = c.req.query("symbols") ?? "";
    const symbols = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 30);
    if (symbols.length === 0) return c.json({});
    for (const s of symbols) watchedSymbols.add(s);

    const cached = getCachedQuotes(symbols);
    const missing = symbols.filter((s) => !cached[s]);
    if (missing.length > 0) {
      // Cold path only: await once so clients get data; warm path never waits.
      const hasAny = Object.keys(cached).length > 0 || quoteCache.size > 0;
      const p = refreshQuotes(missing);
      if (!hasAny) await p;
      else void p;
      for (const s of missing) {
        const e = quoteCache.get(s);
        if (e) cached[s] = e.q;
      }
    }
    return c.json(cached);
  });

  return app;
}

// Static Angular build (production): web/dist/web/browser + SPA fallback.
export function mountStatic(app: Hono): void {
  app.use("/*", serveStatic({ root: "./web/dist/web/browser" }));
  app.notFound((c) => {
    const p = c.req.path;
    if (p.startsWith("/api/")) return c.json({ error: "not found" }, 404);
    return serveStatic({ root: "./web/dist/web/browser", path: "index.html" })(c, async () => {
      // fallback noop
    }) as Response | Promise<Response>;
  });
}

const app = createApp();
mountStatic(app);

await initDb().catch((err) => console.error("[db] init failed, running without storage:", (err as Error)?.message ?? err));
scheduleNewsRefresh();

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`geoticker server listening on http://0.0.0.0:${info.port}`);
});
