import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, rmSync } from "fs";

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
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/popup"),
    },
  },
  base: "/",
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
