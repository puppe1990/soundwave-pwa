/**
 * Offline app-shell: config re-exports + service worker registration.
 * Config lives in offline-shell-config.ts so vite.config can import it
 * without pulling in virtual:pwa-register.
 */

export {
  OFFLINE_PRECACHE_GLOB_PATTERNS,
  OFFLINE_WORKBOX_CLIENTS_CLAIM,
  OFFLINE_WORKBOX_SKIP_WAITING,
  OFFLINE_NAVIGATE_FALLBACK,
  getNavigateFallbackAllowlist,
} from "./offline-shell-config";

import { registerSW } from "virtual:pwa-register";

/**
 * Silent service worker registration (autoUpdate, no UI).
 * Safe no-op when registration is unavailable (e.g. non-secure context).
 */
export const registerOfflineServiceWorker = (): void => {
  try {
    registerSW({
      immediate: true,
      onRegisterError: (error) => {
        console.warn("⚠️ PWA: service worker registration failed", error);
      },
    });
  } catch (error) {
    console.warn("⚠️ PWA: service worker registration skipped", error);
  }
};
