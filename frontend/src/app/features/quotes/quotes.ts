import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import { Breadcrumbs } from '../../shared/ui/breadcrumbs/breadcrumbs';
import { Button } from '../../shared/ui/button/button';
import { formatMeters, formatMoney, formatQuantity, formatSquareMeters } from './quote-calculation';
import { calculateQuoteDocument, createEmptyQuoteItem, createQuoteExample } from './quote-document';
import { QuoteItemEditor } from './quote-item-editor';
import { quoteSchema } from './quote-schema';
import { QuotePdfExport } from './quote-pdf-export';
import { QuotePdfError } from './quote-pdf-error';

@Component({
  selector: 'app-quotes',
  imports: [Breadcrumbs, Button, QuoteItemEditor],
  templateUrl: './quotes.html',
  styleUrl: './quotes.css',
})
export class Quotes {
  private readonly injector = inject(Injector);
  private readonly pdfExport = inject(QuotePdfExport);
  private readonly addButton = viewChild<Button, ElementRef<HTMLButtonElement>>('addButton', {
    read: ElementRef,
  });
  private nextItemId = 2;
  protected readonly exportingPdf = signal(false);
  protected readonly pdfError = signal<string | null>(null);
  protected readonly draft = signal(createQuoteExample());
  protected readonly quoteForm = form(this.draft, quoteSchema);
  private readonly calculation = computed(() => calculateQuoteDocument(this.draft().items));
  protected readonly lines = computed(() =>
    this.calculation().lines.map((line) => {
      const result = line.calculation;
      return {
        id: line.id,
        description: line.description,
        details: result.valid
          ? {
              quantity: `${formatQuantity(result.breakdown.quantity)} ${result.breakdown.quantity === 1n ? 'pieza' : 'piezas'}`,
              dimensions: `${formatMeters(result.breakdown.widthMillimeters)} × ${formatMeters(result.breakdown.heightMillimeters)} m`,
              area: `${formatSquareMeters(result.breakdown.totalAreaSquareMillimeters)} m²`,
              printing: formatMoney(result.breakdown.printingCents),
              slats: formatMoney(result.breakdown.slatsCents),
              total: formatMoney(result.breakdown.totalCents),
            }
          : null,
      };
    }),
  );
  protected readonly summary = computed(() => {
    const totals = this.calculation().totals;
    if (!totals || this.quoteForm().invalid()) return null;
    return {
      quantity: formatQuantity(totals.quantity),
      area: `${formatSquareMeters(totals.areaSquareMillimeters)} m²`,
      printing: formatMoney(totals.printingCents),
      slats: formatMoney(totals.slatsCents),
      total: formatMoney(totals.totalCents),
    };
  });

  protected addItem(): void {
    const id = `quote-${this.nextItemId++}`;
    this.draft.update((document) => ({ items: [...document.items, createEmptyQuoteItem(id)] }));
    this.focusItem(id);
  }

  protected removeItem(id: string): void {
    const items = this.draft().items;
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const remaining = items.filter((item) => item.id !== id);
    this.draft.set({ items: remaining });
    this.focusItem(remaining[Math.min(index, remaining.length - 1)]?.id);
  }

  protected resetExample(): void {
    this.quoteForm().reset(createQuoteExample());
    this.nextItemId = 2;
    this.focusItem('quote');
    this.pdfError.set(null);
  }

  protected async downloadPdf(): Promise<void> {
    if (!this.summary() || this.exportingPdf()) return;
    this.exportingPdf.set(true);
    this.pdfError.set(null);
    try {
      await this.pdfExport.download(this.draft());
    } catch (error: unknown) {
      this.pdfError.set(
        error instanceof QuotePdfError
          ? error.message
          : 'No se pudo generar el PDF. Tus datos se conservan; inténtalo de nuevo.',
      );
    } finally {
      this.exportingPdf.set(false);
    }
  }

  private focusItem(id?: string): void {
    afterNextRender(
      () => {
        for (const item of this.quoteForm.items) {
          if (item().value().id === id) {
            item.description().focusBoundControl();
            return;
          }
        }
        this.addButton()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }
}
