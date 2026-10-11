import { useEffect, useState } from "react";

export function useTick(intervalMs: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (intervalMs <= 0) return;
    const t = setInterval(() => {
      setTick((v) => v + 1);
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return tick;
}
