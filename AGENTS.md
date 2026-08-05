# SoundWave PWA — Agent rules

Dense, imperative rules. Source: Clean Code for AI Agents (Akita / Uncle Bob re-ranked).

## Commands (one-shot)

- Install: `npm install`
- Dev: `npm run dev` (http://localhost:8080)
- Test: `npm run test:run`
- Lint: `npm run lint`
- Format: `npm run format`
- Build: `npm run build`
- Preview offline shell: `npm run build && npm run preview`
- Icons: `npm run generate:icons`

## Code style

- Functions: 4–20 lines when practical. Split if longer.
- Files: under 500 lines hard cap; target 200–300. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`, `utils` dumps.
  Prefer names that return few `rg` hits (`registerOfflineServiceWorker`, not `init`).
- Types: explicit TypeScript. No `any` on public APIs.
- No unjustified duplication. Extract shared logic.
- Early returns over nested ifs. Max ~2 control-flow indent levels.
- Errors/logs must include the offending value and expected shape.

## Comments

- Keep intent/provenance. Don't strip WHY on refactor.
- Write WHY, not WHAT. Skip restating the next line.
- Public APIs: short docstring with intent + one usage example.
- Reference issue/PR when a line exists for a non-local reason.

## Domain map (where things live)

| Concern                                 | Path                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| App base / paths                        | `src/lib/app-config.ts`                                                  |
| PWA isolation (iOS/standalone scope)    | `src/lib/pwa.ts`                                                         |
| Offline shell Workbox knobs (Node-safe) | `src/lib/offline-shell-config.ts`                                        |
| SW registration (browser)               | `src/lib/offline-shell.ts`                                               |
| IndexedDB tracks/folders/blobs          | `src/lib/indexedDB.ts`                                                   |
| Library load/save / blob→URL            | `src/hooks/useLocalStorage.ts`                                           |
| Playback + mobile interruption          | `src/hooks/useAudioPlayer.ts`, `src/lib/audio-interruption.ts`           |
| Upload pipeline                         | `src/hooks/useAudioUpload.ts`                                            |
| UI shell                                | `src/components/AudioPlayer.tsx`                                         |
| Vite + PWA plugin                       | `vite.config.ts` (import Workbox knobs only from `offline-shell-config`) |

## Architecture constraints

- **Offline-first shell:** after first online visit, SW precache serves the app; library/audio stay in IndexedDB (no backend).
- **Do not** import `virtual:pwa-register` from modules loaded by `vite.config.ts`. Config → `offline-shell-config.ts`; registration → `offline-shell.ts`.
- SW is registered only via `registerOfflineServiceWorker()` in `main.tsx` (`injectRegister: false`).
- Audio blobs are local object URLs from IndexedDB; missing blob → empty `src`, never crash the shell.
- Keep `src/components/ui/*` as shadcn primitives unless fixing a real bug.

## Tests

- Single command: `npm run test:run`
- Every new behavior gets a test. Bug fixes get a regression test.
- Mock I/O (`virtual:pwa-register`, IndexedDB) with named fakes / `vi.mock`, not one-off unstructured stubs when reuse helps.
- F.I.R.S.T.: fast, independent, repeatable, self-validating, timely.
- Colocate: `foo.ts` ↔ `foo.test.ts` under `src/`.

## Dependencies

- Inject external deps when testability needs it (e.g. `registerSW` parameter for unit tests).
- Centralize path/base/PWA knobs; don't hardcode `/?pwa=soundwave` in multiple new places.

## Formatting

- Prettier + ESLint via lint-staged on commit. Run `npm run format` / `npm run lint`. Don't bikeshed style.

## Logging

- Prefer structured context in console for agents (`console.warn("…", { trackId, error })`).
- Emoji-prefixed logs exist in this codebase; keep consistent when touching a file, don't mass-rewrite.

## Known size debt (split when touching)

- `src/hooks/useAudioPlayer.ts` (~746 lines) — over hard cap; split by interruption vs core playback when changing it.
- `src/components/ui/sidebar.tsx` — shadcn; leave unless required.

## Defensive programming (this product)

- Graceful degradation: missing audio blob → skip play for that track, keep playlist/UI.
- SW registration failure: log and continue (app still works online).
- No network retries/circuit breakers required for library (local-first, no sync API).

## Out of scope unless asked

- Offline status UI, SW update toast, multi-device sync, backend APIs.
