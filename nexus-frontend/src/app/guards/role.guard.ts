import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed: UserRole[] = route.data['roles'] ?? [];
  if (allowed.length === 0 || allowed.includes(auth.getRole())) return true;
  router.navigate(['/login']);
  return false;
};
