# Offline-First App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After one online visit with the service worker installed, the SoundWave app shell loads and saved tracks play fully offline.

**Architecture:** Extract pure offline-shell Workbox settings into a testable module, wire them into `vite-plugin-pwa`, register the SW explicitly at boot via `virtual:pwa-register`, and verify build + unit tests. IndexedDB audio path stays as-is (already offline).

**Tech Stack:** Vite 5, vite-plugin-pwa 0.20, Workbox 7, React 18, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-08-02-offline-first-shell-design.md`

---

## File map

| File                            | Responsibility                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/offline-shell.ts`      | Pure offline shell config (precache globs, clientsClaim, navigateFallback allowlist builder) + silent SW registration entry |
| `src/lib/offline-shell.test.ts` | Unit tests for offline shell config                                                                                         |
| `vite.config.ts`                | Consume offline shell config in `VitePWA` / `workbox` options                                                               |
| `src/main.tsx`                  | Call `registerOfflineServiceWorker()` at boot                                                                               |
| `src/vite-env.d.ts`             | Reference `vite-plugin-pwa/client` for `virtual:pwa-register` types                                                         |

**Unchanged (by design):** `src/lib/indexedDB.ts`, `src/hooks/useLocalStorage.ts`, player hooks, offline UX UI.

---

### Task 1: Offline shell config (TDD)

**Files:**

- Create: `src/lib/offline-shell.ts`
- Create: `src/lib/offline-shell.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/offline-shell.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  OFFLINE_PRECACHE_GLOB_PATTERNS,
  OFFLINE_WORKBOX_CLIENTS_CLAIM,
  OFFLINE_WORKBOX_SKIP_WAITING,
  OFFLINE_NAVIGATE_FALLBACK,
  getNavigateFallbackAllowlist,
} from "./offline-shell";

describe("offline shell config", () => {
  it("precaches shell and common static asset types including images and fonts", () => {
    const patterns = OFFLINE_PRECACHE_GLOB_PATTERNS.join(",");

    expect(patterns).toMatch(/js/);
    expect(patterns).toMatch(/css/);
    expect(patterns).toMatch(/html/);
    expect(patterns).toMatch(/png/);
    expect(patterns).toMatch(/svg/);
    expect(patterns).toMatch(/jpg|jpeg/);
    expect(patterns).toMatch(/webp/);
    expect(patterns).toMatch(/woff2?/);
    expect(patterns).toMatch(/ico/);
  });

  it("claims clients and skips waiting so the SW controls pages promptly", () => {
    expect(OFFLINE_WORKBOX_CLIENTS_CLAIM).toBe(true);
    expect(OFFLINE_WORKBOX_SKIP_WAITING).toBe(true);
  });

  it("uses index.html as the SPA navigate fallback", () => {
    expect(OFFLINE_NAVIGATE_FALLBACK).toBe("index.html");
  });

  it("allows SPA navigations under root base while denylist covers /api", () => {
    const allowlist = getNavigateFallbackAllowlist("/");

    expect(allowlist.length).toBeGreaterThan(0);
    expect(allowlist.some((re) => re.test("/"))).toBe(true);
    expect(allowlist.some((re) => re.test("/playlist"))).toBe(true);
  });

  it("allows SPA navigations under a non-root base path", () => {
    const allowlist = getNavigateFallbackAllowlist("/soundwave/");

    expect(allowlist.some((re) => re.test("/soundwave"))).toBe(true);
    expect(allowlist.some((re) => re.test("/soundwave/"))).toBe(true);
    expect(allowlist.some((re) => re.test("/soundwave/other"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test:run -- src/lib/offline-shell.test.ts
```

Expected: FAIL (module `./offline-shell` not found or exports missing).

- [ ] **Step 3: Implement minimal config module**

Create `src/lib/offline-shell.ts`:

```ts
/**
 * Offline app-shell settings for Workbox / vite-plugin-pwa.
 * Pure values so unit tests can lock offline-first shell behavior.
 */

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
  // Implementation filled in Task 2 (virtual:pwa-register).
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm run test:run -- src/lib/offline-shell.test.ts
```

Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/offline-shell.ts src/lib/offline-shell.test.ts
git commit -m "feat(pwa): add testable offline shell Workbox config"
```

---

### Task 2: Explicit SW registration + types

**Files:**

- Modify: `src/lib/offline-shell.ts`
- Modify: `src/lib/offline-shell.test.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Add PWA client types**

