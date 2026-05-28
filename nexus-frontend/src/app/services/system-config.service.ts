import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const STORAGE_KEY = 'adp_system_config';
const API = 'http://localhost:8085/api/config/public';

@Injectable({ providedIn: 'root' })
export class SystemConfigService {
  private map: Record<string, string> = {};

  /** Load config from backend, persist to localStorage, apply CSS vars */
  load(http: HttpClient): Promise<void> {
    return http.get<any[]>(API).toPromise().then(list => {
      const m: Record<string, string> = {};
      (list || []).forEach(c => (m[c.configKey] = c.configValue ?? ''));
      this.map = m;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
      this.apply();
    }).catch(() => {
      // Backend unavailable — try localStorage fallback
      this.loadFromStorage();
    });
  }

  /** Apply stored config from localStorage (fast path, no HTTP) */
  loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { this.map = JSON.parse(raw); } catch { this.map = {}; }
    }
    this.apply();
  }

  get(key: string, fallback = ''): string {
    return this.map[key] ?? fallback;
  }

  isEnabled(feature: string): boolean {
    const v = this.map[`feature.${feature}`];
    return v !== 'false'; // undefined → enabled by default
  }

  /** Write a value locally and re-apply CSS vars immediately (for live preview) */
  previewSet(key: string, value: string) {
    this.map[key] = value;
    this.apply();
  }

  /** Apply CSS variables and dynamic content to the document */
  apply() {
    const s = document.documentElement.style;
    const p = this.get('theme.primary_color', '#D0271D');
    const pl = this.get('theme.primary_light', '#fff1f2');
    const hb = this.get('theme.header_bg', '#ffffff');

    s.setProperty('--adp-red', p);
    s.setProperty('--adp-red-light', pl || this.autoLight(p));
    s.setProperty('--adp-header-bg', hb);

    // Company name in tab title
    const name = this.get('general.company_name', 'Nexus HCM');
    if (name) document.title = name;
  }

  /** Generate a very light tint (~10% alpha) from a hex color */
  autoLight(hex: string): string {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},0.10)`;
    } catch { return '#fff1f2'; }
  }
}
