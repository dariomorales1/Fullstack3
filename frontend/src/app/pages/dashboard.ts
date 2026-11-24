import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <h1>Panel</h1>
    <p>Bienvenido, <strong>{{ auth.user() }}</strong> — roles: {{ auth.roles().join(', ') || 'ninguno' }}</p>

    <div class="cards">
      <a routerLink="/catalog" class="card">Catalogo de productos</a>
      <a routerLink="/orders" class="card">Pedidos</a>
      @if (auth.hasRole('ADMIN')) {
        <a routerLink="/reports" class="card">Reporteria (KPIs)</a>
        <a routerLink="/audit" class="card">Auditoria</a>
      }
    </div>
  `,
  styles: [`
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem; }
    .card { display: block; padding: 1.5rem; background: #fff; border-radius: 10px; text-decoration: none;
      color: #1a1a1a; box-shadow: 0 2px 10px rgba(0,0,0,.06); font-weight: 600; }
    .card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.12); }
  `],
})
export class Dashboard {
  auth = inject(AuthService);
}
