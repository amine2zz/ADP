import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export const API_BASE = 'http://localhost:8085/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly base = API_BASE;

  constructor(private http: HttpClient) {}

  get<T>(path: string) { return this.http.get<T>(`${this.base}${path}`); }
  post<T>(path: string, body: unknown) { return this.http.post<T>(`${this.base}${path}`, body); }
  put<T>(path: string, body: unknown) { return this.http.put<T>(`${this.base}${path}`, body); }
  patch<T>(path: string, body: unknown) { return this.http.patch<T>(`${this.base}${path}`, body); }
  delete<T>(path: string) { return this.http.delete<T>(`${this.base}${path}`); }
}