Update `src/vite-env.d.ts` to:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

- [ ] **Step 2: Write a registration test with mocked `virtual:pwa-register`**

Append to `src/lib/offline-shell.test.ts` (keep existing imports/tests):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

// Note: merge with existing import from "vitest" at top of file — do not duplicate describe/expect/it.

vi.mock("virtual:pwa-register", () => ({
  registerSW: vi.fn(() => vi.fn()),
}));

describe("registerOfflineServiceWorker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("registers the service worker with immediate: true", async () => {
    const { registerSW } = await import("virtual:pwa-register");
    const { registerOfflineServiceWorker } = await import("./offline-shell");

    registerOfflineServiceWorker();

    expect(registerSW).toHaveBeenCalledWith({ immediate: true });
  });
});
```

If Vitest hoisting conflicts with static imports of `offline-shell` at the top of the file, restructure the test file so:

1. `vi.mock("virtual:pwa-register", ...)` is declared before dynamic imports of `./offline-shell` inside the registration describe block.
2. Config tests keep their static import of config exports only, **or** load config via dynamic import after mock.

Preferred clean structure for the whole test file:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("virtual:pwa-register", () => ({
  registerSW: vi.fn(() => vi.fn()),
}));

describe("offline shell config", () => {
  it("precaches shell and common static asset types including images and fonts", async () => {
    const { OFFLINE_PRECACHE_GLOB_PATTERNS } = await import("./offline-shell");
    const patterns = OFFLINE_PRECACHE_GLOB_PATTERNS.join(",");

    expect(patterns).toMatch(/js/);
    expect(patterns).toMatch(/css/);
    expect(patterns).toMatch(/html/);
    expect(patterns).toMatch(/png/);
    expect(patterns).toMatch(/svg/);
    expect(patterns).toMatch(/jpg|jpeg/);
    expect(patterns).toMatch(/webp/);
    expect(patterns).toMatch(/woff2?/);
    expect(patterns).toMatch(/ico/);
  });

  it("claims clients and skips waiting so the SW controls pages promptly", async () => {
    const { OFFLINE_WORKBOX_CLIENTS_CLAIM, OFFLINE_WORKBOX_SKIP_WAITING } =
      await import("./offline-shell");

    expect(OFFLINE_WORKBOX_CLIENTS_CLAIM).toBe(true);
    expect(OFFLINE_WORKBOX_SKIP_WAITING).toBe(true);
  });

  it("uses index.html as the SPA navigate fallback", async () => {
    const { OFFLINE_NAVIGATE_FALLBACK } = await import("./offline-shell");
    expect(OFFLINE_NAVIGATE_FALLBACK).toBe("index.html");
  });

  it("allows SPA navigations under root base while denylist covers /api", async () => {
    const { getNavigateFallbackAllowlist } = await import("./offline-shell");
    const allowlist = getNavigateFallbackAllowlist("/");

    expect(allowlist.length).toBeGreaterThan(0);
    expect(allowlist.some((re) => re.test("/"))).toBe(true);
    expect(allowlist.some((re) => re.test("/playlist"))).toBe(true);
  });

  it("allows SPA navigations under a non-root base path", async () => {
    const { getNavigateFallbackAllowlist } = await import("./offline-shell");
    const allowlist = getNavigateFallbackAllowlist("/soundwave/");

    expect(allowlist.some((re) => re.test("/soundwave"))).toBe(true);
    expect(allowlist.some((re) => re.test("/soundwave/"))).toBe(true);
    expect(allowlist.some((re) => re.test("/soundwave/other"))).toBe(true);
  });
});

describe("registerOfflineServiceWorker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("registers the service worker with immediate: true", async () => {
    const { registerSW } = await import("virtual:pwa-register");
    const { registerOfflineServiceWorker } = await import("./offline-shell");

    registerOfflineServiceWorker();

    expect(registerSW).toHaveBeenCalledWith({ immediate: true });
  });
});
```

- [ ] **Step 3: Run registration test — expect FAIL**

Run:

```bash
npm run test:run -- src/lib/offline-shell.test.ts
```

Expected: FAIL because `registerOfflineServiceWorker` is still a no-op (does not call `registerSW`).

- [ ] **Step 4: Implement registration**

