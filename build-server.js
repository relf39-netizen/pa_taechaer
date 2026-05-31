import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBuild() {
  console.log("Starting safe programmatic TypeScript server build via tsc...");
  
  try {
    // Ensure dist folder exists
    const distDir = path.join(__dirname, "dist");
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Run the native tsc compiler tool on server.ts to transpile to CommonJS format
    const tscCommand = "npx tsc server.ts " +
      "--module commonjs " +
      "--target es2022 " +
      "--outDir dist " +
      "--allowJs " +
      "--skipLibCheck " +
      "--moduleResolution node " +
      "--esModuleInterop";

    console.log(`Executing: ${tscCommand}`);
    execSync(tscCommand, { stdio: "inherit" });

    // Rename dist/server.js to dist/server.cjs to force Node.js to load it as CommonJS
    const srcJS = path.join(distDir, "server.js");
    const destCJS = path.join(distDir, "server.cjs");

    if (fs.existsSync(srcJS)) {
      // If there's an existing server.cjs, remove it first
      if (fs.existsSync(destCJS)) {
        fs.unlinkSync(destCJS);
      }
      fs.renameSync(srcJS, destCJS);
      console.log("Successfully renamed dist/server.js to dist/server.cjs");
    } else {
      throw new Error(`Expected compiled file not found at ${srcJS}`);
    }

    console.log("TypeScript server build completed successfully!");
  } catch (error) {
    console.error("TypeScript server build failed:", error);
    process.exit(1);
  }
}

runBuild();
