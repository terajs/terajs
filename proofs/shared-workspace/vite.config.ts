import { defineConfig } from "vite";
import terajsPlugin from "@terajs/app/vite";

export default defineConfig({
  plugins: [terajsPlugin()],
  build: {
    manifest: true
  }
});