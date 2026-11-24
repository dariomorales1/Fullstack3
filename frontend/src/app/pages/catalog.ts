import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Producto, ProductoInput } from '../core/models';
import { CatalogService } from '../services/catalog.service';

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, DecimalPipe],
  template: `
    <h1>Catalogo de productos</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }

    <table>
      <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
      <tbody>
        @for (p of productos(); track p.id) {
          <tr>
            <td>{{ p.id }}</td><td>{{ p.nombre }}</td>
            <td>{{ p.precio | number }}</td><td>{{ p.stock }}</td>
            <td>
              @if (auth.hasRole('ADMIN')) {
                <button class="link" (click)="eliminar(p.id)">Eliminar</button>
              }
            </td>
          </tr>
        } @empty {
          <tr><td colspan="5" class="muted">Sin productos</td></tr>
        }
      </tbody>
    </table>

    @if (puedeEscribir()) {
      <h3>Nuevo producto</h3>
      <form (ngSubmit)="crear()" class="row">
        <input name="nombre" [(ngModel)]="nuevo.nombre" placeholder="Nombre" required />
        <input name="precio" type="number" [(ngModel)]="nuevo.precio" placeholder="Precio" required />
        <input name="stock" type="number" [(ngModel)]="nuevo.stock" placeholder="Stock" required />
        <button class="primary" type="submit">Crear</button>
      </form>
    }
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
    th, td { padding: .6rem .8rem; text-align: left; border-bottom: 1px solid #eee; }
    .row { display: flex; gap: .5rem; margin-top: .5rem; flex-wrap: wrap; }
    .error { color: #b00020; } .muted { color: #888; } .link { background: none; color: #b00020; }
  `],
})
export class Catalog implements OnInit {
  private svc = inject(CatalogService);
  auth = inject(AuthService);

  productos = signal<Producto[]>([]);
  error = signal<string | null>(null);
  nuevo: ProductoInput = { nombre: '', precio: 0, stock: 0 };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.svc.listar().subscribe({
      next: (p) => this.productos.set(p),
      error: (e) => this.error.set(this.msg(e)),
    });
  }

  crear(): void {
    this.svc.crear(this.nuevo).subscribe({
      next: () => { this.nuevo = { nombre: '', precio: 0, stock: 0 }; this.error.set(null); this.cargar(); },
      error: (e) => this.error.set(this.msg(e)),
    });
  }

  eliminar(id: number): void {
    this.svc.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(this.msg(e)),
    });
  }

  puedeEscribir(): boolean {
    return this.auth.hasRole('ADMIN') || this.auth.hasRole('OPERADOR');
  }

  private msg(e: any): string {
    return e?.error?.message || e?.message || 'Ocurrio un error';
  }
}
