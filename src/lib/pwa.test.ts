import { describe, expect, it, beforeEach } from "vitest";

describe("pwa helpers", async () => {
  const { PWA_START_URL, isIOS, isStandalone, isWithinAppScope } = await import("./pwa");

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("defines a unique start url for ios identity", () => {
    expect(PWA_START_URL).toBe("/?pwa=soundwave");
  });

  it("detects ios user agents", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      configurable: true,
    });

    expect(isIOS()).toBe(true);
  });

  it("detects standalone display mode", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    expect(isStandalone()).toBe(true);
  });

  it("allows navigation at the app root", () => {
    expect(isWithinAppScope("/")).toBe(true);
    expect(isWithinAppScope("/outro-app")).toBe(false);
  });
});
