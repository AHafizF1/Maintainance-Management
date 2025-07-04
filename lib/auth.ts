const TOKEN_KEY = "jwt_token";

/**
 * Saves the JWT to localStorage.
 * This should only be called on the client-side.
 * @param token The JWT string to save.
 */
export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Retrieves the JWT from localStorage.
 * This should only be called on the client-side.
 * @returns The JWT string or null if not found.
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Removes the JWT from localStorage.
 * This should only be called on the client-side.
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * A fetch wrapper that automatically adds the Authorization header.
 * @param url The URL to fetch.
 * @param options The options for the fetch request.
 * @returns The fetch promise.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const newOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, newOptions);
}
