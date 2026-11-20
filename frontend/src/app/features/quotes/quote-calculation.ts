export interface QuoteDraft {
  quantity: string;
  width: string;
  height: string;
  pricePerSquareMeter: string;
  includeSlats: boolean;
  slatsPrice: string;
}

export type QuoteNumericField = Exclude<keyof QuoteDraft, 'includeSlats'>;

export const QUOTE_EXAMPLE: Readonly<QuoteDraft> = {
  quantity: '1',
  width: '7',
  height: '3',
  pricePerSquareMeter: '10',
  includeSlats: false,
  slatsPrice: '',
};

export interface QuoteBreakdown {
  readonly quantity: bigint;
  readonly widthMillimeters: bigint;
  readonly heightMillimeters: bigint;
  readonly areaSquareMillimeters: bigint;
  readonly totalAreaSquareMillimeters: bigint;
  readonly unitPriceCents: bigint;
  readonly printingCents: bigint;
  readonly slatsCents: bigint;
  readonly totalCents: bigint;
}

export type QuoteCalculation =
  | { readonly valid: true; readonly breakdown: QuoteBreakdown }
  | { readonly valid: false; readonly errors: Partial<Record<QuoteNumericField, string>> };

const NUMERIC_FIELDS: readonly QuoteNumericField[] = [
  'quantity',
  'width',
  'height',
  'pricePerSquareMeter',
  'slatsPrice',
];
const INTEGER_FORMAT = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
const SQUARE_MILLIMETERS_PER_SQUARE_METER = 1_000_000n;

function decimalPlaces(field: QuoteNumericField): number {
  if (field === 'quantity') return 0;
  return field === 'width' || field === 'height' ? 3 : 2;
}

function toScaledInteger(value: string, places: number): bigint {
  const [whole, fraction = ''] = value.trim().replace(',', '.').split('.');
  return BigInt(whole + fraction.padEnd(places, '0'));
}

export function validateQuoteValue(field: QuoteNumericField, value: string): string | undefined {
  const normalized = value.trim();
  if (!normalized) return 'Ingresa un valor.';
  if (normalized.length > 32) return 'El valor es demasiado largo.';

  const places = decimalPlaces(field);
  if (field === 'quantity') {
    return /^\d+$/.test(normalized) && BigInt(normalized) > 0n
      ? undefined
      : 'Ingresa una cantidad entera mayor que cero.';
  }
  if (!new RegExp(`^\\d+(?:[.,]\\d{1,${places}})?$`).test(normalized)) {
    return `Ingresa un número sin signos, con hasta ${places} decimales.`;
  }
  if (field !== 'slatsPrice' && toScaledInteger(normalized, places) === 0n) {
    return 'El valor debe ser mayor que cero.';
  }
  return undefined;
}

export function calculateQuote(draft: Readonly<QuoteDraft>): QuoteCalculation {
  const errors: Partial<Record<QuoteNumericField, string>> = {};
  for (const field of NUMERIC_FIELDS) {
    if (field === 'slatsPrice' && !draft.includeSlats) continue;
    const error = validateQuoteValue(field, draft[field]);
    if (error) errors[field] = error;
  }
  if (Object.keys(errors).length > 0) return { valid: false, errors };

  const quantity = BigInt(draft.quantity.trim());
  const widthMillimeters = toScaledInteger(draft.width, 3);
  const heightMillimeters = toScaledInteger(draft.height, 3);
  const areaSquareMillimeters = widthMillimeters * heightMillimeters;
  const totalAreaSquareMillimeters = areaSquareMillimeters * quantity;
  const unitPriceCents = toScaledInteger(draft.pricePerSquareMeter, 2);
  // Integer arithmetic keeps decimal measurements exact. Round the printing subtotal once,
  // to the nearest cent (half up), before adding the total charge for the slats.
  const printingCents =
    (totalAreaSquareMillimeters * unitPriceCents + SQUARE_MILLIMETERS_PER_SQUARE_METER / 2n) /
    SQUARE_MILLIMETERS_PER_SQUARE_METER;
  const slatsCents = draft.includeSlats ? toScaledInteger(draft.slatsPrice, 2) : 0n;

  return {
    valid: true,
    breakdown: {
      quantity,
      widthMillimeters,
      heightMillimeters,
      areaSquareMillimeters,
      totalAreaSquareMillimeters,
      unitPriceCents,
      printingCents,
      slatsCents,
      totalCents: printingCents + slatsCents,
    },
  };
}

function formatScaled(value: bigint, places: number, trimZeros: boolean): string {
  const scale = 10n ** BigInt(places);
  const integer = INTEGER_FORMAT.format(value / scale);
  let fraction = (value % scale).toString().padStart(places, '0');
  if (trimZeros) fraction = fraction.replace(/0+$/, '');
  return fraction ? `${integer}.${fraction}` : integer;
}

export function formatMoney(cents: bigint): string {
  return `S/ ${formatScaled(cents, 2, false)}`;
}

export function formatMeters(millimeters: bigint): string {
  return formatScaled(millimeters, 3, true);
}

export function formatSquareMeters(squareMillimeters: bigint): string {
  return formatScaled(squareMillimeters, 6, true);
}

export function formatQuantity(quantity: bigint): string {
  return INTEGER_FORMAT.format(quantity);
}
