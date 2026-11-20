import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PUBLIC_NAVIGATION } from '../../../core/config/site-config';

@Component({
  selector: 'app-site-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav [attr.aria-label]="label()">
      <ul [class.is-footer]="variant() === 'footer'">
        @for (item of items; track item.path) {
          <li>
            <a
              [routerLink]="item.path"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: true }"
              ariaCurrentWhenActive="page"
              (click)="selected.emit()"
              >{{ item.label }}</a
            >
          </li>
        }
        @if (variant() === 'footer') {
          <li>
            <a routerLink="/cotizaciones" routerLinkActive="is-active" ariaCurrentWhenActive="page"
              >Cotizaciones</a
            >
          </li>
        }
      </ul>
    </nav>
  `,
  styleUrl: './site-nav.css',
})
export class SiteNav {
  readonly label = input('Principal');
  readonly variant = input<'header' | 'footer'>('header');
  readonly selected = output<void>();
  protected readonly items = PUBLIC_NAVIGATION;
}
