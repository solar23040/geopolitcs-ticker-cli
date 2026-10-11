export interface Quote {
  symbol: string;
  price: number;
  changePct: number;
  points: number[];
}

const cache = new Map<string, { q: Quote; ts: number }>();
const TTL = 60 * 1000;

interface ChartJson {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number };
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
}

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

async function fetchOne(symbol: string): Promise<Quote | null> {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < TTL) return cached.q;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  const { signal, done } = withTimeout(4000);
  try {
    const res = await fetch(url, { signal, headers: { "User-Agent": "geoticker/1.0" } });
    if (!res.ok) return cached?.q ?? null;
    const j = (await res.json()) as ChartJson;
    const r = j.chart?.result?.[0];
    const price = r?.meta?.regularMarketPrice;
    if (typeof price !== "number" || !Number.isFinite(price)) return cached?.q ?? null;
    const prev = r?.meta?.previousClose ?? r?.meta?.chartPreviousClose;
    const closes = r?.indicators?.quote?.[0]?.close ?? [];
    const pts = closes.filter((v): v is number => typeof v === "number" && Number.isFinite(v)).slice(-20);
    const changePct = typeof prev === "number" && prev !== 0 ? ((price - prev) / prev) * 100 : 0;
    const q: Quote = { symbol, price, changePct, points: pts.length > 0 ? pts : [price] };
    cache.set(symbol, { q, ts: Date.now() });
    return q;
  } catch {
    return cached?.q ?? null;
  } finally {
    done();
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const uniq = [...new Set(symbols)].slice(0, 24);
  const out = new Map<string, Quote>();
  // serve cache first
  const missing: string[] = [];
  for (const s of uniq) {
    const c = cache.get(s);
    if (c && Date.now() - c.ts < TTL) out.set(s, c.q);
    else missing.push(s);
  }
  if (missing.length === 0) return out;
  const settled = await Promise.allSettled(missing.map((s) => fetchOne(s)));
  settled.forEach((r, i) => {
    const sym = missing[i] as string;
    if (r.status === "fulfilled" && r.value) out.set(sym, r.value);
  });
  return out;
}

export function clearQuoteCache(): void {
  cache.clear();
}
