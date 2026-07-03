import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const APP_BASE = "/";
const PWA_START_URL = "/?pwa=soundwave";
const icon = (size: string) => `/icons/icon-${size}.png`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: APP_BASE,
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Service-Worker-Allowed": "/",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
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
        id: PWA_START_URL,
        name: "SoundWave PWA",
        short_name: "SoundWave",
        description:
          "Progressive Web App audio player with playlist management and mobile optimization",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        scope: APP_BASE,
        start_url: PWA_START_URL,
        icons: [
          {
            src: icon("72x72"),
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("96x96"),
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("128x128"),
            sizes: "128x128",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("144x144"),
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("152x152"),
            sizes: "152x152",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("180x180"),
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("192x192"),
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("384x384"),
            sizes: "384x384",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("512x512"),
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: icon("1024x1024"),
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any",
          },
        ],
        categories: ["music", "entertainment"],
        lang: "en",
        dir: "ltr",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        clientsClaim: false,
        skipWaiting: true,
        navigateFallback: "index.html",
        navigateFallbackAllowlist: [/^\/$/],
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    env: {
      BASE_URL: APP_BASE,
    },
  },
}));
