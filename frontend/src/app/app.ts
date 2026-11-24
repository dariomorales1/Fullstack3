import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.authenticated()) {
      <div class="shell">
        <aside class="sidebar">
          <div class="brand">
            <span class="logo">P</span>
            <span class="brand-name">Pedidos<b>360</b></span>
          </div>
          <nav>
            <a routerLink="/dashboard" routerLinkActive="active">
              <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
              Panel
            </a>
            <a routerLink="/catalog" routerLinkActive="active">
              <svg viewBox="0 0 24 24"><path d="M20 4H4v4h16V4zM4 20h8v-8H4v8zm10 0h6v-8h-6v8z"/></svg>
              Catálogo
            </a>
            <a routerLink="/orders" routerLinkActive="active">
              <svg viewBox="0 0 24 24"><path d="M7 4V2h10v2h3v2h-2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6H4V4h3zm2 4v10h2V8H9zm4 0v10h2V8h-2z"/></svg>
              Pedidos
            </a>
            @if (auth.hasRole('ADMIN')) {
              <a routerLink="/reports" routerLinkActive="active">
                <svg viewBox="0 0 24 24"><path d="M5 9.2h3V19H5V9.2zM10.6 5h3v14h-3V5zm5.6 8H19v6h-2.8v-6z"/></svg>
                KPIs
              </a>
              <a routerLink="/audit" routerLinkActive="active">
                <svg viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm-1 15-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z"/></svg>
                Auditoría
              </a>
            }
          </nav>
          <div class="side-foot">
            <div class="avatar">{{ inicial() }}</div>
            <div class="who">
              <span class="who-name">{{ auth.user() }}</span>
              <span class="who-role">{{ auth.roles().join(', ') || 'sin rol' }}</span>
            </div>
          </div>
        </aside>

        <div class="main">
          <header class="topbar">
            <span class="hello">Hola, <b>{{ auth.user() }}</b></span>
            <button class="btn-ghost" (click)="salir()">Cerrar sesión</button>
          </header>
          <main class="content"><router-outlet /></main>
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .shell { display:flex; min-height:100vh; }
    .sidebar { width:248px; background:#0f172a; color:#cbd5e1; display:flex; flex-direction:column;
      padding:1.1rem .8rem; position:sticky; top:0; height:100vh; }
    .brand { display:flex; align-items:center; gap:.6rem; padding:.4rem .6rem 1.2rem; }
    .logo { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#8b5cf6);
      display:grid; place-items:center; color:#fff; font-weight:800; box-shadow:0 6px 16px rgba(99,102,241,.5); }
    .brand-name { font-size:1.15rem; font-weight:700; color:#fff; } .brand-name b { color:#a5b4fc; }
    nav { display:flex; flex-direction:column; gap:.2rem; flex:1; }
    nav a { display:flex; align-items:center; gap:.7rem; padding:.6rem .7rem; border-radius:10px;
      color:#cbd5e1; font-weight:600; font-size:.9rem; transition:background .15s, color .15s, transform .12s; }
    nav a svg { width:19px; height:19px; fill:currentColor; opacity:.8; }
    nav a:hover { background:rgba(148,163,184,.12); color:#fff; transform:translateX(2px); }
    nav a.active { background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; box-shadow:0 6px 16px rgba(79,70,229,.4); }
    nav a.active svg { opacity:1; }
    .side-foot { display:flex; align-items:center; gap:.6rem; padding:.7rem; border-top:1px solid rgba(148,163,184,.18); margin-top:.5rem; }
    .avatar { width:36px;height:36px;border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6);
      display:grid; place-items:center; color:#fff; font-weight:700; }
    .who { display:flex; flex-direction:column; overflow:hidden; }
    .who-name { color:#fff; font-size:.82rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
    .who-role { color:#94a3b8; font-size:.72rem; }
    .main { flex:1; display:flex; flex-direction:column; min-width:0; }
    .topbar { height:60px; background:rgba(255,255,255,.8); backdrop-filter:blur(8px); border-bottom:1px solid var(--line);
      display:flex; align-items:center; justify-content:space-between; padding:0 1.5rem; position:sticky; top:0; z-index:5; }
    .hello { color:var(--ink-500); font-size:.9rem; } .hello b { color:var(--ink-900); }
    .content { padding:1.75rem; max-width:1100px; width:100%; margin:0 auto; }
    @media (max-width:760px){ .sidebar{ width:72px; } .brand-name,.who,.side-foot .who{ display:none; } nav a{ justify-content:center; } nav a{ font-size:0; } nav a svg{ width:22px;height:22px; } }
  `],
})
export class App {
  auth = inject(AuthService);
  private router = inject(Router);
  inicial() { return (this.auth.user() || '?').charAt(0).toUpperCase(); }
  salir(): void { this.auth.logout(); this.router.navigate(['/login']); }
}
