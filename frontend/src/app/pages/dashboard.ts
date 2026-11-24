import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="animate-in">
      <h1>Panel</h1>
      <p class="muted">Bienvenido, <strong>{{ auth.user() }}</strong>. Rol:
        <span class="badge info">{{ auth.roles().join(', ') || 'sin rol' }}</span>
      </p>

      <div class="grid">
        <a routerLink="/catalog" class="tile card-hover" style="--c1:#6366f1;--c2:#8b5cf6">
          <div class="ic">📦</div><div class="tx"><b>Catálogo</b><span>Productos y stock</span></div>
        </a>
        <a routerLink="/orders" class="tile card-hover" style="--c1:#0ea5e9;--c2:#2563eb">
          <div class="ic">🧾</div><div class="tx"><b>Pedidos</b><span>Crear y seguir estados</span></div>
        </a>
        @if (auth.hasRole('ADMIN')) {
          <a routerLink="/reports" class="tile card-hover" style="--c1:#10b981;--c2:#059669">
            <div class="ic">📊</div><div class="tx"><b>KPIs</b><span>Métricas en tiempo real</span></div>
          </a>
          <a routerLink="/audit" class="tile card-hover" style="--c1:#f59e0b;--c2:#d97706">
            <div class="ic">🛡️</div><div class="tx"><b>Auditoría</b><span>Timeline de eventos</span></div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:1rem; margin-top:1.5rem; }
    .tile { display:flex; align-items:center; gap:1rem; padding:1.3rem; background:#fff; border:1px solid var(--line);
      border-radius:16px; box-shadow:var(--sh-sm); color:var(--ink-900); }
    .ic { width:50px;height:50px;border-radius:14px; display:grid; place-items:center; font-size:1.5rem;
      background:linear-gradient(135deg,var(--c1),var(--c2)); box-shadow:0 8px 20px color-mix(in srgb, var(--c1) 40%, transparent); }
    .tx { display:flex; flex-direction:column; } .tx b { font-size:1.05rem; } .tx span { font-size:.82rem; color:var(--ink-500); }
  `],
})
export class Dashboard {
  auth = inject(AuthService);
}
