export const SITE_NAME = 'Sanabria Group';

export interface NavigationItem {
  readonly label: string;
  readonly path: string;
}

export const PUBLIC_NAVIGATION: readonly NavigationItem[] = [
  { label: 'Inicio', path: '/' },
  { label: 'Eventos', path: '/eventos' },
  { label: 'Impresiones', path: '/impresiones' },
  { label: 'Portafolio', path: '/portafolio' },
  { label: 'Contacto', path: '/contacto' },
];
