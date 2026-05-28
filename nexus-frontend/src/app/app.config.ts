import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { SystemConfigService } from './services/system-config.service';

function initConfig(svc: SystemConfigService, http: HttpClient) {
  return () => svc.load(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [SystemConfigService, HttpClient],
      multi: true
    }
  ]
};
