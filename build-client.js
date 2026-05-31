import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBuild() {
  console.log("Starting programmatic Vite client build with Tailwind v3...");
  try {
    await build({
      configFile: false, // MUST BE FALSE: disables Vite's automatic config loading and compiling via esbuild
      root: __dirname,
      plugins: [react()],
      css: {
        postcss: {
          plugins: [
            tailwindcss({
              content: [
                path.resolve(__dirname, "index.html"),
                path.resolve(__dirname, "src/**/*.{js,ts,jsx,tsx}"),
              ],
              theme: {
                extend: {
                  fontFamily: {
                    sans: ["Sarabun", "Prompt", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
                    mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
                  },
                },
              },
            }),
            autoprefixer(),
          ],
        },
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
      build: {
        outDir: "dist",
        emptyOutDir: true,
      },
    });
    console.log("Vite client build completed successfully!");
  } catch (error) {
    console.error("Vite client build failed:", error);
    process.exit(1);
  }
}

runBuild();
