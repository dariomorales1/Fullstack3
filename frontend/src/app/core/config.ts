export type AuthMode = 'local' | 'msal';

/**
 * Configuracion de la app.
 * - authMode 'local': login de desarrollo (token del BFF), sin Azure.
 * - authMode 'msal': login real con Azure AD (completar msal.* en Fase 7).
 */
export const APP_CONFIG = {
  authMode: 'local' as AuthMode,

  api: {
    bff: 'http://localhost:8085',
    orders: 'http://localhost:8081',
    catalog: 'http://localhost:8082',
    report: 'http://localhost:8084',
    audit: 'http://localhost:8086',
  },

  // Placeholders para Azure AD (Entra External ID) — se completan en la Fase 7.
  msal: {
    clientId: 'TODO-AZURE-CLIENT-ID',
    authority: 'https://login.microsoftonline.com/TODO-TENANT-ID',
    redirectUri: 'http://localhost:4200',
    scopes: ['api://TODO-API-CLIENT-ID/.default'],
  },
};
