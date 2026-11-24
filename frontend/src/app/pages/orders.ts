import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Pedido } from '../core/models';
import { OrdersService } from '../services/orders.service';

@Component({
  selector: 'app-orders',
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="animate-in">
      <h1>Pedidos</h1>
      <p class="muted">Crea pedidos y gestiona su ciclo de estados.</p>
      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (puedeCrear()) {
        <div class="card" style="margin:1rem 0">
          <h3 style="margin-top:0">Nuevo pedido</h3>
          <form (ngSubmit)="crear()" class="row">
            <input name="cliente" [(ngModel)]="clienteId" placeholder="Cliente" required style="min-width:160px">
            <input name="prodId" type="number" [(ngModel)]="item.productoId" placeholder="Prod ID" required style="width:90px">
            <input name="prodNom" [(ngModel)]="item.nombreProducto" placeholder="Producto" required style="flex:1;min-width:140px">
            <input name="cant" type="number" [(ngModel)]="item.cantidad" placeholder="Cant" required style="width:80px">
            <input name="precio" type="number" [(ngModel)]="item.precioUnitario" placeholder="Precio" required style="width:100px">
            <button class="primary" type="submit">+ Crear</button>
          </form>
        </div>
      }

      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
          <tbody>
            @if (cargando()) {
              <tr><td colspan="5" class="empty"><span class="spinner"></span></td></tr>
            } @else {
              @for (p of pedidos(); track p.id) {
                <tr>
                  <td>#{{ p.id }}</td>
                  <td>{{ p.clienteId }}</td>
                  <td><span class="badge" [class]="'badge ' + badge(p.estado)">{{ p.estado }}</span></td>
                  <td><b>\${{ p.total | number }}</b></td>
                  <td>
                    @if (puedeCambiar()) {
                      <div class="row" style="gap:.4rem">
                        <select #sel>
                          @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
                        </select>
                        <button class="btn-sm primary" (click)="cambiar(p.id, sel.value)">Cambiar</button>
                      </div>
                    } @else { <span class="muted">—</span> }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">Sin pedidos</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class Orders implements OnInit {
  private svc = inject(OrdersService);
  auth = inject(AuthService);
  pedidos = signal<Pedido[]>([]);
  error = signal<string | null>(null);
  cargando = signal(true);
  estados = ['ACEPTADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'];
  clienteId = 'cliente@demo.cl';
  item = { productoId: 1, nombreProducto: 'Pan amasado', cantidad: 1, precioUnitario: 1500 };

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (p) => { this.pedidos.set(p); this.cargando.set(false); },
      error: (e) => { this.error.set(this.msg(e)); this.cargando.set(false); },
    });
  }
  crear() {
    this.svc.crear({ clienteId: this.clienteId, items: [{ ...this.item }] }).subscribe({
      next: () => { this.error.set(null); this.cargar(); }, error: (e) => this.error.set(this.msg(e)),
    });
  }
  cambiar(id: number, estado: string) {
    this.svc.cambiarEstado(id, estado).subscribe({ next: () => this.cargar(), error: (e) => this.error.set(this.msg(e)) });
  }
  badge(estado: string) {
    return { CREADO: 'info', ACEPTADO: 'info', EN_PREPARACION: 'warn', DESPACHADO: 'warn',
             ENTREGADO: 'ok', CANCELADO: 'danger' }[estado] || 'neutral';
  }
  puedeCrear() { return this.auth.hasRole('CLIENTE') || this.auth.hasRole('OPERADOR'); }
  puedeCambiar() { return this.auth.hasRole('OPERADOR') || this.auth.hasRole('ADMIN'); }
  private msg(e: any) { return e?.error?.message || e?.message || 'Ocurrió un error'; }
}
