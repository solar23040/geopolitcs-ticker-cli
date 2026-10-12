import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of, switchMap, tap, timer } from "rxjs";
import { toHeadline } from "./model";
import type { ApiHeadline, Headline } from "./model";

const LAST_SEEN_KEY = "geoticker:lastSeenAt";

function loadLastSeen(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function saveLastSeen(ms: number): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(ms));
  } catch {
    // private mode etc: badges just won't persist
  }
}

@Injectable({ providedIn: "root" })
export class NewsService {
  private readonly http = inject(HttpClient);

  readonly headlines = signal<Headline[]>([]);
  readonly updatedAt = signal<Date | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly online = signal<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  /** Epoch ms of when the user last saw the list. Null until first load. */
  readonly lastSeenAt = signal<number | null>(loadLastSeen());

  /** Headlines fetched after the user last saw the list. */
  readonly newCount = computed(() => {
    const seen = this.lastSeenAt();
    if (seen === null) return 0;
    return this.headlines().filter(
      (h) => h.fetched_at instanceof Date && h.fetched_at.getTime() > seen,
    ).length;
  });

  constructor() {
    window.addEventListener("online", () => this.online.set(true));
    window.addEventListener("offline", () => this.online.set(false));
    // Mark seen when the tab regains focus and the list is on screen —
    // never on first render, so badges don't vanish instantly.
    window.addEventListener("focus", () => this.markSeen());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.markSeen();
    });
    timer(0, 60_000)
      .pipe(
        switchMap(() =>
          this.http.get<ApiHeadline[]>("/api/news").pipe(catchError(() => of(null))),
        ),
        tap(() => this.loading.set(false)),
      )
      .subscribe((data) => {
        if (data === null) {
          this.error.set("Could not refresh headlines. Showing last known data.");
          return;
        }
        this.headlines.set(data.map(toHeadline));
        this.updatedAt.set(new Date());
        this.error.set(null);
        // First render: anchor lastSeenAt to now so nothing flashes NEW.
        if (this.lastSeenAt() === null) this.setSeen(Date.now());
      });
  }

  isNew(h: Headline): boolean {
    const seen = this.lastSeenAt();
    if (seen === null) return false;
    return h.fetched_at instanceof Date && h.fetched_at.getTime() > seen;
  }

  /** Record that the user has seen the current list (focus / manual refresh). */
  markSeen(): void {
    if (this.headlines().length === 0) return;
    this.setSeen(Date.now());
  }

  private setSeen(ms: number): void {
    this.lastSeenAt.set(ms);
    saveLastSeen(ms);
  }

  refresh(): void {
    this.http
      .get<ApiHeadline[]>("/api/news")
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (data === null) {
          this.error.set("Could not refresh headlines. Showing last known data.");
          return;
        }
        this.headlines.set(data.map(toHeadline));
        this.updatedAt.set(new Date());
        this.error.set(null);
        // Manual refresh means the user is looking: clear NEW badges.
        this.markSeen();
      });
  }
}
