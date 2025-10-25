import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  base: '/erd_generator/', // ✅ required for GitHub Pages
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
        await import("@replit/vite-plugin-dev-banner").then((m) =>
          m.devBanner(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.url.substring(7), "client/src"),
      "@shared": path.resolve(import.meta.url.substring(7), "shared"),
      "@assets": path.resolve(import.meta.url.substring(7), "attached_assets"),
    },
  },
  root: path.resolve(import.meta.url.substring(7), "client"),
  build: {
    outDir: path.resolve(import.meta.url.substring(7), "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(import.meta.url.substring(7), "client/index.html"),
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
