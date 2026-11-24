import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-reports',
  imports: [DecimalPipe],
  template: `
    <div class="animate-in">
      <div class="row" style="justify-content:space-between">
        <div><h1>Reportería</h1><p class="muted">KPIs en tiempo real (vía Kafka).</p></div>
        <button (click)="cargar()">↻ Actualizar</button>
      </div>
      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (cargando()) {
        <div class="empty"><span class="spinner"></span></div>
      } @else if (kpis(); as k) {
        <div class="tiles">
          <div class="tile card-hover">
            <div class="ic" style="--c1:#10b981;--c2:#059669">💰</div>
            <div><span class="n">\${{ k['ventasEntregadas'] | number }}</span><span class="l">Ventas entregadas</span></div>
          </div>
          <div class="tile card-hover">
            <div class="ic" style="--c1:#f59e0b;--c2:#d97706">🛡️</div>
            <div><span class="n">{{ k['eventosAuditados'] }}</span><span class="l">Eventos auditados</span></div>
          </div>
          <div class="tile card-hover">
            <div class="ic" style="--c1:#6366f1;--c2:#8b5cf6">📈</div>
            <div><span class="n">{{ totalEventos(k) }}</span><span class="l">Eventos procesados</span></div>
          </div>
        </div>

        <h3>Eventos por tipo</h3>
        <div class="card">
          @for (e of entradas(k['eventosPorTipo']); track e[0]) {
            <div class="bar-row">
              <span class="bar-label">{{ e[0] }}</span>
              <div class="bar"><div class="fill" [style.width.%]="pct(e[1], k)"></div></div>
              <span class="bar-val">{{ e[1] }}</span>
            </div>
          } @empty { <p class="empty" style="padding:1rem">Aún no hay eventos. Crea pedidos para ver KPIs.</p> }
        </div>
      }
    </div>
  `,
  styles: [`
    .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1rem; margin:1.2rem 0; }
    .tile { display:flex; align-items:center; gap:1rem; padding:1.2rem; background:#fff; border:1px solid var(--line); border-radius:16px; box-shadow:var(--sh-sm); }
    .ic { width:48px;height:48px;border-radius:14px; display:grid; place-items:center; font-size:1.4rem; background:linear-gradient(135deg,var(--c1),var(--c2)); }
    .n { font-size:1.5rem; font-weight:800; display:block; } .l { font-size:.8rem; color:var(--ink-500); }
    .bar-row { display:flex; align-items:center; gap:.8rem; padding:.45rem 0; }
    .bar-label { width:150px; font-size:.85rem; font-weight:600; color:var(--ink-700); }
    .bar { flex:1; height:10px; background:#eef2f7; border-radius:999px; overflow:hidden; }
    .fill { height:100%; background:linear-gradient(90deg,#6366f1,#8b5cf6); border-radius:999px; transition:width .6s cubic-bezier(.2,.7,.2,1); }
    .bar-val { width:36px; text-align:right; font-weight:700; font-size:.85rem; }
  `],
})
export class Reports implements OnInit {
  private svc = inject(ReportService);
  kpis = signal<Record<string, any> | null>(null);
  error = signal<string | null>(null);
  cargando = signal(true);

  ngOnInit() { this.cargar(); }
  cargar() {
    this.cargando.set(true);
    this.svc.kpis().subscribe({
      next: (k) => { this.kpis.set(k); this.error.set(null); this.cargando.set(false); },
      error: (e) => { this.error.set(e?.error?.message || e?.message || 'Error'); this.cargando.set(false); },
    });
  }
  entradas(obj: any): [string, number][] { return obj ? Object.entries(obj) as [string, number][] : []; }
  totalEventos(k: any) { return this.entradas(k['eventosPorTipo']).reduce((s, e) => s + e[1], 0); }
  pct(v: number, k: any) { const m = Math.max(1, ...this.entradas(k['eventosPorTipo']).map(e => e[1])); return (v / m) * 100; }
}
