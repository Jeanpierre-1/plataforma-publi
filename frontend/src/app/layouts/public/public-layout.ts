import { afterNextRender, Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  template: `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    <app-site-header />
    <main #content id="contenido" tabindex="-1">
      <router-outlet (activate)="focusContent()" />
    </main>
    <app-site-footer />
  `,
  styles: ':host { display: flex; min-height: 100dvh; flex-direction: column; } main { flex: 1; }',
})
export class PublicLayout {
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private browserReady = false;

  constructor() {
    // Runs only in the browser, after hydration. Keep initial page focus untouched.
    afterNextRender(() => {
      this.browserReady = true;
    });
  }

  protected focusContent(): void {
    if (this.browserReady) this.content()?.nativeElement.focus({ preventScroll: true });
  }
}
