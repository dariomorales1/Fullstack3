import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-reports',
  imports: [DecimalPipe],
  template: `
    <h1>Reporteria (KPIs en tiempo real)</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }
    <button (click)="cargar()">Actualizar</button>

    @if (kpis(); as k) {
      <div class="tiles">
        <div class="tile"><span class="n">{{ k['ventasEntregadas'] | number }}</span><span>Ventas entregadas</span></div>
        <div class="tile"><span class="n">{{ k['eventosAuditados'] }}</span><span>Eventos auditados</span></div>
      </div>

      <h3>Eventos por tipo</h3>
      <table>
        <tbody>
          @for (e of entradas(k['eventosPorTipo']); track e[0]) {
            <tr><td>{{ e[0] }}</td><td>{{ e[1] }}</td></tr>
          } @empty {
            <tr><td class="muted">Aun no hay eventos</td></tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    .tiles { display: flex; gap: 1rem; margin: 1rem 0; }
    .tile { background: #fff; border-radius: 10px; padding: 1rem 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,.06); display: flex; flex-direction: column; }
    .tile .n { font-size: 1.6rem; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
    td { padding: .5rem .8rem; border-bottom: 1px solid #eee; }
    .error { color: #b00020; } .muted { color: #888; }
  `],
})
export class Reports implements OnInit {
  private svc = inject(ReportService);
  kpis = signal<Record<string, any> | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.svc.kpis().subscribe({
      next: (k) => { this.kpis.set(k); this.error.set(null); },
      error: (e) => this.error.set(e?.error?.message || e?.message || 'Error'),
    });
  }

  entradas(obj: Record<string, any> | undefined): [string, any][] {
    return obj ? Object.entries(obj) : [];
  }
}
