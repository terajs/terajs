import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: [
      "packages/**/*.{test,spec}.ts",
      "packages/**/*.{test,spec}.js",
      "packages/adapter-react/**/*.{test,spec}.tsx"
    ],
    exclude: ["**/dist/**"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],

    // --- REFINED MEMORY STABILIZATION ---
    
    // Limits the number of concurrent processes. 
    // On a machine hitting 4GB limits, 3 is usually the "sweet spot" 
    // for balancing speed and memory safety.
    maxWorkers: 3, 

    // Forces a clean environment for each test file.
    // This is the "Root Fix" for JSDOM memory accumulation.
    isolate: true,

    // Prevents Vitest from trying to process styles in your unit tests,
    // which significantly reduces the transform cache size.
    css: false,
    
    // --- END MEMORY FIXES ---

    alias: {
      "@terajs/compiler": path.resolve(__dirname, "./packages/compiler/src"),
      "@terajs/devtools": path.resolve(__dirname, "./packages/devtools/src"),
      "@terajs/reactivity": path.resolve(__dirname, "./packages/reactivity/src"),
      "@terajs/renderer": path.resolve(__dirname, "./packages/renderer/src"),
      "@terajs/renderer-ssr": path.resolve(__dirname, "./packages/renderer-ssr/src"),
      "@terajs/renderer-web": path.resolve(__dirname, "./packages/renderer-web/src"),
      "@terajs/router": path.resolve(__dirname, "./packages/router/src"),
      "@terajs/runtime": path.resolve(__dirname, "./packages/runtime/src"),
      "@terajs/sfc": path.resolve(__dirname, "./packages/sfc/src"),
      "@terajs/shared": path.resolve(__dirname, "./packages/shared/src"),
      "@terajs/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@terajs/adapter-ai": path.resolve(__dirname, "./packages/adapter-ai/src"),
      "@terajs/vite-plugin": path.resolve(__dirname, "./packages/vite-plug-in/src")
    }
  }
});