import { Route, Routes } from '@angular/router';
import { PageSeo } from '../../core/seo/seo-title-strategy';
import { EVENTS_CONTENT, PRINT_CONTENT, ServiceContent } from './service-content';

function serviceRoute(service: ServiceContent): Route {
  const seo: PageSeo = { description: service.description };
  return {
    path: service.path.slice(1),
    title: service.theme === 'events' ? 'Eventos musicales de cumbia y folklore' : service.title,
    data: { service, seo },
    loadComponent: () => import('./service-detail').then((m) => m.ServiceDetail),
  };
}

export const serviceRoutes: Routes = [serviceRoute(EVENTS_CONTENT), serviceRoute(PRINT_CONTENT)];
