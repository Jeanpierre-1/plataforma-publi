export class QuotePdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotePdfError';
  }
}
