/**
 * URL utility functions for handling base paths and URL construction
 */

/**
 * Normalizes the base URL path from Vite's BASE_URL environment variable.
 * Ensures the path ends with a slash for consistent URL construction.
 * 
 * @returns The normalized base path (e.g., "/" or "/kimino_hint/")
 */
export function normalizeBaseUrlPath(): string {
  const basePath = import.meta.env.BASE_URL || "/";
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

/**
 * Constructs a full URL with the application's base path.
 * Useful for generating QR codes and shareable links.
 * 
 * @param path - The path relative to the base URL (e.g., "qr/join?code=ABC")
 * @returns The full URL including origin and base path
 */
export function buildFullUrl(path: string): string {
  const base = normalizeBaseUrlPath();
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${window.location.origin}${base}${cleanPath}`;
}