Update `src/lib/offline-shell.ts` — replace the empty `registerOfflineServiceWorker` with:

```ts
import { registerSW } from "virtual:pwa-register";

export const registerOfflineServiceWorker = (): void => {
  try {
    registerSW({ immediate: true });
  } catch (error) {
    console.warn("⚠️ PWA: service worker registration skipped", error);
  }
};
```

Keep all config exports above this import block, or place the import at top of file (standard). Full file should look like:

```ts
import { registerSW } from "virtual:pwa-register";

/**
 * Offline app-shell settings for Workbox / vite-plugin-pwa.
 * Pure values so unit tests can lock offline-first shell behavior.
 */

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
    return [/^\/.*/];
  }

  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [new RegExp(`^${escaped}(?:/.*)?$`)];
};

/**
 * Silent service worker registration (autoUpdate, no UI).
 * Safe no-op when registration throws (e.g. unsupported environment).
 */
export const registerOfflineServiceWorker = (): void => {
  try {
    registerSW({ immediate: true });
  } catch (error) {
    console.warn("⚠️ PWA: service worker registration skipped", error);
  }
};
```

- [ ] **Step 5: Wire registration in `main.tsx`**

Replace `src/main.tsx` with:

```tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initPwaIsolation } from "./lib/pwa";
import { registerOfflineServiceWorker } from "./lib/offline-shell";
import "./index.css";

initPwaIsolation();
registerOfflineServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test:run -- src/lib/offline-shell.test.ts src/lib/pwa.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/offline-shell.ts src/lib/offline-shell.test.ts src/vite-env.d.ts src/main.tsx
git commit -m "feat(pwa): register service worker explicitly at boot"
```

---

### Task 3: Wire Workbox options in Vite config

**Files:**

- Modify: `vite.config.ts`

- [ ] **Step 1: Import offline shell config into Vite config**

At top of `vite.config.ts`, after existing imports, add:

```ts
import {
  OFFLINE_NAVIGATE_FALLBACK,
  OFFLINE_PRECACHE_GLOB_PATTERNS,
  OFFLINE_WORKBOX_CLIENTS_CLAIM,
  OFFLINE_WORKBOX_SKIP_WAITING,
  getNavigateFallbackAllowlist,
} from "./src/lib/offline-shell";
```

**Note:** `offline-shell.ts` imports `virtual:pwa-register`. Node-side Vite config evaluation may try to resolve that import when loading the module. If Vite fails to load config because of `virtual:pwa-register`, split the file:

1. Move pure config to `src/lib/offline-shell-config.ts` (no virtual import).
2. Keep `registerOfflineServiceWorker` in `src/lib/offline-shell.ts` re-exporting config + registration.
3. Import config-only module from `vite.config.ts`.

**Preferred structure if split is required (do this if Step 2 fails):**

`src/lib/offline-shell-config.ts` — pure constants + `getNavigateFallbackAllowlist` only.

`src/lib/offline-shell.ts`:

```ts
export {
  OFFLINE_PRECACHE_GLOB_PATTERNS,
  OFFLINE_WORKBOX_CLIENTS_CLAIM,
  OFFLINE_WORKBOX_SKIP_WAITING,
  OFFLINE_NAVIGATE_FALLBACK,
  getNavigateFallbackAllowlist,
} from "./offline-shell-config";

import { registerSW } from "virtual:pwa-register";

export const registerOfflineServiceWorker = (): void => {
  try {
    registerSW({ immediate: true });
  } catch (error) {
    console.warn("⚠️ PWA: service worker registration skipped", error);
  }
};
```

`vite.config.ts` imports from `./src/lib/offline-shell-config` only.

Update tests to import config from either `./offline-shell` (re-export) or `./offline-shell-config` — keep public API via `./offline-shell` for app code.

- [ ] **Step 2: Apply Workbox settings and avoid double registration**

In the `VitePWA({...})` block, set:

