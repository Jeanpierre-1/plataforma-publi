import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { SITE_NAME } from '../../core/config/site-config';
import { formatMeters, formatMoney, formatQuantity, formatSquareMeters } from './quote-calculation';
import { calculateQuoteDocument, QuoteDocumentDraft } from './quote-document';
import { QuotePdfError } from './quote-pdf-error';

export interface QuotePdfOptions {
  readonly logo: Uint8Array;
  readonly issuedAt: Date;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = 65;
const BODY_SIZE = 11;
const LINE_HEIGHT = 16;
const INK = rgb(32 / 255, 43 / 255, 40 / 255);
const MUTED = rgb(92 / 255, 101 / 255, 94 / 255);
const LINE = rgb(215 / 255, 217 / 255, 207 / 255);
const PAPER = rgb(247 / 255, 246 / 255, 242 / 255);
const LIME = rgb(220 / 255, 233 / 255, 155 / 255);

function localDateParts(date: Date): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
}

export function quotePdfFilename(date: Date): string {
  const parts = localDateParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? '';
  return `cotizacion-sanabria-group-${part('year')}${part('month')}${part('day')}-${part('hour')}${part('minute')}${part('second')}.pdf`;
}

function pdfText(value: string, font: PDFFont): string {
  const text = value.normalize('NFC').replace(/\s+/gu, ' ').trim();
  const supported = new Set(font.getCharacterSet());
  if ([...text].some((character) => !supported.has(character.codePointAt(0)!))) {
    throw new QuotePdfError(
      'Una descripción contiene símbolos no compatibles con el PDF. Usa letras, números y signos latinos para descargarla.',
    );
  }
  return text;
}

