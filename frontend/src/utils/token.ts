/**
 * Universal Auth Token Reader
 * Checks all storage keys used across frontend phases for 100% compatibility:
 * 1. 'webcraft_auth_token' (direct string from authService)
 * 2. 'webcraft_auth' (JSON object with { token, user } or direct string)
 * 3. 'token' (fallback)
 */

export function getAuthToken(): string | null {
  try {
    // 1. Direct token string from authService
    const directToken = localStorage.getItem('webcraft_auth_token');
    if (directToken && directToken.trim()) {
      return directToken.trim();
    }

    // 2. Direct simple token key
    const simpleToken = localStorage.getItem('token');
    if (simpleToken && simpleToken.trim()) {
      return simpleToken.trim();
    }

    // 3. JSON wrapper object 'webcraft_auth'
    const stored = localStorage.getItem('webcraft_auth');
    if (stored && stored.trim()) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.token) {
          return parsed.token;
        }
        if (typeof parsed === 'string') {
          return parsed;
        }
      } catch {
        return stored.trim();
      }
    }

    return null;
  } catch {
    return null;
  }
}
