import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaEvento } from '../core/models';
import { AuditService } from '../services/audit.service';

@Component({
  selector: 'app-audit',
  imports: [FormsModule, DatePipe],
  template: `
    <h1>Auditoria (timeline de eventos)</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }

    <form (ngSubmit)="cargar()" class="row">
      <input name="cliente" [(ngModel)]="clienteId" placeholder="Cliente (opcional)" />
      <input name="tipo" [(ngModel)]="eventType" placeholder="Tipo de evento (opcional)" />
      <button class="primary" type="submit">Filtrar</button>
    </form>

    <table>
      <thead><tr><th>ID</th><th>Evento</th><th>Pedido</th><th>Cliente</th><th>Ocurrio</th></tr></thead>
      <tbody>
        @for (e of eventos(); track e.id) {
          <tr>
            <td>{{ e.id }}</td><td>{{ e.eventType }}</td><td>{{ e.pedidoId }}</td>
            <td>{{ e.clienteId }}</td><td>{{ e.ocurridoEn | date: 'short' }}</td>
          </tr>
        } @empty {
          <tr><td colspan="5" class="muted">Sin eventos</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-top: .5rem; }
    th, td { padding: .5rem .8rem; text-align: left; border-bottom: 1px solid #eee; }
    .row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .error { color: #b00020; } .muted { color: #888; }
  `],
})
export class Audit implements OnInit {
  private svc = inject(AuditService);
  eventos = signal<AuditoriaEvento[]>([]);
  error = signal<string | null>(null);
  clienteId = '';
  eventType = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.svc.eventos({ clienteId: this.clienteId || undefined, eventType: this.eventType || undefined }).subscribe({
      next: (e) => { this.eventos.set(e); this.error.set(null); },
      error: (e) => this.error.set(e?.error?.message || e?.message || 'Error'),
    });
  }
}
