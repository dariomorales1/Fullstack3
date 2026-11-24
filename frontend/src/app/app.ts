import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (auth.authenticated()) {
      <header class="topbar">
        <a routerLink="/dashboard" class="brand">Pedidos360</a>
        <nav>
          <a routerLink="/catalog">Catalogo</a>
          <a routerLink="/orders">Pedidos</a>
          @if (auth.hasRole('ADMIN')) {
            <a routerLink="/reports">KPIs</a>
            <a routerLink="/audit">Auditoria</a>
          }
        </nav>
        <span class="spacer"></span>
        <span class="user">{{ auth.user() }} ({{ auth.roles().join(', ') }})</span>
        <button (click)="salir()">Salir</button>
      </header>
    }
    <main class="content"><router-outlet /></main>
  `,
  styles: [`
    .topbar { display: flex; align-items: center; gap: 1rem; padding: .6rem 1.2rem;
      background: #1f2937; color: #fff; }
    .brand { color: #fff; font-weight: 700; text-decoration: none; font-size: 1.1rem; }
    nav { display: flex; gap: 1rem; }
    nav a { color: #cbd5e1; text-decoration: none; }
    nav a:hover { color: #fff; }
    .spacer { flex: 1; }
    .user { font-size: .85rem; color: #cbd5e1; }
    .topbar button { background: #374151; color: #fff; border: none; padding: .35rem .8rem; border-radius: 6px; cursor: pointer; }
    .content { padding: 1.5rem; max-width: 1000px; margin: 0 auto; }
  `],
})
export class App {
  auth = inject(AuthService);
  private router = inject(Router);

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
