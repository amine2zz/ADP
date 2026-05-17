import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from './api.service';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private flags: Record<string, boolean> = {};
  private loaded = false;

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const map = await firstValueFrom(
        this.http.get<Record<string, boolean>>(`${API_BASE}/features/map`)
      );
      this.flags = map ?? {};
      this.loaded = true;
    } catch {
      this.flags = {};
    }
  }

  isEnabled(key: string): boolean {
    return this.flags[key] === true;
  }

  getAll(): Record<string, boolean> {
    return { ...this.flags };
  }

  // Force a reload (called after toggling a flag in SuperAdmin)
  async reload(): Promise<void> {
    this.loaded = false;
    await this.load();
  }
}
