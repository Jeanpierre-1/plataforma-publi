import { Routes } from '@angular/router';
import { provisionalRoutes } from './features/provisional/provisional.routes';
import { serviceRoutes } from './features/services/services.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/public/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Eventos y publicidad de gran formato',
        data: {
          seo: {
            description:
              'Sanabria Group: eventos musicales de cumbia y folklore, paneles, pasacalles y gigantografías de gran formato.',
          },
        },
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      ...serviceRoutes,
      {
        path: 'cotizaciones',
        title: 'Cotización de gigantografías por metro cuadrado',
        data: {
          seo: {
            description:
              'Cotiza varias gigantografías con descripción, cantidad, medidas y precio por metro cuadrado editables. Añade listones por ítem y calcula el total general.',
          },
        },
        loadComponent: () => import('./features/quotes/quotes').then((m) => m.Quotes),
      },
      {
        path: 'portafolio',
        title: 'Portafolio de eventos e impresiones',
        data: {
          seo: {
            description:
              'Conoce las líneas de trabajo de Sanabria Group. Los proyectos del portafolio se publicarán con fotografías y contenidos autorizados.',
            noIndex: true,
          },
        },
        loadComponent: () => import('./features/portfolio/portfolio').then((m) => m.Portfolio),
      },
      ...provisionalRoutes,
    ],
  },
];
