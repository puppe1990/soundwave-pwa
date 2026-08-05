/**
 * Browser-side offline shell: re-exports config + silent SW registration.
 *
 * WHY re-export: app code imports one module (`offline-shell`); Vite imports
 * only `offline-shell-config` to avoid virtual:pwa-register in Node.
 */

export {
  OFFLINE_PRECACHE_GLOB_PATTERNS,
  OFFLINE_WORKBOX_CLIENTS_CLAIM,
  OFFLINE_WORKBOX_SKIP_WAITING,
  OFFLINE_NAVIGATE_FALLBACK,
  OFFLINE_NAVIGATE_FALLBACK_DENYLIST,
  getNavigateFallbackAllowlist,
  normalizeViteAppBase,
} from "./offline-shell-config";

import { registerSW as defaultRegisterSW } from "virtual:pwa-register";

type RegisterSW = typeof defaultRegisterSW;

/**
 * Silent service worker registration (autoUpdate, no update UI).
 * Inject `register` in tests; production uses virtual:pwa-register.
 *
 * @example
 * // main.tsx
 * registerOfflineServiceWorker();
 */
export const registerOfflineServiceWorker = (register: RegisterSW = defaultRegisterSW): void => {
  try {
    register({
      immediate: true,
      onRegisterError: (error) => {
        console.warn("⚠️ PWA: service worker registration failed", { error });
      },
    });
  } catch (error) {
    console.warn("⚠️ PWA: service worker registration skipped", { error });
  }
};
