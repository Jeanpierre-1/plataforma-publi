import { calculateQuoteDocument, createEmptyQuoteItem, createQuoteExample } from './quote-document';

describe('Multiple-item quotation totals', () => {
  it('sums quantities, areas, printing and total slat charges across items', () => {
    const first = {
      ...createQuoteExample().items[0],
      quantity: '2',
      includeSlats: true,
      slatsPrice: '20',
    };
    const second = {
      ...createEmptyQuoteItem('second'),
      description: 'Ingreso',
      quantity: '3',
      width: '2',
      height: '1',
      pricePerSquareMeter: '15',
    };
    const result = calculateQuoteDocument([first, second]);
    expect(result.totals).toEqual({
      quantity: 5n,
      areaSquareMillimeters: 48_000_000n,
      printingCents: 51_000n,
      slatsCents: 2_000n,
      totalCents: 53_000n,
    });
    expect(result.invalidItemCount).toBe(0);
  });

  it('keeps the total pending if one item is incomplete', () => {
    const result = calculateQuoteDocument([
      ...createQuoteExample().items,
      createEmptyQuoteItem('second'),
    ]);
    expect(result.totals).toBeNull();
    expect(result.invalidItemCount).toBe(1);
    expect(result.lines[0].calculation).toMatchObject({
      valid: true,
      breakdown: { totalCents: 21_000n },
    });
  });

  it('returns an empty state instead of a zero-value quotation when all items are removed', () => {
    expect(calculateQuoteDocument([])).toEqual({ lines: [], totals: null, invalidItemCount: 0 });
  });

  it('recalculates the document after removing an invalid item', () => {
    const document = createQuoteExample();
    document.items.push({ ...createEmptyQuoteItem('second'), width: '-1' });
    expect(calculateQuoteDocument(document.items).totals).toBeNull();
    expect(
      calculateQuoteDocument(document.items.filter((item) => item.id !== 'second')).totals
        ?.totalCents,
    ).toBe(21_000n);
  });
});
