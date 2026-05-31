import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

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
        assetsDir: "app-assets",
        emptyOutDir: true,
      },
    });
    console.log("Vite client build completed successfully!");

    // Copy compiled assets to root directory for IIS/Plesk native static file serving
    const distAssetsPath = path.join(__dirname, "dist", "app-assets");
    const rootAssetsPath = path.join(__dirname, "app-assets");
    if (fs.existsSync(distAssetsPath)) {
      console.log(`Copying compiled assets to root path: ${rootAssetsPath}...`);
      if (fs.existsSync(rootAssetsPath)) {
        fs.rmSync(rootAssetsPath, { recursive: true, force: true });
      }
      copyDirSync(distAssetsPath, rootAssetsPath);
    }

    const distLegacyAssetsPath = path.join(__dirname, "dist", "assets");
    const rootLegacyAssetsPath = path.join(__dirname, "assets");
    if (fs.existsSync(distLegacyAssetsPath)) {
      console.log(`Copying legacy compiled assets to root path: ${rootLegacyAssetsPath}...`);
      if (fs.existsSync(rootLegacyAssetsPath)) {
        fs.rmSync(rootLegacyAssetsPath, { recursive: true, force: true });
      }
      copyDirSync(distLegacyAssetsPath, rootLegacyAssetsPath);
    }

    console.log("Static assets successfully mirrored to the root directory for IIS compliance!");
  } catch (error) {
    console.error("Vite client build failed:", error);
    process.exit(1);
  }
}

runBuild();
