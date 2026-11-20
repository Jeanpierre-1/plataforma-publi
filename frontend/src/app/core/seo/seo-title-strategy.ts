import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SITE_NAME } from '../config/site-config';

export interface PageSeo {
  readonly description: string;
  readonly noIndex?: boolean;
}

@Service({ autoProvided: false })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;

    const seo = route.data['seo'] as PageSeo | undefined;
    const title = `${this.buildTitle(snapshot) ?? 'Inicio'} | ${SITE_NAME}`;
    const description = seo?.description ?? 'Organización de eventos y publicidad gráfica.';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: seo?.noIndex ? 'noindex, follow' : 'index, follow',
    });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_PE' });
  }
}
