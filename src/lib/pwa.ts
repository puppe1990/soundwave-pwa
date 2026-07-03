import { APP_BASE, APP_BASE_PATH, withBasePath } from "./app-config";

export const PWA_ID = "soundwave-pwa";
export const PWA_START_PARAM = "pwa=soundwave";
export const PWA_START_URL = `${withBasePath()}?${PWA_START_PARAM}`;
export const PWA_SCOPE = withBasePath();

const normalizePath = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isStandalone = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
};

export const isSoundwavePwaSession = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("pwa") === "soundwave" || sessionStorage.getItem("soundwave-pwa-active") === "1"
  );
};

export const isWithinAppScope = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  const base = normalizePath(APP_BASE_PATH);

  return normalized === base || normalized.startsWith(`${base}/`);
};

const markSoundwaveSession = (): void => {
  sessionStorage.setItem("soundwave-pwa-active", "1");
};

const cleanPwaQueryParam = (): void => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("pwa")) {
    return;
  }

  url.searchParams.delete("pwa");
  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
};

export const enforcePwaScope = (): void => {
  if (!isStandalone()) {
    return;
  }

  markSoundwaveSession();

  if (!isWithinAppScope(window.location.pathname)) {
    window.location.replace(PWA_START_URL);
    return;
  }

  cleanPwaQueryParam();
};

export const installPwaNavigationGuards = (): void => {
  if (!isStandalone()) {
    return;
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
        return;
      }

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin || !isWithinAppScope(url.pathname)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  const originalOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    if (!url) {
      return originalOpen(url, target, features);
    }

    const nextUrl = new URL(url.toString(), window.location.origin);
    if (nextUrl.origin !== window.location.origin || !isWithinAppScope(nextUrl.pathname)) {
      return null;
    }

    return originalOpen(nextUrl.toString(), target, features);
  }) as typeof window.open;
};

export const initPwaIsolation = (): void => {
  enforcePwaScope();
  installPwaNavigationGuards();
};
