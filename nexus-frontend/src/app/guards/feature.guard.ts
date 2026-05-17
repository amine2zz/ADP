import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { FeatureFlagService } from '../services/feature-flag.service';

export const featureGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const flags = inject(FeatureFlagService);
  const router = inject(Router);
  await flags.load();
  const key: string = route.data['feature'] ?? '';
  if (!key || flags.isEnabled(key)) return true;
  router.navigate(['/login']);
  return false;
};
