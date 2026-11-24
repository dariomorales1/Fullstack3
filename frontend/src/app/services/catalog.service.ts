import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../core/config';
import { Producto, ProductoInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private base = `${APP_CONFIG.api.catalog}/api/catalog/products`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.base);
  }

  crear(producto: ProductoInput): Observable<Producto> {
    return this.http.post<Producto>(this.base, producto);
  }

  actualizar(id: number, producto: ProductoInput): Observable<Producto> {
    return this.http.put<Producto>(`${this.base}/${id}`, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
