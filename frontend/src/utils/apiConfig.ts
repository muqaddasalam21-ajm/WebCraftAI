/**
 * Production and Local API Configuration
 * 
 * Supports:
 * - Render Single Web Service (same-origin '/api' routing)
 * - Render Split Frontend/Backend (configured via VITE_API_URL environment variable)
 * - Local Development (Vite proxy forwarding '/api' to local backend on 0.0.0.0:5000)
 * 
 * CRITICAL DEPLOYMENT SAFETY:
 * - Never uses localhost or 127.0.0.1 in production builds.
 * - Always safely reads response text before parsing JSON to prevent "Unexpected end of JSON input".
 */

export function getApiBaseUrl(): string {
  const metaEnv = (import.meta as any)?.env;

  // 1. Environment variable from Vite build / Render environment
  const envUrl = (metaEnv?.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  // 2. Optional runtime window injection (e.g., config.js or Docker container variable)
  if (typeof window !== 'undefined') {
    const winUrl = (window as any).__ENV__?.VITE_API_URL?.trim();
    if (winUrl) {
      const cleaned = winUrl.replace(/\/+$/, '');
      return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
    }
  }

  // 3. Default for same-origin routing (standard for Render co-hosted or reverse proxy setups)
  return '/api';
}

export function buildApiUrl(endpoint: string): string {
  // If already an absolute URL (http/https), return as is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const base = getApiBaseUrl();

  // Normalize endpoint path
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base already includes '/api' and endpoint also starts with '/api', prevent duplication
  if (base.endsWith('/api') && path.startsWith('/api')) {
    path = path.slice(4); // Remove leading '/api'
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
  }

  return `${base}${path === '/' ? '' : path}`;
}

/**
 * Safely executes an HTTP request and parses JSON without crashing on empty or HTML responses.
 */
export async function safeApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const targetUrl = buildApiUrl(endpoint);
  const isDev = Boolean((import.meta as any)?.env?.DEV);
  let response: Response | null = null;
  let text = '';
  let data: any = {};

  try {
    response = await fetch(targetUrl, options);
    text = await response.text();
  } catch (err: any) {
    // ONLY in local development mode (DEV) and NEVER in production:
    // If Vite proxy dropped connection, attempt dev fallback to local port 5000
    if (
      isDev &&
      !targetUrl.startsWith('http://127.0.0.1:5000') &&
      !targetUrl.startsWith('http://localhost:5000')
    ) {
      try {
        const devFallbackUrl = `http://127.0.0.1:5000${targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl}`;
        response = await fetch(devFallbackUrl, options);
        text = await response.text();
      } catch {
        throw new Error('Unable to connect to local WebCraftAI backend server. Please verify it is running on port 5000.');
      }
    } else {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
  }

  // Detect HTML response (e.g. Vite SPA history fallback when proxy misses or fails)
  const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<html');

  // If in local dev and Vite returned HTML for an API endpoint, Vite proxy missed: fallback to backend on 127.0.0.1:5000
  if (
    isHtml &&
    isDev &&
    !targetUrl.startsWith('http://127.0.0.1:5000') &&
    !targetUrl.startsWith('http://localhost:5000')
  ) {
    try {
      const devFallbackUrl = `http://127.0.0.1:5000${targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl}`;
      const devRes = await fetch(devFallbackUrl, options);
      const devText = await devRes.text();
      if (devText && !devText.trim().startsWith('<!')) {
        response = devRes;
        text = devText;
      }
    } catch {
      // Keep existing response
    }
  }

  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. HTML error page or plain text)
      data = { error: text.length < 200 ? text : `Server returned non-JSON response (status ${response?.status})` };
    }
  }

  if (!response || !response.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (response?.status === 404
        ? 'Endpoint not found (404).'
        : response?.status === 500
        ? 'Internal server error (500).'
        : `Request failed with status ${response?.status}`);
    throw new Error(errorMsg);
  }

  // If status is 200 but parsing produced an error object (e.g. unexpected HTML)
  if (data?.error && (!data.user && !data.token && !data.message && !data.status && !data.id && !Array.isArray(data))) {
    throw new Error(data.error);
  }

  return data as T;
}
