import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  ...['', 'eventos', 'impresiones', 'portafolio', 'cotizaciones', 'contacto'].map(
    (path): ServerRoute => ({ path, renderMode: RenderMode.Prerender }),
  ),
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
