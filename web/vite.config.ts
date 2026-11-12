import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Share the repo-root .env with docker compose.
  envDir: "..",
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.VITE_PROXY_TARGET ?? "http://localhost:8000",
      "/uploads": process.env.VITE_PROXY_TARGET ?? "http://localhost:8000",
    },
  },
});
