import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-card">
      <h1>Pedidos360</h1>
      <p class="muted">Plataforma de pedidos y despacho</p>

      @if (mode === 'local') {
        <p>Ingreso de desarrollo — elige un rol:</p>
        <div class="roles">
          <button (click)="entrarLocal('ADMIN')" [disabled]="loading()">Administrador</button>
          <button (click)="entrarLocal('OPERADOR')" [disabled]="loading()">Operador</button>
          <button (click)="entrarLocal('CLIENTE')" [disabled]="loading()">Cliente</button>
        </div>
      } @else {
        <button class="primary" (click)="entrarMsal()" [disabled]="loading()">
          Iniciar sesion con Microsoft
        </button>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    .login-card { max-width: 420px; margin: 10vh auto; padding: 2rem; background: #fff;
      border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.08); text-align: center; }
    .roles { display: flex; gap: .5rem; justify-content: center; margin-top: 1rem; }
    .error { color: #b00020; margin-top: 1rem; }
    .muted { color: #666; }
  `],
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = this.auth.mode;
  loading = signal(false);
  error = signal<string | null>(null);

  async entrarLocal(role: string): Promise<void> {
    await this.ejecutar(() => this.auth.loginLocal(role));
  }

  async entrarMsal(): Promise<void> {
    await this.ejecutar(() => this.auth.loginMsal());
  }

  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await accion();
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudo iniciar sesion');
    } finally {
      this.loading.set(false);
    }
  }
}
