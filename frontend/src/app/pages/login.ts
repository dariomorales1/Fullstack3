import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="wrap">
      <div class="card animate-in">
        <div class="logo">P</div>
        <h1>Pedidos360</h1>
        <p class="muted sub">Plataforma de pedidos y despacho para PyMEs</p>

        @if (mode === 'local') {
          <p class="hint">Ingreso de desarrollo — elige un rol</p>
          <div class="roles">
            <button class="role" (click)="entrarLocal('ADMIN')" [disabled]="loading()">
              <span class="ri">👑</span> Administrador
            </button>
            <button class="role" (click)="entrarLocal('OPERADOR')" [disabled]="loading()">
              <span class="ri">🧑‍🍳</span> Operador
            </button>
            <button class="role" (click)="entrarLocal('CLIENTE')" [disabled]="loading()">
              <span class="ri">🛒</span> Cliente
            </button>
          </div>
        } @else {
          <button class="ms-btn primary" (click)="entrarMsal()" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            <svg viewBox="0 0 23 23" width="18" height="18"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
            Iniciar sesión con Microsoft
          </button>
          <p class="hint msal-hint">Usa tu cuenta corporativa de Azure AD</p>
        }

        @if (error()) { <p class="error err">{{ error() }}</p> }
      </div>
      <p class="foot">DSY1107 · Desarrollo Cloud Native</p>
    </div>
  `,
  styles: [`
    .wrap { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
      background:radial-gradient(1200px 600px at 20% -10%, #c7d2fe 0, transparent 50%),
                 radial-gradient(1000px 500px at 110% 110%, #ddd6fe 0, transparent 50%), #f1f5f9; padding:1rem; }
    .card { width:100%; max-width:400px; background:#fff; border-radius:20px; padding:2.4rem 2rem;
      box-shadow:0 20px 50px rgba(15,23,42,.14); text-align:center; }
    .logo { width:56px;height:56px;margin:0 auto 1rem; border-radius:16px; background:linear-gradient(135deg,#4f46e5,#7c3aed);
      display:grid; place-items:center; color:#fff; font-size:1.6rem; font-weight:800; box-shadow:0 10px 24px rgba(79,70,229,.45); }
    .sub { margin:.2rem 0 1.4rem; }
    .hint { font-size:.82rem; color:var(--ink-500); margin:.2rem 0 1rem; font-weight:600; }
    .roles { display:flex; flex-direction:column; gap:.6rem; }
    .role { display:flex; align-items:center; gap:.7rem; justify-content:flex-start; background:#f8fafc;
      border:1px solid var(--line); padding:.8rem 1rem; font-size:.95rem; border-radius:12px; }
    .role:hover { border-color:var(--brand-500); background:var(--brand-50); }
    .ri { font-size:1.2rem; }
    .ms-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:.6rem; padding:.85rem; font-size:.95rem; }
    .msal-hint { margin-top:1rem; }
    .err { margin-top:1rem; text-align:left; }
    .foot { margin-top:1.5rem; color:var(--ink-400); font-size:.78rem; }
  `],
})
export class Login implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  mode = this.auth.mode;
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // Si ya hay sesion (p.ej. al volver de Microsoft), salta directo al panel.
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  entrarLocal(role: string) { this.ejecutar(() => this.auth.loginLocal(role)); }
  entrarMsal() { this.ejecutar(() => this.auth.loginMsal()); }

  private async ejecutar(accion: () => Promise<void>) {
    this.loading.set(true); this.error.set(null);
    try { await accion(); this.router.navigate(['/dashboard']); }
    catch (e: any) { this.error.set(e?.message ?? 'No se pudo iniciar sesión'); }
    finally { this.loading.set(false); }
  }
}
