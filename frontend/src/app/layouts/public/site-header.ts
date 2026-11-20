import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Brand } from '../../shared/ui/brand/brand';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { SiteNav } from '../../shared/ui/site-nav/site-nav';

@Component({
  selector: 'app-site-header',
  imports: [Brand, Button, Icon, SiteNav, RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  host: { '(keydown.escape)': 'closeMenu(true)' },
})
export class SiteHeader {
  protected readonly menuOpen = signal(false);
  protected readonly menuLabel = computed(() => (this.menuOpen() ? 'Cerrar menú' : 'Abrir menú'));
  private readonly toggle = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationEnd) this.closeMenu();
      });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  protected closeMenu(restoreFocus = false): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (restoreFocus) this.toggle()?.nativeElement.focus();
  }
}
