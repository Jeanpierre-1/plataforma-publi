import { Component, computed, input } from '@angular/core';

const ICON_PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  diagonal: 'M6 18 18 6M6 6h12v12',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'm6 6 12 12M6 18 18 6',
  sparkle: 'm12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z',
  stage: 'M3 21V5h18v16M3 5l5 7-5 4M21 5l-5 7 5 4M8 21v-4h8v4M9 3h6',
  print: 'M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6v-7ZM17 11h1',
} as const;

export type IconName = keyof typeof ICON_PATHS;

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25em;
      height: 1.25em;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icon {
  readonly name = input<IconName>('arrow');
  protected readonly path = computed(() => ICON_PATHS[this.name()]);
}
