import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of, switchMap, tap, timer } from "rxjs";
import { toHeadline } from "./model";
import type { ApiHeadline, Headline } from "./model";

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

  constructor() {
    window.addEventListener("online", () => this.online.set(true));
    window.addEventListener("offline", () => this.online.set(false));
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
      });
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
      });
  }
}
