import { Component } from '@angular/core';
import { SITE_NAME } from '../../core/config/site-config';
import { Brand } from '../../shared/ui/brand/brand';
import { SiteNav } from '../../shared/ui/site-nav/site-nav';

@Component({
  selector: 'app-site-footer',
  imports: [Brand, SiteNav],
  template: `
    <footer class="site-footer">
      <div class="container grid gap-10 md:grid-cols-2">
        <div>
          <app-brand />
          <p class="footer-description">
            Ideas, espacios y marcas.<br />Eventos y publicidad que conectan.
          </p>
        </div>
        <app-site-nav label="Pie de página" variant="footer" />
      </div>
      <div class="container footer-note">
        <p>{{ siteName }}</p>
        <p>Sitio en preparación</p>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }
    .site-footer {
      padding-block: var(--space-section) calc(var(--spacing) * 6);
      border-top: 1px solid var(--color-line);
    }
    .footer-description {
      margin-top: calc(var(--spacing) * 5);
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.8;
    }
    .footer-note {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: calc(var(--spacing) * 3);
      margin-top: calc(var(--spacing) * 12);
      padding-top: calc(var(--spacing) * 5);
      border-top: 1px solid var(--color-line);
      color: var(--color-muted);
      font-size: var(--text-xs);
    }
  `,
})
export class SiteFooter {
  protected readonly siteName = SITE_NAME;
}
