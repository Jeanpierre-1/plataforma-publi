import { decodePDFRawStream, PDFArray, PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { createEmptyQuoteItem, createQuoteExample } from './quote-document';
import { createQuotePdf, quotePdfFilename } from './quote-pdf';
import { QuotePdfError } from './quote-pdf-error';

const LOGO = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  ),
  (character) => character.charCodeAt(0),
);
const ISSUED_AT = new Date('2026-11-20T15:00:00Z');

function pageCommands(pdf: PDFDocument): string {
  return pdf
    .getPages()
    .map((page) => {
      const contents = page.node.Contents();
      const streams =
        contents instanceof PDFArray
          ? contents.asArray().map((reference) => pdf.context.lookup(reference))
          : [contents];
      return streams
        .filter((stream): stream is PDFRawStream => stream instanceof PDFRawStream)
        .map((stream) => new TextDecoder().decode(decodePDFRawStream(stream).decode()))
        .join('\n');
    })
    .join('\n');
}

function textHex(text: string): string {
  return [...text]
    .map((character) => character.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

describe('Quotation PDF', () => {
  it('creates a readable PDF with Spanish text, logo and the exact example total', async () => {
    const bytes = await createQuotePdf(createQuoteExample(), { logo: LOGO, issuedAt: ISSUED_AT });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe('Cotización de gigantografías | Sanabria Group');
    expect(pdf.getPageCount()).toBe(1);
    expect(pageCommands(pdf)).toContain(textHex('Total estimado: S/ 210.00'));
    expect(
      pdf.context
        .enumerateIndirectObjects()
        .some(
          ([, object]) =>
            object instanceof PDFRawStream &&
            object.dict.get(PDFName.of('Subtype'))?.toString() === '/Image',
        ),
    ).toBe(true);
  });

  it('exports the same multi-item total and slat charges as the calculator', async () => {
    const draft = createQuoteExample();
    draft.items[0].quantity = '2';
    draft.items[0].includeSlats = true;
    draft.items[0].slatsPrice = '20';
    draft.items.push({
      ...createEmptyQuoteItem('second'),
      description: 'Gráfica de ingreso',
      quantity: '3',
      width: '2',
      height: '1',
      pricePerSquareMeter: '15',
    });
    const pdf = await PDFDocument.load(
      await createQuotePdf(draft, { logo: LOGO, issuedAt: ISSUED_AT }),
    );
    const commands = pageCommands(pdf);
    expect(commands).toContain(textHex('Total estimado: S/ 530.00'));
    expect(commands).toContain(textHex('Listones del ítem: S/ 20.00'));
    expect(commands).toContain(textHex('Cantidad total de piezas: 5'));
  });

  it('paginates long quotations and keeps the final total and page numbering', async () => {
    const item = createQuoteExample().items[0];
    const items = Array.from({ length: 30 }, (_, index) => ({
      ...item,
      id: `item-${index}`,
      description: `Gigantografía ${index + 1}: ${'Texto para el evento musical. '.repeat(4)}`,
    }));
    const pdf = await PDFDocument.load(
      await createQuotePdf({ items }, { logo: LOGO, issuedAt: ISSUED_AT }),
    );
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pageCommands(pdf)).toContain(textHex('Total estimado: S/ 6,300.00'));
    expect(pageCommands(pdf)).toContain(
      textHex(`Página ${pdf.getPageCount()} de ${pdf.getPageCount()}`),
    );
    for (const page of pdf.getPages()) {
      expect(page.getWidth()).toBeCloseTo(595.28);
      expect(page.getHeight()).toBeCloseTo(841.89);
    }
  });

  it('refuses to generate an empty or invalid quotation', async () => {
    await expect(
      createQuotePdf({ items: [] }, { logo: LOGO, issuedAt: ISSUED_AT }),
    ).rejects.toBeInstanceOf(QuotePdfError);
    await expect(
      createQuotePdf(
        { items: [createEmptyQuoteItem('empty')] },
        { logo: LOGO, issuedAt: ISSUED_AT },
      ),
    ).rejects.toBeInstanceOf(QuotePdfError);
  });

  it('explains unsupported description characters instead of producing a broken document', async () => {
    const draft = createQuoteExample();
    draft.items[0].description = 'Evento 🎵';
    await expect(createQuotePdf(draft, { logo: LOGO, issuedAt: ISSUED_AT })).rejects.toThrow(
      'símbolos no compatibles',
    );
  });

  it('names downloads using the Lima date rather than the host timezone', () => {
    expect(quotePdfFilename(ISSUED_AT)).toBe('cotizacion-sanabria-group-20261120-100000.pdf');
    expect(quotePdfFilename(new Date('2026-11-20T02:30:00Z'))).toBe(
      'cotizacion-sanabria-group-20261119-213000.pdf',
    );
  });
});
