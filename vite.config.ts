import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    outDir: "single-html",
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
