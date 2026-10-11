import { ChangeDetectionStrategy, Component, output } from "@angular/core";

@Component({
  selector: "app-shortcuts-overlay",
  template: `
    <div class="scrim" (click)="close.emit()">
      <div class="card" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" (click)="$event.stopPropagation()">
        <h2>Keyboard shortcuts</h2>
        <dl>
          <div><dt>j / k · ↑ ↓</dt><dd>Move selection</dd></div>
          <div><dt>Enter / o</dt><dd>Open story in new tab</dd></div>
          <div><dt>1 – 6</dt><dd>Region filters</dd></div>
          <div><dt>/</dt><dd>Search</dd></div>
          <div><dt>t</dt><dd>Cycle theme</dd></div>
          <div><dt>?</dt><dd>This overlay</dd></div>
          <div><dt>Esc</dt><dd>Close</dd></div>
        </dl>
        <button type="button" (click)="close.emit()">Close</button>
      </div>
    </div>
  `,
  styleUrl: "./shortcuts-overlay.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutsOverlayComponent {
  readonly close = output<void>();
}
