import { calculateQuote, QUOTE_EXAMPLE, QuoteCalculation, QuoteDraft } from './quote-calculation';

export interface QuoteItemDraft extends QuoteDraft {
  id: string;
  description: string;
}

export interface QuoteDocumentDraft {
  items: QuoteItemDraft[];
}

export interface QuoteLineCalculation {
  readonly id: string;
  readonly description: string;
  readonly calculation: QuoteCalculation;
}

export interface QuoteTotals {
  readonly quantity: bigint;
  readonly areaSquareMillimeters: bigint;
  readonly printingCents: bigint;
  readonly slatsCents: bigint;
  readonly totalCents: bigint;
}

export interface QuoteDocumentCalculation {
  readonly lines: readonly QuoteLineCalculation[];
  readonly totals: QuoteTotals | null;
  readonly invalidItemCount: number;
}

export function createQuoteExample(): QuoteDocumentDraft {
  return { items: [{ ...QUOTE_EXAMPLE, id: 'quote', description: 'Gigantografía principal' }] };
}

export function createEmptyQuoteItem(id: string): QuoteItemDraft {
  return {
    id,
    description: '',
    quantity: '1',
    width: '',
    height: '',
    pricePerSquareMeter: '',
    includeSlats: false,
    slatsPrice: '',
  };
}

export function calculateQuoteDocument(items: readonly QuoteItemDraft[]): QuoteDocumentCalculation {
  const lines = items.map((item, index) => ({
    id: item.id,
    description: item.description.trim() || `Gigantografía ${index + 1}`,
    calculation: calculateQuote(item),
  }));
  let quantity = 0n;
  let areaSquareMillimeters = 0n;
  let printingCents = 0n;
  let slatsCents = 0n;
  let totalCents = 0n;
  let invalidItemCount = 0;

  for (const line of lines) {
    if (!line.calculation.valid) {
      invalidItemCount++;
      continue;
    }
    const value = line.calculation.breakdown;
    quantity += value.quantity;
    areaSquareMillimeters += value.totalAreaSquareMillimeters;
    printingCents += value.printingCents;
    slatsCents += value.slatsCents;
    totalCents += value.totalCents;
  }

  return {
    lines,
    invalidItemCount,
    totals:
      lines.length > 0 && invalidItemCount === 0
        ? { quantity, areaSquareMillimeters, printingCents, slatsCents, totalCents }
        : null,
  };
}
