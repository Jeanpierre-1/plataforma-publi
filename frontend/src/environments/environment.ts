// Public configuration. Serve /api/v1 through the production reverse proxy.
export const environment = {
  production: true,
  apiBaseUrl: '/api/v1',
} as const;
