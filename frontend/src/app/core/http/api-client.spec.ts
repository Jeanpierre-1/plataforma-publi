import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from './api-client';
import { API_BASE_URL } from './api-config';
import { ApiError } from './api-error';
import { apiErrorInterceptor } from './api-error-interceptor';

describe('API infrastructure', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('does not send requests when instantiated', () => {
    expect(TestBed.inject(ApiClient)).toBeTruthy();
    httpTesting.expectNone(() => true);
  });

  it('uses the configured base URL and preserves typed responses and parameters', async () => {
    const result = firstValueFrom(
      TestBed.inject(ApiClient).get<{ name: string }>('/example', new HttpParams().set('page', 1)),
    );
    httpTesting.expectOne('/api/v1/example?page=1').flush({ name: 'Test fixture' });
    await expect(result).resolves.toEqual({ name: 'Test fixture' });
  });

  it('preserves a typed request body', async () => {
    const result = firstValueFrom(
      TestBed.inject(ApiClient).post<{ id: string }, { name: string }>('/example', {
        name: 'Test fixture',
      }),
    );
    const request = httpTesting.expectOne('/api/v1/example');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Test fixture' });
    request.flush({ id: 'fixture' });
    await expect(result).resolves.toEqual({ id: 'fixture' });
  });

  it.each([400, 404, 500])('propagates HTTP %i as an error, without retrying', async (status) => {
    const result = firstValueFrom(TestBed.inject(ApiClient).get('/example'));
    const rejected = expect(result).rejects.toMatchObject({ name: 'ApiError', status });
    httpTesting
      .expectOne('/api/v1/example')
      .flush({ detail: 'Backend fixture' }, { status, statusText: 'Error' });
    await rejected;
  });

  it('handles a network failure', async () => {
    const result = firstValueFrom(TestBed.inject(ApiClient).get('/example'));
    const rejected = expect(result).rejects.toBeInstanceOf(ApiError);
    httpTesting.expectOne('/api/v1/example').error(new ProgressEvent('error'));
    await rejected;
  });

  it('leaves errors outside the API scope unchanged', async () => {
    const result = firstValueFrom(TestBed.inject(HttpClient).get('/api/v10/example'));
    const rejected = expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    httpTesting.expectOne('/api/v10/example').flush(null, { status: 404, statusText: 'Not found' });
    await rejected;
  });
});
