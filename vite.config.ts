import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(() => {
  return {
    plugins: [react()],
    css: {
      postcss: {
        plugins: [
          tailwindcss({
            content: [
              "./index.html",
              "./src/**/*.{js,ts,jsx,tsx}",
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
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
