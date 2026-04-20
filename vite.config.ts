import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from "fs";

// Build for specific browser: 'chrome' or 'firefox'
// Usage: npm run build -- --mode firefox
const targetBrowser = process.env.TARGET_BROWSER || "chrome";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-extension-assets",
      closeBundle() {
        // Copy jsQR.js to dist/lib/
        const libDir = resolve(__dirname, "dist/lib");
        if (!existsSync(libDir)) mkdirSync(libDir, { recursive: true });
        copyFileSync(
          resolve(__dirname, "src/lib/jsQR.js"),
          resolve(libDir, "jsQR.js")
        );

        // Copy browser polyfill to dist/lib/
        copyFileSync(
          resolve(__dirname, "src/lib/browser-polyfill.js"),
          resolve(libDir, "browser-polyfill.js")
        );

        // Move popup HTML to correct location
        const srcHtml = resolve(__dirname, "dist/src/popup/index.html");
        const destDir = resolve(__dirname, "dist/popup");
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
        if (existsSync(srcHtml)) {
          copyFileSync(srcHtml, resolve(destDir, "index.html"));
        }

        // Clean up leftover src/ directory
        const srcDir = resolve(__dirname, "dist/src");
        if (existsSync(srcDir)) rmSync(srcDir, { recursive: true });

        // Adjust manifest background field per browser
        const manifestPath = resolve(__dirname, "dist/manifest.json");
        if (existsSync(manifestPath)) {
          const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
          if (targetBrowser === "firefox") {
            // Firefox MV3 prefers "scripts" array over "service_worker"
            if (manifest.background?.service_worker) {
              manifest.background.scripts = [manifest.background.service_worker];
              delete manifest.background.service_worker;
            }
          } else {
            // Chrome uses service_worker, remove scripts
            if (manifest.background?.scripts) {
              delete manifest.background.scripts;
            }
          }
          writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/popup"),
    },
  },
  base: "./",
  experimental: {
    renderBuiltUrl(filename) {
      // Chrome extension needs relative paths from the popup/ directory
      return "../" + filename;
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background.js"),
        scanner: resolve(__dirname, "src/content/scanner.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "scanner") return "content/scanner.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
