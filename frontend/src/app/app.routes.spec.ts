import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { SeoTitleStrategy } from './core/seo/seo-title-strategy';

describe('Public navigation and SEO', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding({ queryParams: false })),
        { provide: TitleStrategy, useClass: SeoTitleStrategy },
      ],
    });
  });

  it('navigates through every public route and updates page content and metadata', async () => {
    const harness = await RouterTestingHarness.create();
    const pages = [
      ['/', 'Ideas que se ven.', 'index, follow'],
      ['/eventos', 'Eventos musicales', 'index, follow'],
      ['/impresiones', 'Gigantografías e impresiones', 'index, follow'],
      ['/portafolio', 'Portafolio', 'noindex, follow'],
      ['/cotizaciones', 'Cotiza tus gigantografías.', 'index, follow'],
      ['/contacto', 'Conectemos con tu próxima idea', 'noindex, follow'],
      ['/pagina-inexistente', 'Esta página no está aquí', 'noindex, follow'],
    ] as const;

    for (const [url, heading, robots] of pages) {
      await harness.navigateByUrl(url);
      const element = harness.routeNativeElement;
      expect(element?.querySelectorAll('h1').length).toBe(1);
      expect(element?.querySelector('h1')?.textContent).toContain(heading);
      expect(element?.querySelector('header nav')).toBeTruthy();
      expect(element?.querySelector('footer nav')).toBeTruthy();
      expect(TestBed.inject(Title).getTitle()).toContain('Sanabria Group');
      expect(TestBed.inject(Meta).getTag('name="description"')?.content).toBeTruthy();
      expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe(robots);
      expect(TestBed.inject(Meta).getTag('property="og:title"')?.content).toBe(
        TestBed.inject(Title).getTitle(),
      );
    }
  });

  it('opens a local calculator without taking quotation values from URL parameters', async () => {
    const harness = await RouterTestingHarness.create('/cotizaciones?page=invalid');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Cotiza tus gigantografías.',
    );
    expect(harness.routeNativeElement?.querySelector('#quote-total')?.textContent).toContain(
      'S/ 210.00',
    );
    expect(harness.routeNativeElement?.querySelector('#quote-width')?.getAttribute('type')).toBe(
      'text',
    );
    expect(harness.routeNativeElement?.textContent).toContain(
      'No se guarda ni se envía una solicitud.',
    );
  });

  it('changes service content and anchor destinations when navigating between service pages', async () => {
    const harness = await RouterTestingHarness.create('/eventos?service=invalid');
    let element = harness.routeNativeElement;
    expect(element?.querySelector('#offering-title')?.textContent).toContain('Cumbia y folklore');
    expect(element?.querySelector('a[href="/eventos#preparar-proyecto"]')).toBeTruthy();
    expect(element?.querySelectorAll('details').length).toBeGreaterThan(0);

    await harness.navigateByUrl('/impresiones?service=invalid');
    element = harness.routeNativeElement;
    expect(element?.querySelector('#service-title')?.textContent).toBe(
      'Gigantografías e impresiones',
    );
    expect(element?.querySelector('.offering-grid')?.textContent).toContain('Paneles');
    expect(element?.querySelector('.offering-grid')?.textContent).toContain('Pasacalles');
    expect(element?.querySelector('a[href="/impresiones#preparar-proyecto"]')).toBeTruthy();
    expect(element?.querySelector('a[href="/cotizaciones"]')).toBeTruthy();
    expect(element?.querySelector('form')).toBeNull();
  });

  it('shows an honest empty portfolio with links to the confirmed services', async () => {
    const harness = await RouterTestingHarness.create('/portafolio');
    const element = harness.routeNativeElement;
    expect(element?.textContent).toContain('No hay proyectos publicados por el momento.');
    expect(element?.querySelector('.service-link[href="/eventos"]')).toBeTruthy();
    expect(element?.querySelector('.service-link[href="/impresiones"]')).toBeTruthy();
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
  });
});
