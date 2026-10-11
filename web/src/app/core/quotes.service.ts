import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of } from "rxjs";
import type { QuoteData } from "./model";

const STALE_MS = 55_000;

/** Fetches /api/quotes only for requested symbols; merges into a cached signal. Never throws. */
@Injectable({ providedIn: "root" })
export class QuotesService {
  private readonly http = inject(HttpClient);

  readonly quotes = signal<Record<string, QuoteData>>({});
  private readonly lastFetch = new Map<string, number>();
  private readonly watched = new Set<string>();
  private pending = false;

  constructor() {
    window.setInterval(() => {
      if (this.watched.size > 0) this.fetch([...this.watched], true);
    }, 60_000);
  }

  ensure(symbols: string[]): void {
    const uniq = [...new Set(symbols.map((s) => s.trim()).filter((s) => s.length > 0))];
    for (const s of uniq) this.watched.add(s);
    const now = Date.now();
    const need = uniq.filter((s) => now - (this.lastFetch.get(s) ?? 0) > STALE_MS);
    if (need.length === 0) return;
    this.fetch(need.slice(0, 30), false);
  }

  private fetch(symbols: string[], background: boolean): void {
    if (symbols.length === 0 || this.pending) return;
    this.pending = true;
    const url = `/api/quotes?symbols=${symbols.map(encodeURIComponent).join(",")}`;
    this.http
      .get<Record<string, QuoteData>>(url)
      .pipe(catchError(() => of({})))
      .subscribe((res) => {
        this.pending = false;
        const t = Date.now();
        for (const s of symbols) this.lastFetch.set(s, t);
        if (!background || Object.keys(res).length > 0) {
          const entries = Object.entries(res);
          if (entries.length > 0) {
            this.quotes.update((cur) => ({ ...cur, ...res }));
          }
        }
      });
  }
}
