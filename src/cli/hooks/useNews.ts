import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeeds } from "../../lib/feeds.js";
import type { NewsItem } from "../../lib/types.js";

export interface NewsState {
  items: NewsItem[];
  updatedAt: Date | null;
  offline: boolean;
  loading: boolean;
  refresh: () => void;
  refreshCount: number;
}

export function useNews(intervalMs: number): NewsState {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const fresh = await fetchFeeds();
      if (!mounted.current) return;
      setItems(fresh);
      setUpdatedAt(new Date());
      setOffline(false);
      setLoading(false);
    } catch {
      if (!mounted.current) return;
      setOffline(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load, refreshCount]);

  useEffect(() => {
    if (intervalMs <= 0) return;
    const t = setInterval(() => {
      void load();
    }, intervalMs);
    return () => clearInterval(t);
  }, [load, intervalMs]);

  const refresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

  return { items, updatedAt, offline, loading, refresh, refreshCount };
}
