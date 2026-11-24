import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../core/config';
import { AuditoriaEvento } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);

  eventos(filtros: { clienteId?: string; eventType?: string } = {}): Observable<AuditoriaEvento[]> {
    const params = new URLSearchParams();
    if (filtros.clienteId) params.set('clienteId', filtros.clienteId);
    if (filtros.eventType) params.set('eventType', filtros.eventType);
    const query = params.toString();
    const url = `${APP_CONFIG.api.audit}/api/audit/events${query ? '?' + query : ''}`;
    return this.http.get<AuditoriaEvento[]>(url);
  }
}
