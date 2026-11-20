import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../button/button';

@Component({
  selector: 'app-project-cta',
  imports: [RouterLink, Button],
  template: `
    <section class="container project-cta" aria-label="Preparar un proyecto">
      <div>
        <p class="cta-label">El siguiente paso</p>
        <h2>{{ title() }}</h2>
        <p class="cta-description">{{ description() }}</p>
      </div>
      <div class="cta-action">
        <a appButton variant="light" routerLink="/cotizaciones">Calcular una gigantografía</a>
        <p>Medidas, precio por m² y listones editables.</p>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .project-cta {
      display: grid;
      gap: calc(var(--spacing) * 8);
      margin-block: var(--space-section);
      padding: calc(var(--spacing) * 8);
      background: var(--color-ink);
      color: var(--color-paper);
      border-radius: var(--radius-button);
    }
    .cta-label {
      margin-bottom: calc(var(--spacing) * 5);
      color: var(--color-lime);
      font-size: var(--text-sm);
      font-weight: 600;
    }
    h2 {
      max-width: 36rem;
      font-family: var(--font-display);
      font-size: var(--text-heading);
      font-weight: 500;
      letter-spacing: -0.045em;
      line-height: 1.15;
    }
    .cta-description {
      max-width: 36rem;
      margin-top: calc(var(--spacing) * 5);
      font-size: var(--text-base);
    }
    .cta-action {
      align-self: center;
      max-width: 22rem;
    }
    .cta-action p {
      margin-top: calc(var(--spacing) * 4);
      font-size: var(--text-sm);
    }
    :focus-visible {
      outline-color: var(--color-lime);
    }
    @media (min-width: 64rem) {
      .project-cta {
        grid-template-columns: 1.5fr 1fr;
        padding: calc(var(--spacing) * 12);
        gap: calc(var(--spacing) * 16);
      }
    }
  `,
})
export class ProjectCta {
  readonly title = input('Tu próxima idea empieza aquí.');
  readonly description = input(
    'Calcula el precio estimado de una gigantografía con los valores de tu proyecto.',
  );
}
