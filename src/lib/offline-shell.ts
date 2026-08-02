/**
 * Offline app-shell settings for Workbox / vite-plugin-pwa.
 * Pure values so unit tests can lock offline-first shell behavior.
 */

import { registerSW } from "virtual:pwa-register";

export const OFFLINE_PRECACHE_GLOB_PATTERNS = [
  "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}",
] as const;

export const OFFLINE_WORKBOX_CLIENTS_CLAIM = true;
export const OFFLINE_WORKBOX_SKIP_WAITING = true;
export const OFFLINE_NAVIGATE_FALLBACK = "index.html";

/**
 * Build navigateFallbackAllowlist for the Vite `base` path.
 * Ensures SPA deep links resolve to index.html offline.
 */
export const getNavigateFallbackAllowlist = (appBase: string): RegExp[] => {
  const base =
    !appBase || appBase === "/" ? "" : appBase.endsWith("/") ? appBase.slice(0, -1) : appBase;

  if (!base) {
    // Match any path; /api is excluded via navigateFallbackDenylist in vite config.
    return [/^\/.*/];
  }

  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [new RegExp(`^${escaped}(?:/.*)?$`)];
};

/**
 * Silent service worker registration (autoUpdate, no UI).
 * Safe no-op when registration is unavailable (e.g. non-secure context).
 */
export const registerOfflineServiceWorker = (): void => {
  try {
    registerSW({ immediate: true });
  } catch (error) {
    console.warn("⚠️ PWA: service worker registration skipped", error);
  }
};
