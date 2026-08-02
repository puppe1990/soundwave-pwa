# Offline-first app shell + player

**Date:** 2026-08-02  
**Status:** Approved for planning  
**Approach:** A — Harden Workbox + precache (no extra offline UX)

## Goal

After **one successful online visit with the service worker installed**, the user can:

1. Open the app **without network** and load the full app shell (UI, SPA routes, static assets).
2. See playlists, folders, and tracks already stored in IndexedDB.
3. **Play** those tracks (blob → object URL → `<audio>`).
4. Upload **new** local files without network (unchanged local-only flow).

## Out of scope

- Online/offline status indicator in the UI
- Service worker update prompt / “new version available” toast
- Advanced storage-full recovery flows
- Rewriting the IndexedDB data layer
- Sync or multi-device features

## Current state

| Capability                                   | Status                                                          |
| -------------------------------------------- | --------------------------------------------------------------- |
| Track/folder/audio storage in IndexedDB      | Already implemented (`src/lib/indexedDB.ts`, `useLocalStorage`) |
| Local-only data (no backend API for library) | Already true                                                    |
| VitePWA + Workbox precache                   | Present in `vite.config.ts`                                     |
| Precache completeness                        | Incomplete (e.g. may miss `jpg` and other assets)               |
| Navigation fallback for SPA offline          | Narrow (`navigateFallbackAllowlist: [/^\/$/]`)                  |
| Explicit SW registration in app boot         | Not explicit in `main.tsx` (relies on plugin inject)            |
| `clientsClaim`                               | `false` — SW may delay controlling the page                     |

## Success criteria

1. `npm run build` produces a service worker that precaches critical shell assets.
2. Offline hard reload after first online load: shell renders without network errors for app resources.
3. Saved tracks with `audioFileId` play offline via IndexedDB blobs.
4. Tracks missing blob degrade without breaking the shell (no-op/error on that track only).
5. Existing unit tests pass; PWA-related helpers remain covered.

## Architecture

```
Online (first visit)
  → browser loads app
  → service worker (soundwave-sw.js) installs
  → Workbox precaches HTML/JS/CSS/icons/static assets

Offline (later visits)
  → SW serves app shell from precache
  → app reads tracks/folders/blobs from IndexedDB
  → player uses URL.createObjectURL(blob) for playback
```

### Source of truth by layer

| Layer                  | Source of truth  | Offline after first visit? |
| ---------------------- | ---------------- | -------------------------- |
| App shell (UI)         | Workbox precache | Yes                        |
| Track/folder metadata  | IndexedDB        | Yes                        |
| Audio files            | IndexedDB blobs  | Yes                        |
| Gradient / preferences | localStorage     | Yes                        |

There is **no network dependency** on the happy path for list/play after the library is local.

## Design decisions

### 1. Workbox / `vite.config.ts`

- Expand `globPatterns` so production build assets used by the shell are precached (at minimum include common static extensions used in the project: `js`, `css`, `html`, `ico`, `png`, `svg`, `jpg`, `jpeg`, `webp`, `woff`, `woff2` as applicable).
- Keep `navigateFallback: "index.html"` for SPA offline navigation.
- Broaden `navigateFallbackAllowlist` so the app `base` path and in-app routes resolve offline (root `/` and SPA client routes under the configured base).
- Set `clientsClaim: true` so the SW takes control sooner after activation.
- Keep `skipWaiting: true` and `registerType: "autoUpdate"`.
- Ensure icons and other `includeAssets` remain part of the offline shell.

### 2. Explicit SW registration

- Add explicit registration via `virtual:pwa-register` at app boot (`main.tsx` or a small `src/lib/pwa-register.ts` imported from `main.tsx`).
- Registration is silent (no update UI). Purpose is reliability of install, not user-facing update flow.
- Keep existing PWA isolation helpers (`src/lib/pwa.ts`) unchanged unless path/base wiring requires a shared constant.

### 3. IndexedDB / player

- Do **not** rewrite storage.
- Existing flow (blob in IDB → `createObjectURL` → play) is the offline playback path.
- Only harden if needed: tracks without resolvable audio offline must not crash the player or empty the library; missing audio for one track fails that track only.

### 4. Error / edge behavior

| Situation                             | Behavior                                   |
| ------------------------------------- | ------------------------------------------ |
| Offline before SW ever installed      | Browser cannot load app (expected)         |
| Offline with SW, empty library        | Shell works; empty playlist                |
| Track without blob / broken IDB entry | That track does not play; rest of UI works |
| SW updates in background              | autoUpdate; next navigation uses new shell |

## Implementation units (for planning)

1. **Workbox config** — `vite.config.ts` precache + navigation fallback + `clientsClaim`.
2. **SW registration** — explicit register at boot.
3. **Optional shared constants/tests** — extract testable offline/PWA config values if helpful; extend `src/lib/pwa.test.ts` or small config tests.
4. **Verification** — unit tests + manual offline checklist.

## Verification plan

### Automated

- `npm run test:run`
- `npm run build` (SW and precache list generated; critical assets present)

### Manual

1. `npm run build && npm run preview`
2. Online: open app, upload one track, play
3. DevTools → Network → Offline
4. Hard reload: shell loads; saved track plays
5. Confirm missing-blob edge does not break shell (if easy to simulate)

## Non-goals reminder

This delivery optimizes for **“opens and plays offline after first visit”**, not a full offline-first product layer (status UI, update prompts, sync).
