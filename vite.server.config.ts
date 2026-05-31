import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    ssr: "server.ts",
    outDir: "dist",
    emptyOutDir: false, // Keep the web files built by the frontend build
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: "server.cjs",
        format: "cjs",
      },
    },
  },
});
