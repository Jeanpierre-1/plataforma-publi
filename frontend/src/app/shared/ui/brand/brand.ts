import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_NAME } from '../../../core/config/site-config';

@Component({
  selector: 'app-brand',
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <a routerLink="/" class="brand" [attr.aria-label]="siteName + ' — Inicio'">
      <img
        class="brand-logo"
        ngSrc="/images/sanabria-group-logo.png"
        width="1335"
        height="1178"
        [alt]="siteName"
        [priority]="priority()"
        [disableOptimizedSrcset]="true"
      />
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      line-height: 0;
    }
    .brand-logo {
      width: calc(var(--spacing) * 28);
      height: auto;
      object-fit: contain;
    }
    @media (min-width: 64rem) {
      .brand-logo {
        width: calc(var(--spacing) * 32);
      }
    }
  `,
})
export class Brand {
  readonly priority = input(false);
  protected readonly siteName = SITE_NAME;
}
