import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const configDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(configDir, "..");
const outDir = resolve(configDir, ".dist", "frameworks-browser");

export default defineConfig({
  root: repoRoot,
  base: "./",
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "frameworks-browser": resolve(configDir, "frameworks-browser.html"),
        "route-startup-browser": resolve(configDir, "route-startup-browser.html"),
      },
    },
  },
});