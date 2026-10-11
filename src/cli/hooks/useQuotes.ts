import { useEffect, useState } from "react";
import { fetchQuotes } from "../../lib/quotes.js";
import type { Quote } from "../../lib/quotes.js";

export function useQuotes(symbols: string[], enabled: boolean): Map<string, Quote> {
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const key = symbols.slice().sort().join(",");
  useEffect(() => {
    if (!enabled || symbols.length === 0) return;
    let alive = true;
    void fetchQuotes(symbols)
      .then((m) => {
        if (alive && m.size > 0) setQuotes(m);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return quotes;
}
