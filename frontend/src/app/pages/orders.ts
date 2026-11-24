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
    <h1>Pedidos</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }

    <table>
      <thead><tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
      <tbody>
        @for (p of pedidos(); track p.id) {
          <tr>
            <td>{{ p.id }}</td><td>{{ p.clienteId }}</td>
            <td><span class="badge">{{ p.estado }}</span></td>
            <td>{{ p.total | number }}</td>
            <td>
              @if (puedeCambiar()) {
                <select #sel>
                  @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
                </select>
                <button class="link" (click)="cambiar(p.id, sel.value)">Cambiar</button>
              }
            </td>
          </tr>
        } @empty {
          <tr><td colspan="5" class="muted">Sin pedidos</td></tr>
        }
      </tbody>
    </table>

    @if (puedeCrear()) {
      <h3>Nuevo pedido</h3>
      <form (ngSubmit)="crear()" class="row">
        <input name="cliente" [(ngModel)]="clienteId" placeholder="Cliente" required />
        <input name="prodId" type="number" [(ngModel)]="item.productoId" placeholder="Producto ID" required />
        <input name="prodNom" [(ngModel)]="item.nombreProducto" placeholder="Producto" required />
        <input name="cant" type="number" [(ngModel)]="item.cantidad" placeholder="Cantidad" required />
        <input name="precio" type="number" [(ngModel)]="item.precioUnitario" placeholder="Precio unit." required />
        <button class="primary" type="submit">Crear</button>
      </form>
    }
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
    th, td { padding: .6rem .8rem; text-align: left; border-bottom: 1px solid #eee; }
    .badge { background: #eef; padding: .15rem .5rem; border-radius: 6px; font-size: .85rem; }
    .row { display: flex; gap: .5rem; margin-top: .5rem; flex-wrap: wrap; }
    .error { color: #b00020; } .muted { color: #888; } .link { background: none; color: #0057d9; }
  `],
})
export class Orders implements OnInit {
  private svc = inject(OrdersService);
  auth = inject(AuthService);

  pedidos = signal<Pedido[]>([]);
  error = signal<string | null>(null);
  estados = ['ACEPTADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'];

  clienteId = 'cliente@demo.cl';
  item = { productoId: 1, nombreProducto: 'Pan amasado', cantidad: 1, precioUnitario: 1500 };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.svc.listar().subscribe({
      next: (p) => this.pedidos.set(p),
      error: (e) => this.error.set(this.msg(e)),
    });
  }

  crear(): void {
    this.svc.crear({ clienteId: this.clienteId, items: [{ ...this.item }] }).subscribe({
      next: () => { this.error.set(null); this.cargar(); },
      error: (e) => this.error.set(this.msg(e)),
    });
  }

  cambiar(id: number, estado: string): void {
    this.svc.cambiarEstado(id, estado).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(this.msg(e)),
    });
  }

  puedeCrear(): boolean {
    return this.auth.hasRole('CLIENTE') || this.auth.hasRole('OPERADOR');
  }

  puedeCambiar(): boolean {
    return this.auth.hasRole('OPERADOR') || this.auth.hasRole('ADMIN');
  }

  private msg(e: any): string {
    return e?.error?.message || e?.message || 'Ocurrio un error';
  }
}
