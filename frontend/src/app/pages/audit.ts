import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaEvento } from '../core/models';
import { AuditService } from '../services/audit.service';

@Component({
  selector: 'app-audit',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="animate-in">
      <h1>Auditoría</h1>
      <p class="muted">Timeline de eventos de negocio (vía Kafka).</p>
      @if (error()) { <p class="error">{{ error() }}</p> }

      <div class="card" style="margin:1rem 0">
        <form (ngSubmit)="cargar()" class="row">
          <input name="cliente" [(ngModel)]="clienteId" placeholder="Cliente (opcional)" style="flex:1;min-width:160px">
          <input name="tipo" [(ngModel)]="eventType" placeholder="Tipo de evento (opcional)" style="flex:1;min-width:160px">
          <button class="primary" type="submit">Filtrar</button>
        </form>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Evento</th><th>Pedido</th><th>Cliente</th><th>Ocurrió</th></tr></thead>
          <tbody>
            @if (cargando()) {
              <tr><td colspan="5" class="empty"><span class="spinner"></span></td></tr>
            } @else {
              @for (e of eventos(); track e.id) {
                <tr>
                  <td>{{ e.id }}</td>
                  <td><span class="badge neutral">{{ e.eventType }}</span></td>
                  <td>#{{ e.pedidoId }}</td>
                  <td>{{ e.clienteId }}</td>
                  <td class="muted">{{ e.ocurridoEn | date:'short' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">Sin eventos registrados</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class Audit implements OnInit {
  private svc = inject(AuditService);
  eventos = signal<AuditoriaEvento[]>([]);
  error = signal<string | null>(null);
  cargando = signal(true);
  clienteId = '';
  eventType = '';

  ngOnInit() { this.cargar(); }
  cargar() {
    this.cargando.set(true);
    this.svc.eventos({ clienteId: this.clienteId || undefined, eventType: this.eventType || undefined }).subscribe({
      next: (e) => { this.eventos.set(e); this.error.set(null); this.cargando.set(false); },
      error: (e) => { this.error.set(e?.error?.message || e?.message || 'Error'); this.cargando.set(false); },
    });
  }
}
