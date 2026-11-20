import { HttpErrorResponse } from '@angular/common/http';

export class ApiError extends Error {
  readonly status: number;

  constructor(response: HttpErrorResponse) {
    const message =
      response.status === 0
        ? 'No se pudo conectar con el servicio. Inténtalo de nuevo más tarde.'
        : response.status >= 500
          ? 'El servicio no está disponible en este momento.'
          : 'No se pudo completar la solicitud.';

    super(message, { cause: response });
    this.name = 'ApiError';
    this.status = response.status;
  }
}
