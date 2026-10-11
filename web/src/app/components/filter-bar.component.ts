import { ChangeDetectionStrategy, Component, input, model } from "@angular/core";
import { FILTERS } from "../core/model";
import type { RegionFilter } from "../core/model";

@Component({
  selector: "app-filter-bar",
  template: `
    <div class="bar" role="toolbar" aria-label="Headline filters">
      <div class="chips" role="group" aria-label="Region filter">
        @for (f of filters; track f) {
          <button
            type="button"
            class="chip"
            [class.active]="active() === f"
            [attr.aria-pressed]="active() === f"
            (click)="active.set(f)"
          >
            {{ f }} <span class="n">{{ counts()[f] ?? 0 }}</span>
          </button>
        }
        <button
          type="button"
          class="chip impact"
          [class.active]="impactOnly()"
          [attr.aria-pressed]="impactOnly()"
          (click)="impactOnly.set(!impactOnly())"
        >
          Impact <span class="n">{{ impactCount() }}</span>
        </button>
      </div>
      <input
        id="gt-search"
        type="search"
        class="search"
        placeholder="Search (/)"
        aria-label="Search headlines"
        [value]="search()"
        (input)="onSearch($event)"
      />
    </div>
  `,
  styleUrl: "./filter-bar.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  readonly active = model<RegionFilter>("All");
  readonly impactOnly = model<boolean>(false);
  readonly search = model<string>("");
  readonly counts = input<Record<string, number>>({});
  readonly impactCount = input<number>(0);

  protected readonly filters = FILTERS;

  onSearch(e: Event): void {
    const el = e.target as HTMLInputElement | null;
    if (el) this.search.set(el.value);
  }
}
