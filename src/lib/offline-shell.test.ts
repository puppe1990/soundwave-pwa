import { describe, expect, it, vi } from "vitest";

// virtual:pwa-register only resolves under Vite; mock so the module can load in Vitest.
vi.mock("virtual:pwa-register", () => ({
  registerSW: vi.fn(),
}));

import {
  OFFLINE_NAVIGATE_FALLBACK,
  OFFLINE_NAVIGATE_FALLBACK_DENYLIST,
  OFFLINE_PRECACHE_GLOB_PATTERNS,
  OFFLINE_WORKBOX_CLIENTS_CLAIM,
  OFFLINE_WORKBOX_SKIP_WAITING,
  getNavigateFallbackAllowlist,
  normalizeViteAppBase,
  registerOfflineServiceWorker,
} from "./offline-shell";

describe("offline shell config", () => {
  it("locks the exact precache glob for shell assets", () => {
    expect([...OFFLINE_PRECACHE_GLOB_PATTERNS]).toEqual([
      "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}",
    ]);
  });

  it("claims clients and skips waiting so the SW controls pages promptly", () => {
    expect(OFFLINE_WORKBOX_CLIENTS_CLAIM).toBe(true);
    expect(OFFLINE_WORKBOX_SKIP_WAITING).toBe(true);
  });

  it("uses index.html as the SPA navigate fallback", () => {
    expect(OFFLINE_NAVIGATE_FALLBACK).toBe("index.html");
  });

  it("denies API navigations from SPA fallback", () => {
    expect(OFFLINE_NAVIGATE_FALLBACK_DENYLIST.some((re) => re.test("/api/"))).toBe(true);
    expect(OFFLINE_NAVIGATE_FALLBACK_DENYLIST.some((re) => re.test("/api/tracks"))).toBe(true);
    expect(OFFLINE_NAVIGATE_FALLBACK_DENYLIST.some((re) => re.test("/playlist"))).toBe(false);
  });

  it("normalizes vite base paths for allowlist building", () => {
    expect(normalizeViteAppBase("/")).toBe("");
    expect(normalizeViteAppBase("")).toBe("");
    expect(normalizeViteAppBase("/soundwave/")).toBe("/soundwave");
    expect(normalizeViteAppBase("/soundwave")).toBe("/soundwave");
  });

  it("allows SPA navigations under root base", () => {
    const allowlist = getNavigateFallbackAllowlist("/");

    expect(allowlist.some((re) => re.test("/"))).toBe(true);
    expect(allowlist.some((re) => re.test("/playlist"))).toBe(true);
  });

  it("allows SPA navigations under a non-root base path and rejects prefix traps", () => {
    const allowlist = getNavigateFallbackAllowlist("/soundwave/");

    expect(allowlist.some((re) => re.test("/soundwave"))).toBe(true);
    expect(allowlist.some((re) => re.test("/soundwave/"))).toBe(true);
    expect(allowlist.some((re) => re.test("/soundwave/other"))).toBe(true);
    expect(allowlist.some((re) => re.test("/other"))).toBe(false);
    expect(allowlist.some((re) => re.test("/soundwave-other"))).toBe(false);
  });
});

describe("registerOfflineServiceWorker", () => {
  it("registers the service worker with immediate: true and onRegisterError", () => {
    const register = vi.fn();

    registerOfflineServiceWorker(register);

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        immediate: true,
        onRegisterError: expect.any(Function),
      }),
    );
  });

  it("logs and continues when registration throws synchronously", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const register = vi.fn(() => {
      throw new Error("registration blocked");
    });

    expect(() => registerOfflineServiceWorker(register)).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      "⚠️ PWA: service worker registration skipped",
      expect.objectContaining({ error: expect.any(Error) }),
    );

    warn.mockRestore();
  });

  it("forwards async registration failures to onRegisterError", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const register = vi.fn(({ onRegisterError }) => {
      onRegisterError?.(new Error("network failed"));
    });

    registerOfflineServiceWorker(register);

    expect(warn).toHaveBeenCalledWith(
      "⚠️ PWA: service worker registration failed",
      expect.objectContaining({ error: expect.any(Error) }),
    );

    warn.mockRestore();
  });
});
