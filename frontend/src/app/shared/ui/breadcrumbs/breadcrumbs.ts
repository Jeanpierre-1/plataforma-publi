import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  template: `
    <nav aria-label="Ruta de navegación">
      <ol>
        <li><a routerLink="/">Inicio</a></li>
        <li>
          <span aria-hidden="true">/</span><span aria-current="page">{{ current() }}</span>
        </li>
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
    ol {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: calc(var(--spacing) * 3);
      list-style: none;
      margin: 0;
      padding: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }
    li {
      display: flex;
      align-items: center;
      gap: calc(var(--spacing) * 3);
    }
    a {
      display: inline-flex;
      align-items: center;
      min-height: 2.75rem;
      color: inherit;
      text-underline-offset: 0.3em;
    }
  `,
})
export class Breadcrumbs {
  readonly current = input.required<string>();
}
