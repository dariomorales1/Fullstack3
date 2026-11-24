import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protege rutas: exige sesion y, opcionalmente, alguno de los roles indicados. */
export function roleGuard(roles: string[] = []): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }
    if (roles.length > 0 && !roles.some((r) => auth.hasRole(r))) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  };
}
