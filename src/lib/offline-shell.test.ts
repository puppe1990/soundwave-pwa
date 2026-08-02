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
