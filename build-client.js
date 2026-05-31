import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBuild() {
  console.log("Starting programmatic Vite client build...");
  try {
    await build({
      configFile: false, // MUST BE FALSE: disables Vite's automatic config loading and compiling via esbuild
      root: __dirname,
      plugins: [react(), tailwindcss()],
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
