export type AuthMode = 'local' | 'msal';

/**
 * Configuracion de la app.
 * - authMode 'local': login de desarrollo (token del BFF), sin Azure.
 * - authMode 'msal': login real con Azure AD (completar msal.* en Fase 7).
 */
export const APP_CONFIG = {
  // 'local' = login de desarrollo (token del BFF). 'msal' = login real con Azure AD.
  authMode: 'msal' as AuthMode,

  // Todas las llamadas pasan por el API Manager en la nube (valida el JWT y enruta al backend).
  api: {
    bff: 'http://localhost:8085',
    orders: 'https://apim-pedidos360-duoc.azure-api.net',
    catalog: 'https://apim-pedidos360-duoc.azure-api.net',
    report: 'https://apim-pedidos360-duoc.azure-api.net',
    audit: 'https://apim-pedidos360-duoc.azure-api.net',
  },

  // Azure AD (tenant felipeulloalive) — Fase 7.
  msal: {
    clientId: 'cc157a73-9589-4ae6-b3df-08054f33a643',
    authority: 'https://login.microsoftonline.com/c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f',
    redirectUri: 'http://localhost:4200',
    scopes: ['api://cc157a73-9589-4ae6-b3df-08054f33a643/access_as_user'],
  },
};
