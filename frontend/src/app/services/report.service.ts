import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../core/config';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  kpis(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${APP_CONFIG.api.report}/api/report/kpis`);
  }
}
