import { Route, Routes } from '@angular/router';
import { PageSeo } from '../../core/seo/seo-title-strategy';
import { ProvisionalPageContent } from './provisional-page';

function provisionalRoute(path: string, page: ProvisionalPageContent): Route {
  const seo: PageSeo = { description: page.introduction, noIndex: true };
  return {
    path,
    title: page.title,
    data: { page, seo },
    loadComponent: () => import('./provisional-page').then((m) => m.ProvisionalPage),
  };
}

export const provisionalRoutes: Routes = [
  provisionalRoute('contacto', {
    title: 'Conectemos con tu próxima idea',
    icon: 'arrow',
    introduction: 'Próximamente encontrarás aquí los canales de atención de la empresa.',
    note: 'Publicaremos los datos de contacto y horarios cuando estén confirmados.',
  }),
  provisionalRoute('**', {
    title: 'Esta página no está aquí',
    icon: 'arrow',
    notFound: true,
    introduction: 'La dirección que visitaste no corresponde a una página disponible.',
    note: 'Puedes regresar al inicio para explorar nuestros servicios.',
  }),
];
