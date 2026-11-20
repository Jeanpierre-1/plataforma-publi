import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/ui/button/button';
import { Icon, IconName } from '../../shared/ui/icon/icon';

export interface ProvisionalPageContent {
  readonly title: string;
  readonly introduction: string;
  readonly note: string;
  readonly icon: IconName;
  readonly notFound?: boolean;
}

@Component({
  selector: 'app-provisional-page',
  imports: [RouterLink, Button, Icon],
  template: `
    <section class="container section-space" aria-labelledby="page-title">
      <p class="eyebrow">{{ page().notFound ? 'Error 404' : 'Sección en preparación' }}</p>
      <div class="page-symbol"><app-icon [name]="page().icon" /></div>
      <h1 id="page-title" class="section-title">{{ page().title }}</h1>
      <p class="introduction">{{ page().introduction }}</p>
      <p class="page-note">{{ page().note }}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a appButton routerLink="/">Volver al inicio <app-icon name="arrow" /></a>
        @if (!page().notFound) {
          <a appButton variant="secondary" routerLink="/" fragment="servicios">Ver servicios</a>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    section {
      min-height: 65dvh;
    }
    .page-symbol {
      display: grid;
      place-items: center;
      width: 4rem;
      height: 4rem;
      margin-block: calc(var(--spacing) * 10) calc(var(--spacing) * 6);
      background: var(--color-lime);
      border-radius: var(--radius-button);
      font-size: 2rem;
    }
    h1 {
      max-width: 48rem;
    }
    .introduction {
      max-width: 40rem;
      margin-top: calc(var(--spacing) * 6);
      color: var(--color-ink-soft);
      font-size: var(--text-lg);
    }
    .page-note {
      max-width: 40rem;
      margin-top: calc(var(--spacing) * 5);
      color: var(--color-muted);
      font-size: var(--text-sm);
    }
  `,
})
export class ProvisionalPage {
  readonly page = input.required<ProvisionalPageContent>();
}
