import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { ApiError } from './api-error';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  const isApiRequest =
    request.url === baseUrl ||
    request.url.startsWith(`${baseUrl}/`) ||
    request.url.startsWith(`${baseUrl}?`);

  if (!isApiRequest) return next(request);

  return next(request).pipe(
    catchError((error: unknown) =>
      throwError(() => (error instanceof HttpErrorResponse ? new ApiError(error) : error)),
    ),
  );
};
