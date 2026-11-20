import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

export type ApiPath = `/${string}`;

// Infrastructure only: feature services will own endpoint contracts and business rules.
@Service()
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get<TResponse>(path: ApiPath, params?: HttpParams): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}${path}`, { params });
  }

  post<TResponse, TBody>(path: ApiPath, body: TBody): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.baseUrl}${path}`, body);
  }
}
