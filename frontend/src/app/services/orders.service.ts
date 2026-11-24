import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../core/config';
import { CrearPedido, Pedido } from '../core/models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = `${APP_CONFIG.api.orders}/api/orders`;

  listar(status?: string): Observable<Pedido[]> {
    const url = status ? `${this.base}?status=${encodeURIComponent(status)}` : this.base;
    return this.http.get<Pedido[]>(url);
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.base}/${id}`);
  }

  crear(pedido: CrearPedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.base, pedido);
  }

  cambiarEstado(id: number, status: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.base}/${id}/status`, { status });
  }
}