function wrapText(value: string, width: number, font: PDFFont, size = BODY_SIZE): string[] {
  const text = pdfText(value, font);
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (font.widthOfTextAtSize(word, size) > width) {
      if (line) {
        lines.push(line);
        line = '';
      }
      for (const character of word) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) {
          lines.push(line);
          line = '';
        }
        line += character;
      }
    } else if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function createQuotePdf(
  draft: Readonly<QuoteDocumentDraft>,
  options: QuotePdfOptions,
): Promise<Uint8Array> {
  const calculated = calculateQuoteDocument(draft.items);
  if (!calculated.totals || draft.items.some((item) => item.description.length > 160)) {
    throw new QuotePdfError('Completa o corrige todos los ítems antes de descargar la cotización.');
  }
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Cotización de gigantografías | ${SITE_NAME}`);
  pdf.setAuthor(SITE_NAME);
  pdf.setCreator(SITE_NAME);
  pdf.setLanguage('es-PE');
  pdf.setCreationDate(options.issuedAt);
  pdf.setModificationDate(options.issuedAt);
  const [font, bold, logo] = await Promise.all([
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
    pdf.embedPng(options.logo),
  ]);
  // Keep a single date format for both browser and server hosts; the date is always Lima time.
  const dateText = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(options.issuedAt)
    .replace(/\s+/gu, ' ');

  let page: PDFPage;
  let cursor = 0;
  const draw = (
    text: string,
    x: number,
    y: number,
    size = BODY_SIZE,
    strong = false,
    color = INK,
  ) => {
    page.drawText(pdfText(text, strong ? bold : font), {
      x,
      y,
      size,
      font: strong ? bold : font,
      color,
    });
  };
  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const dimensions = logo.scaleToFit(68, 64);
    page.drawImage(logo, { x: MARGIN, y: PAGE_HEIGHT - MARGIN - dimensions.height, ...dimensions });
    draw(SITE_NAME, MARGIN + 88, PAGE_HEIGHT - 56, 19, true);
    draw('Cotización de gigantografías', MARGIN + 88, PAGE_HEIGHT - 78, 13);
    draw(`Fecha de emisión (Lima): ${dateText}`, MARGIN + 88, PAGE_HEIGHT - 96, 9, false, MUTED);
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 122 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 122 },
      thickness: 1,
      color: LINE,
    });
    cursor = PAGE_HEIGHT - 148;
  };
  const ensureSpace = (height: number) => {
    if (cursor - height < BOTTOM_LIMIT) newPage();
  };
  newPage();
  draw('Detalle de piezas', MARGIN, cursor, 13, true);
  cursor -= 25;

  for (const [index, line] of calculated.lines.entries()) {
    if (!line.calculation.valid) continue;
    const item = line.calculation.breakdown;
    const title = wrapText(`Ítem ${index + 1}: ${line.description}`, CONTENT_WIDTH - 24, bold, 12);
    const columns = [
      [
        `Cantidad: ${formatQuantity(item.quantity)}`,
        `Medidas por pieza: ${formatMeters(item.widthMillimeters)} × ${formatMeters(item.heightMillimeters)} m`,
      ],
      [
        `Área total: ${formatSquareMeters(item.totalAreaSquareMillimeters)} m²`,
        `Precio por m²: ${formatMoney(item.unitPriceCents)}`,
      ],
      [
        `Impresión: ${formatMoney(item.printingCents)}`,
        `Listones del ítem: ${formatMoney(item.slatsCents)}`,
      ],
    ].map((row) => row.map((text) => wrapText(text, (CONTENT_WIDTH - 42) / 2, font)));
    const subtotal = wrapText(
      `Subtotal del ítem: ${formatMoney(item.totalCents)}`,
      CONTENT_WIDTH - 24,
      bold,
    );
    const height =
      32 +
      title.length * LINE_HEIGHT +
      columns.reduce(
        (sum, row) => sum + Math.max(row[0].length, row[1].length) * LINE_HEIGHT + 8,
        0,
      ) +
      subtotal.length * LINE_HEIGHT;
    ensureSpace(height + 14);
    page!.drawRectangle({
      x: MARGIN,
      y: cursor - height,
      width: CONTENT_WIDTH,
      height,
      color: PAPER,
    });
    let y = cursor - 20;
    for (const text of title) {
      draw(text, MARGIN + 12, y, 12, true);
      y -= LINE_HEIGHT;
    }
    y -= 8;
    for (const row of columns) {
      for (const [column, texts] of row.entries()) {
        for (const [offset, text] of texts.entries())
          draw(text, MARGIN + 12 + column * (CONTENT_WIDTH / 2), y - offset * LINE_HEIGHT);
      }
      y -= Math.max(row[0].length, row[1].length) * LINE_HEIGHT + 8;
    }
    for (const text of subtotal) {
      draw(text, MARGIN + 12, y, BODY_SIZE, true);
      y -= LINE_HEIGHT;
    }
    cursor -= height + 14;
  }

  const totals = calculated.totals;
  const totalRows = [
    `Cantidad total de piezas: ${formatQuantity(totals.quantity)}`,
    `Área total de impresión: ${formatSquareMeters(totals.areaSquareMillimeters)} m²`,
    `Subtotal de impresión: ${formatMoney(totals.printingCents)}`,
    `Listones: ${formatMoney(totals.slatsCents)}`,
  ].map((row) => wrapText(row, CONTENT_WIDTH - 28, font));
  const finalTotal = wrapText(
    `Total estimado: ${formatMoney(totals.totalCents)}`,
    CONTENT_WIDTH - 28,
    bold,
    16,
  );
  const totalHeight =
    38 +
    totalRows.reduce((sum, row) => sum + row.length * LINE_HEIGHT + 5, 0) +
    finalTotal.length * 22;
  ensureSpace(totalHeight + 48);
  page!.drawRectangle({
    x: MARGIN,
    y: cursor - totalHeight,
    width: CONTENT_WIDTH,
    height: totalHeight,
    color: INK,
  });
  let totalY = cursor - 22;
  for (const texts of totalRows) {
    for (const text of texts) {
      draw(text, MARGIN + 14, totalY, BODY_SIZE, false, PAPER);
      totalY -= LINE_HEIGHT;
    }
    totalY -= 5;
  }
  for (const text of finalTotal) {
    draw(text, MARGIN + 14, totalY - 6, 16, true, LIME);
    totalY -= 22;
  }
  cursor -= totalHeight + 23;
  const notes = wrapText(
    'Estimación basada en los valores ingresados. El precio total de listones se suma una vez por ítem. Sujeto a confirmación del alcance.',
    CONTENT_WIDTH,
    font,
    9,
  );
  for (const text of notes) {
    ensureSpace(14);
    draw(text, MARGIN, cursor, 9, false, MUTED);
    cursor -= 14;
  }

  for (const [index, pdfPage] of pdf.getPages().entries()) {
    pdfPage.drawLine({
      start: { x: MARGIN, y: 44 },
      end: { x: PAGE_WIDTH - MARGIN, y: 44 },
      thickness: 0.5,
      color: LINE,
    });
    pdfPage.drawText(SITE_NAME, { x: MARGIN, y: 28, size: 9, font, color: MUTED });
    const footer = `Página ${index + 1} de ${pdf.getPageCount()}`;
    pdfPage.drawText(footer, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(footer, 9),
      y: 28,
      size: 9,
      font,
      color: MUTED,
    });
  }
  return pdf.save();
}
