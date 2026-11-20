import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
  });

  it('opens the mobile navigation and restores toggle focus on Escape', async () => {
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const toggle = root.querySelector<HTMLButtonElement>('button');
    toggle?.click();
    await fixture.whenStable();
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#public-navigation')?.classList.contains('is-open')).toBe(true);
    const focus = vi.spyOn(toggle!, 'focus');
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(focus).toHaveBeenCalled();
  });

  it('closes navigation after a route change', async () => {
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('button')?.click();
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/contacto');
    await fixture.whenStable();
    expect(root.querySelector('button')?.getAttribute('aria-expanded')).toBe('false');
  });
});
