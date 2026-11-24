import { Routes } from '@angular/router';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  {
    path: 'dashboard',
    canActivate: [roleGuard()],
    loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'catalog',
    canActivate: [roleGuard()],
    loadComponent: () => import('./pages/catalog').then((m) => m.Catalog),
  },
  {
    path: 'orders',
    canActivate: [roleGuard()],
    loadComponent: () => import('./pages/orders').then((m) => m.Orders),
  },
  {
    path: 'reports',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./pages/reports').then((m) => m.Reports),
  },
  {
    path: 'audit',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./pages/audit').then((m) => m.Audit),
  },
  { path: '**', redirectTo: 'dashboard' },
];
