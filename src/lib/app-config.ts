export const APP_BASE = import.meta.env.BASE_URL;
export const APP_BASE_PATH = APP_BASE.endsWith("/") ? APP_BASE.slice(0, -1) : APP_BASE;

export const withBasePath = (path = ""): string => {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${APP_BASE}${normalized}`;
};
