import { Injectable, signal, computed } from '@angular/core';
import { PublicClientApplication } from '@azure/msal-browser';
import { APP_CONFIG } from './config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'p360_token';
  private msal?: PublicClientApplication;

  readonly roles = signal<string[]>([]);
  readonly user = signal<string | null>(null);
  readonly authenticated = computed(() => this.user() !== null);

  constructor() {
    const token = localStorage.getItem(this.tokenKey);
    if (token && !this.isExpired(token)) {
      this.applyToken(token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  get mode() {
    return APP_CONFIG.authMode;
  }

  /**
   * Se ejecuta al arrancar la app (APP_INITIALIZER).
   * En modo msal procesa el regreso de la redireccion de Microsoft:
   * recupera la cuenta, obtiene el token y deja la sesion lista antes de enrutar.
   */
  async init(): Promise<void> {
    if (this.mode !== 'msal') return;
    const msal = await this.ensureMsal();
    try {
      const result = await msal.handleRedirectPromise();
      const cuenta = result?.account ?? msal.getActiveAccount() ?? msal.getAllAccounts()[0];
      if (cuenta) {
        msal.setActiveAccount(cuenta);
        const token = await msal.acquireTokenSilent({ scopes: APP_CONFIG.msal.scopes, account: cuenta });
        this.applyToken(token.accessToken);
      }
    } catch (e) {
      console.error('MSAL init', e);
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    if (token && this.isExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role.toUpperCase());
  }

  /** Login de desarrollo (modo local): pide un token al BFF segun el rol. */
  async loginLocal(role: string): Promise<void> {
    const res = await fetch(`${APP_CONFIG.api.bff}/api/auth/dev-token?role=${encodeURIComponent(role)}`);
    if (!res.ok) {
      throw new Error('No se pudo obtener el token de desarrollo (HTTP ' + res.status + ')');
    }
    const data = await res.json();
    this.applyToken(data.token);
  }

  /** Login real con Azure AD (modo msal) usando flujo de redireccion. */
  async loginMsal(): Promise<void> {
    const msal = await this.ensureMsal();
    const cuenta = msal.getActiveAccount() ?? msal.getAllAccounts()[0];

    // Si ya hay sesion de Microsoft, solo pide el token (sin redirigir).
    if (cuenta) {
      msal.setActiveAccount(cuenta);
      const token = await msal.acquireTokenSilent({ scopes: APP_CONFIG.msal.scopes, account: cuenta });
      this.applyToken(token.accessToken);
      return;
    }

    // Sin sesion: redirige la ventana completa a Microsoft (vuelve y lo procesa init()).
    await msal.loginRedirect({ scopes: APP_CONFIG.msal.scopes });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.roles.set([]);
    this.user.set(null);
  }

  private async ensureMsal(): Promise<PublicClientApplication> {
    if (!this.msal) {
      this.msal = new PublicClientApplication({
        auth: {
          clientId: APP_CONFIG.msal.clientId,
          authority: APP_CONFIG.msal.authority,
          redirectUri: APP_CONFIG.msal.redirectUri,
          navigateToLoginRequestUrl: false,
        },
        cache: { cacheLocation: 'localStorage' },
      });
      await this.msal.initialize();
    }
    return this.msal;
  }

  private applyToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    const payload = this.decode(token);
    const roles: string[] = Array.isArray(payload['roles']) ? payload['roles'] : [];
    this.roles.set(roles.map((r) => String(r).toUpperCase()));
    this.user.set(payload['preferred_username'] || payload['name'] || payload['sub'] || 'usuario');
  }

  private decode(token: string): Record<string, any> {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(base64))));
    } catch {
      return {};
    }
  }

  private isExpired(token: string): boolean {
    const exp = this.decode(token)['exp'];
    return typeof exp === 'number' ? Date.now() / 1000 > exp : false;
  }
}
