import { applyEach, disabled, maxLength, required, schema, validate } from '@angular/forms/signals';
import { QuoteNumericField, validateQuoteValue } from './quote-calculation';
import { QuoteDocumentDraft } from './quote-document';

export const quoteSchema = schema<QuoteDocumentDraft>((document) => {
  applyEach(document.items, (path) => {
    maxLength(path.description, 160, { message: 'Usa hasta 160 caracteres.' });
    for (const field of [
      'quantity',
      'width',
      'height',
      'pricePerSquareMeter',
      'slatsPrice',
    ] as const satisfies readonly QuoteNumericField[]) {
      required(path[field], { message: 'Ingresa un valor.' });
      validate(path[field], ({ value }) => {
        if (value() === '') return undefined;
        const message = validateQuoteValue(field, value());
        return message ? { kind: 'quoteValue', message } : undefined;
      });
    }
    disabled(path.slatsPrice, { when: ({ valueOf }) => !valueOf(path.includeSlats) });
  });
});
