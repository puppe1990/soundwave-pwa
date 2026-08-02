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

  it("allows SPA navigations under root base", async () => {
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

  it("registers the service worker with immediate: true and onRegisterError", async () => {
    const { registerSW } = await import("virtual:pwa-register");
    const { registerOfflineServiceWorker } = await import("./offline-shell");

    registerOfflineServiceWorker();

    expect(registerSW).toHaveBeenCalledWith(
      expect.objectContaining({
        immediate: true,
        onRegisterError: expect.any(Function),
      }),
    );
  });
});
