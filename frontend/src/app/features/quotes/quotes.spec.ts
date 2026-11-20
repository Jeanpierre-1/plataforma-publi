import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Quotes } from './quotes';
import { QuotePdfExport } from './quote-pdf-export';

describe('Quotation calculator', () => {
  let fixture: ComponentFixture<Quotes>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Quotes],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Quotes);
    root = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  async function enter(id: string, value: string): Promise<void> {
    const input = root.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  function total(): string | undefined {
    return root.querySelector('#quote-total')?.textContent?.trim();
  }

  it('renders the editable example with area, printing subtotal and total', () => {
    expect(root.querySelector('#quote-area')?.textContent).toBe('21 m²');
    expect(root.querySelector('#quote-printing')?.textContent).toBe('S/ 210.00');
    expect(total()).toBe('S/ 210.00');
    expect(root.querySelector('#quote-slats-price')).toBeNull();
  });

  it('recalculates prices and adds or removes the total slat charge', async () => {
    await enter('quote-width', '8');
    await enter('quote-rate', '12,50');
    expect(total()).toBe('S/ 300.00');
    const checkbox = root.querySelector<HTMLInputElement>('#quote-slats')!;
    checkbox.click();
    await fixture.whenStable();
    expect(total()).toBe('—');
    await enter('quote-slats-price', '35');
    expect(total()).toBe('S/ 335.00');
    checkbox.click();
    await fixture.whenStable();
    expect(root.querySelector('#quote-slats-price')).toBeNull();
    expect(total()).toBe('S/ 300.00');
    checkbox.click();
    await fixture.whenStable();
    expect(total()).toBe('S/ 335.00');
  });

  it('explains invalid input and removes the previous total', async () => {
    await enter('quote-width', '-1');
    expect(root.querySelector('#quote-width')?.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('#quote-width-error')?.textContent).toBeTruthy();
    expect(total()).toBe('—');
    expect(root.querySelector('#quote-printing')).toBeNull();
  });

  it('restores the example and clears validation state', async () => {
    await enter('quote-width', '');
    expect(total()).toBe('—');
    root.querySelector<HTMLButtonElement>('[data-action="reset-quote"]')?.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLInputElement>('#quote-width')?.value).toBe('7');
    expect(root.querySelector('#quote-width-error')).toBeNull();
    expect(total()).toBe('S/ 210.00');
  });

  async function addItem(): Promise<void> {
    root.querySelector<HTMLButtonElement>('[data-action="add-item"]')!.click();
    await fixture.whenStable();
  }

  async function completeItem(id: string): Promise<void> {
    await enter(`${id}-description`, 'Gráfica de ingreso');
    await enter(`${id}-quantity`, '2');
    await enter(`${id}-width`, '2');
    await enter(`${id}-height`, '1');
    await enter(`${id}-rate`, '15');
  }

  async function removeItem(id: string): Promise<void> {
    root
      .querySelector<HTMLButtonElement>(`[data-item-id="${id}"] [data-action="remove-item"]`)!
      .click();
    await fixture.whenStable();
  }

  it('adds an item, sums all areas and quantities, and recalculates when either item changes', async () => {
    await addItem();
    expect(total()).toBe('—');
    await completeItem('quote-2');
    expect(total()).toBe('S/ 270.00');
    expect(root.querySelector('#quote-total-quantity')?.textContent).toBe('3');
    expect(root.querySelector('#quote-area')?.textContent).toBe('25 m²');
    await enter('quote-quantity', '2');
    expect(total()).toBe('S/ 480.00');
    await enter('quote-2-width', '3');
    expect(total()).toBe('S/ 510.00');
    root.querySelector<HTMLInputElement>('#quote-2-slats')!.click();
    await fixture.whenStable();
    await enter('quote-2-slats-price', '10');
    expect(total()).toBe('S/ 520.00');
  });

  it('keeps surviving values and validation attached to their item after deleting a middle item', async () => {
    await addItem();
    await enter('quote-2-width', '-2');
    await addItem();
    await completeItem('quote-3');
    expect(total()).toBe('—');
    await removeItem('quote-2');
    expect(total()).toBe('S/ 270.00');
    expect(root.querySelector<HTMLInputElement>('#quote-3-width')?.value).toBe('2');
    expect(root.querySelector('#quote-3-width-error')).toBeNull();
    await enter('quote-3-width', '3');
    expect(total()).toBe('S/ 300.00');
    await addItem();
    expect(root.querySelector('#quote-4-width')).toBeTruthy();
    expect(root.querySelector('#quote-2-width')).toBeNull();
  });

  it('can remove the final item and start again with a fresh item', async () => {
    await removeItem('quote');
    expect(total()).toBe('—');
    expect(root.textContent).toContain('Agrega tu primera pieza.');
    await addItem();
    expect(root.querySelector<HTMLInputElement>('#quote-2-quantity')?.value).toBe('1');
    await completeItem('quote-2');
    expect(total()).toBe('S/ 60.00');
  });

  it('restores a single example and clears validation from every previous item', async () => {
    await addItem();
    await enter('quote-2-quantity', '1,5');
    expect(total()).toBe('—');
    root.querySelector<HTMLButtonElement>('[data-action="reset-quote"]')!.click();
    await fixture.whenStable();
    expect(root.querySelectorAll('app-quote-item-editor').length).toBe(1);
    expect(root.querySelector('#quote-2-quantity')).toBeNull();
    expect(root.querySelector('.field-error')).toBeNull();
    expect(total()).toBe('S/ 210.00');
  });

  it('downloads the current quotation and disables download while values are incomplete', async () => {
    const download = vi.spyOn(TestBed.inject(QuotePdfExport), 'download').mockResolvedValue();
    const button = root.querySelector<HTMLButtonElement>('[data-action="download-pdf"]')!;
    expect(button.disabled).toBe(false);
    await enter('quote-quantity', '2');
    button.click();
    await fixture.whenStable();
    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [expect.objectContaining({ quantity: '2', width: '7', height: '3' })],
      }),
    );
    await addItem();
    expect(button.disabled).toBe(true);
    button.click();
    expect(download).toHaveBeenCalledTimes(1);
  });

  it('prevents repeated download clicks while preparing a PDF and retains entered values on failure', async () => {
    let rejectDownload: (reason: Error) => void = () => undefined;
    const pending = new Promise<void>((_, reject) => {
      rejectDownload = reject;
    });
    const download = vi.spyOn(TestBed.inject(QuotePdfExport), 'download').mockReturnValue(pending);
    const button = root.querySelector<HTMLButtonElement>('[data-action="download-pdf"]')!;
    await enter('quote-rate', '12');
    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    button.click();
    expect(download).toHaveBeenCalledTimes(1);
    rejectDownload(new Error('Test failure'));
    await fixture.whenStable();
    expect(button.disabled).toBe(false);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo generar el PDF',
    );
    expect(root.querySelector<HTMLInputElement>('#quote-rate')?.value).toBe('12');
    expect(total()).toBe('S/ 252.00');
  });
});
