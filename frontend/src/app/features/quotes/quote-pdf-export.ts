import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import { calculateQuoteDocument, QuoteDocumentDraft } from './quote-document';
import { QuotePdfError } from './quote-pdf-error';

@Service()
export class QuotePdfExport {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  async download(draft: Readonly<QuoteDocumentDraft>): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const snapshot: QuoteDocumentDraft = { items: draft.items.map((item) => ({ ...item })) };
    if (!calculateQuoteDocument(snapshot.items).totals) {
      throw new QuotePdfError(
        'Completa o corrige todos los ítems antes de descargar la cotización.',
      );
    }
    const issuedAt = new Date();
    const [pdf, logo] = await Promise.all([
      import('./quote-pdf'),
      fetch('/images/sanabria-group-logo.png').then(async (response) => {
        if (!response.ok)
          throw new QuotePdfError('No se pudo cargar el logo para el PDF. Inténtalo de nuevo.');
        return new Uint8Array(await response.arrayBuffer());
      }),
    ]);
    const bytes = await pdf.createQuotePdf(snapshot, { logo, issuedAt });
    const url = URL.createObjectURL(
      new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' }),
    );
    const link = this.document.createElement('a');
    link.href = url;
    link.download = pdf.quotePdfFilename(issuedAt);
    this.document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  }
}
