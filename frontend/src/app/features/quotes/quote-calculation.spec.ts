import {
  calculateQuote,
  formatMeters,
  formatMoney,
  formatSquareMeters,
  QUOTE_EXAMPLE,
  QuoteDraft,
} from './quote-calculation';

describe('Gigantography quotation calculation', () => {
  it('calculates 7 × 3 m at 10 per m² as an area of 21 m² and a total of 210', () => {
    const result = calculateQuote(QUOTE_EXAMPLE);
    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error('Expected a valid example');
    expect(result.breakdown.areaSquareMillimeters).toBe(21_000_000n);
    expect(result.breakdown.printingCents).toBe(21_000n);
    expect(result.breakdown.slatsCents).toBe(0n);
    expect(result.breakdown.totalCents).toBe(21_000n);
  });

  it('adds the total price of all slats once', () => {
    const result = calculateQuote({ ...QUOTE_EXAMPLE, includeSlats: true, slatsPrice: '25.50' });
    expect(result).toMatchObject({
      valid: true,
      breakdown: { printingCents: 21_000n, slatsCents: 2_550n, totalCents: 23_550n },
    });
  });

  it('multiplies printing by the quantity and adds slats once for the whole item', () => {
    expect(
      calculateQuote({ ...QUOTE_EXAMPLE, quantity: '2', includeSlats: true, slatsPrice: '20' }),
    ).toMatchObject({
      valid: true,
      breakdown: {
        quantity: 2n,
        areaSquareMillimeters: 21_000_000n,
        totalAreaSquareMillimeters: 42_000_000n,
        printingCents: 42_000n,
        slatsCents: 2_000n,
        totalCents: 44_000n,
      },
    });
  });

  it('rounds the printing for all pieces in a line once', () => {
    expect(
      calculateQuote({
        ...QUOTE_EXAMPLE,
        quantity: '3',
        width: '0.05',
        height: '0.1',
        pricePerSquareMeter: '1',
      }),
    ).toMatchObject({ valid: true, breakdown: { printingCents: 2n } });
  });

  it.each(['', '0', '-1', '1.5', '1,5', '1e2'])('rejects invalid quantities: %s', (quantity) => {
    expect(calculateQuote({ ...QUOTE_EXAMPLE, quantity })).toMatchObject({
      valid: false,
      errors: { quantity: expect.any(String) },
    });
  });

  it('ignores an invalid slat price when slats are not included', () => {
    expect(calculateQuote({ ...QUOTE_EXAMPLE, slatsPrice: 'invalid' })).toMatchObject({
      valid: true,
      breakdown: { totalCents: 21_000n },
    });
  });

  it('accepts decimal commas, rounds the printing subtotal and then adds slats', () => {
    const result = calculateQuote({
      quantity: '1',
      width: '1,25',
      height: '2,5',
      pricePerSquareMeter: '10,50',
      includeSlats: true,
      slatsPrice: '1,19',
    });
    expect(result).toMatchObject({
      valid: true,
      breakdown: {
        areaSquareMillimeters: 3_125_000n,
        printingCents: 3_281n,
        slatsCents: 119n,
        totalCents: 3_400n,
      },
    });
  });

  it('rounds half a cent up without floating-point arithmetic', () => {
    expect(
      calculateQuote({ ...QUOTE_EXAMPLE, width: '0.05', height: '0.1', pricePerSquareMeter: '1' }),
    ).toMatchObject({ valid: true, breakdown: { printingCents: 1n } });
  });

  it.each(['', '0', '-7', 'NaN', 'Infinity', '7e3', '1.2345', '1,2.3'])(
    'rejects invalid dimensions: %s',
    (width) => {
      expect(calculateQuote({ ...QUOTE_EXAMPLE, width })).toMatchObject({
        valid: false,
        errors: { width: expect.any(String) },
      });
    },
  );

  it.each(['', '0', '-10', '1.001', 'Infinity'])(
    'rejects invalid prices: %s',
    (pricePerSquareMeter) => {
      expect(calculateQuote({ ...QUOTE_EXAMPLE, pricePerSquareMeter })).toMatchObject({
        valid: false,
        errors: { pricePerSquareMeter: expect.any(String) },
      });
    },
  );

  it('requires the optional price only while slats are enabled and allows an explicit zero', () => {
    const draft: QuoteDraft = { ...QUOTE_EXAMPLE, includeSlats: true };
    expect(calculateQuote(draft)).toMatchObject({
      valid: false,
      errors: { slatsPrice: expect.any(String) },
    });
    expect(calculateQuote({ ...draft, slatsPrice: '0' })).toMatchObject({
      valid: true,
      breakdown: { totalCents: 21_000n },
    });
  });

  it('keeps amounts larger than the safe Number integer range exact', () => {
    const result = calculateQuote({
      ...QUOTE_EXAMPLE,
      width: '100000000',
      height: '100000000',
      pricePerSquareMeter: '10.01',
    });
    expect(result).toMatchObject({
      valid: true,
      breakdown: { totalCents: 10_010_000_000_000_000_000n },
    });
  });

  it('formats cents and metric precision without rounding the area first', () => {
    expect(formatMoney(21_000n)).toBe('S/ 210.00');
    expect(formatMoney(100_010n)).toBe('S/ 1,000.10');
    expect(formatMeters(1_250n)).toBe('1.25');
    expect(formatSquareMeters(3_125_000n)).toBe('3.125');
    expect(formatSquareMeters(1n)).toBe('0.000001');
  });
});
