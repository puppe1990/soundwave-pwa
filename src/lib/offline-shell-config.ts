/**
 * Offline app-shell Workbox settings (Node-safe).
 *
 * WHY split from offline-shell.ts: vite.config must not import
 * virtual:pwa-register. Keep pure constants here for Vite + unit tests.
 *
 * @example
 * import { OFFLINE_PRECACHE_GLOB_PATTERNS } from "./offline-shell-config";
 * // vite.config workbox.globPatterns: [...OFFLINE_PRECACHE_GLOB_PATTERNS]
 */

export const OFFLINE_PRECACHE_GLOB_PATTERNS = [
  "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}",
] as const;

export const OFFLINE_WORKBOX_CLIENTS_CLAIM = true;
export const OFFLINE_WORKBOX_SKIP_WAITING = true;
export const OFFLINE_NAVIGATE_FALLBACK = "index.html";

/** Paths that must never fall back to the SPA shell (e.g. future APIs). */
export const OFFLINE_NAVIGATE_FALLBACK_DENYLIST: RegExp[] = [/^\/api\//];

/**
 * Normalize Vite `base` for allowlist building.
 * Root "/" becomes empty so SPA routes match the whole origin path space.
 */
export const normalizeViteAppBase = (appBase: string): string => {
  if (!appBase || appBase === "/") {
    return "";
  }

  return appBase.endsWith("/") ? appBase.slice(0, -1) : appBase;
};

/**
 * Build navigateFallbackAllowlist for the Vite `base` path so SPA deep links
 * resolve to index.html offline. /api is excluded via denylist, not here.
 *
 * @example
 * getNavigateFallbackAllowlist("/") // root SPA paths
 * getNavigateFallbackAllowlist("/soundwave/") // base + nested paths only
 */
export const getNavigateFallbackAllowlist = (appBase: string): RegExp[] => {
  const base = normalizeViteAppBase(appBase);

  if (!base) {
    return [/^\/.*/];
  }

  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [new RegExp(`^${escaped}(?:/.*)?$`)];
};
