/**
 * AstroSutra Admin Dashboard — API client utility.
 * Handles making authenticated requests with the Firebase ID token.
 */

// Backend endpoint is routed via Vite proxy to port 8001
const API_BASE_URL = '/api/admin';

export async function fetchAdminApi(endpoint: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Accept', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid or expired credentials');
    }
    if (response.status === 403) {
      throw new Error('Access Denied: Admin role required');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}