```ts
VitePWA({
  registerType: "autoUpdate",
  injectRegister: false, // app registers via registerOfflineServiceWorker()
  filename: "soundwave-sw.js",
  includeAssets: [
    "favicon.svg",
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "icon-source.svg",
    "apple-touch-icon.png",
    "apple-touch-icon-152x152.png",
    "apple-touch-icon-167x167.png",
  ],
  manifest: {
    // ... keep existing manifest unchanged ...
  },
  workbox: {
    globPatterns: [...OFFLINE_PRECACHE_GLOB_PATTERNS],
    clientsClaim: OFFLINE_WORKBOX_CLIENTS_CLAIM,
    skipWaiting: OFFLINE_WORKBOX_SKIP_WAITING,
    navigateFallback: OFFLINE_NAVIGATE_FALLBACK,
    navigateFallbackAllowlist: getNavigateFallbackAllowlist(APP_BASE),
    navigateFallbackDenylist: [/^\/api\//],
  },
  devOptions: {
    enabled: true,
    type: "module",
  },
}),
```

Do not change manifest icons, theme colors, or `filename` beyond the above.

- [ ] **Step 3: Verify config loads**

Run:

```bash
npx vite --version && node -e "import('vite').then(() => console.log('ok'))"
npm run build
```

Expected: build succeeds. Output under `dist/` includes `soundwave-sw.js` (or hashed SW assets) and a precache manifest.

If build fails on importing `virtual:pwa-register` from config path, apply the split described in Step 1, then rebuild.

- [ ] **Step 4: Assert precache coverage in build output**

Run:

```bash
npm run build
# Inspect SW / workbox precache for shell assets
rg -n "index.html|workbox|precache" dist -g '*.js' | head -40
```

Expected:

- `dist/index.html` exists
- Service worker file present (`dist/soundwave-sw.js` or plugin-generated SW name)
- Precache entries include JS/CSS chunks (and png/svg icons)

- [ ] **Step 5: Run full unit suite**

Run:

```bash
npm run test:run
```

Expected: all existing tests still pass (including `src/lib/pwa.test.ts` and new offline-shell tests).

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts src/lib/offline-shell.ts src/lib/offline-shell-config.ts src/lib/offline-shell.test.ts
git commit -m "feat(pwa): wire offline-first Workbox precache and SPA fallback"
```

(Only add `offline-shell-config.ts` if the split was needed.)

---

### Task 4: Verification + docs checklist

**Files:**

- No production code unless a gap is found

- [ ] **Step 1: Automated verification**

Run:

```bash
npm run test:run
npm run build
```

Expected:

- Tests: all green
- Build: success, SW generated

- [ ] **Step 2: Manual offline checklist (document results in commit message or leave as operator notes)**

```text
1. npm run build && npm run preview
2. Open preview URL online
3. Upload one audio file, play it
4. DevTools → Application → Service Workers: confirm soundwave SW is activated / controlling
5. DevTools → Network → Offline
6. Hard reload
7. Expect: shell loads (no blank error page for app assets)
8. Expect: saved track still appears and plays
```

- [ ] **Step 3: Confirm missing-blob degradation (code path already present)**

No code change required if `useLocalStorage.convertToTrack` still returns `src: ""` when blob is missing and the player does not crash. Spot-check by reading:

- `src/hooks/useLocalStorage.ts` — `convertToTrack` branches for missing `audioFileId` / null blob
- Player does not throw when `src` is empty

If a throw is found, fix with a minimal guard only (do not rewrite storage).

- [ ] **Step 4: Final commit only if Step 3 required a fix**

```bash
git add <touched-files>
git commit -m "fix(player): tolerate missing offline audio blob without crashing shell"
```

If no fix needed, skip this commit.

---

## Spec coverage checklist

| Spec requirement                                       | Task                      |
| ------------------------------------------------------ | ------------------------- |
| Expand `globPatterns` (js/css/html/icons/images/fonts) | Task 1 + 3                |
| `navigateFallback: index.html` with broader allowlist  | Task 1 + 3                |
| `clientsClaim: true`, keep `skipWaiting`               | Task 1 + 3                |
| Explicit SW registration at boot                       | Task 2                    |
| No offline status UI / update toast                    | All tasks (not added)     |
| IndexedDB path unchanged                               | All tasks (not rewritten) |
| Unit tests + build verification                        | Tasks 1–4                 |
| Manual offline checklist                               | Task 4                    |

---

## Self-review notes (plan author)

- No TBD/TODO placeholders.
- Public registration API: `registerOfflineServiceWorker()`; Workbox knobs exported as named constants.
- Vite config import of `virtual:pwa-register` is explicitly handled via optional split to `offline-shell-config.ts`.
- Out of scope items from the spec are not scheduled.
