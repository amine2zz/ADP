import { ApplicationConfig, APP_INITIALIZER, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { FeatureFlagService } from './services/feature-flag.service';

function initFeatureFlags(flags: FeatureFlagService) {
  return () => flags.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: initFeatureFlags,
      deps: [FeatureFlagService],
      multi: true
    }
  ]
};
