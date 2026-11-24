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
    <div class="animate-in">
      <h1>Catálogo de productos</h1>
      <p class="muted">Gestiona el catálogo y el stock disponible.</p>
      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (puedeEscribir()) {
        <div class="card" style="margin:1rem 0">
          <h3 style="margin-top:0">Nuevo producto</h3>
          <form (ngSubmit)="crear()" class="row">
            <input name="nombre" [(ngModel)]="nuevo.nombre" placeholder="Nombre" required style="flex:2;min-width:160px">
            <input name="precio" type="number" [(ngModel)]="nuevo.precio" placeholder="Precio" required style="width:120px">
            <input name="stock" type="number" [(ngModel)]="nuevo.stock" placeholder="Stock" required style="width:110px">
            <button class="primary" type="submit">+ Crear</button>
          </form>
        </div>
      }

      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            @if (cargando()) {
              <tr><td colspan="5" class="empty"><span class="spinner"></span></td></tr>
            } @else {
              @for (p of productos(); track p.id) {
                <tr>
                  <td>{{ p.id }}</td>
                  <td><b>{{ p.nombre }}</b></td>
                  <td>\${{ p.precio | number }}</td>
                  <td><span class="badge" [class.ok]="p.stock>20" [class.warn]="p.stock<=20 && p.stock>0" [class.danger]="p.stock===0">{{ p.stock }}</span></td>
                  <td style="text-align:right">
                    @if (auth.hasRole('ADMIN')) { <button class="btn-danger btn-sm" (click)="eliminar(p.id)">Eliminar</button> }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">Sin productos</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class Catalog implements OnInit {
  private svc = inject(CatalogService);
  auth = inject(AuthService);
  productos = signal<Producto[]>([]);
  error = signal<string | null>(null);
  cargando = signal(true);
  nuevo: ProductoInput = { nombre: '', precio: 0, stock: 0 };

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (p) => { this.productos.set(p); this.cargando.set(false); },
      error: (e) => { this.error.set(this.msg(e)); this.cargando.set(false); },
    });
  }
  crear() {
    this.svc.crear(this.nuevo).subscribe({
      next: () => { this.nuevo = { nombre: '', precio: 0, stock: 0 }; this.error.set(null); this.cargar(); },
      error: (e) => this.error.set(this.msg(e)),
    });
  }
  eliminar(id: number) {
    this.svc.eliminar(id).subscribe({ next: () => this.cargar(), error: (e) => this.error.set(this.msg(e)) });
  }
  puedeEscribir() { return this.auth.hasRole('ADMIN') || this.auth.hasRole('OPERADOR'); }
  private msg(e: any) { return e?.error?.message || e?.message || 'Ocurrió un error'; }
}
