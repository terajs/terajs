import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { compile } from "@vue-vapor/vue/vapor";

const configDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(configDir, "..");
const outDir = resolve(configDir, ".dist", "frameworks-browser");
const vueVaporFrameworkModuleId = "virtual:vue-vapor-framework-benchmark";
const vueVaporRouteModuleId = "virtual:vue-vapor-route-benchmark";
const routeLinkCount = 12;
const routeMetricCount = 16;
const routeCardCount = 40;
const routeStepCount = 16;

function createVueVaporFrameworkModule(): string {
  const { code } = compile(
    `<ul><li v-for="(value, index) in values" :key="index" :data-row="index">{{ value }}</li></ul>`,
    { prefixIdentifiers: true }
  );

  return code.replaceAll(`from 'vue/vapor'`, `from '@vue-vapor/vue/vapor'`);
}

function createVueVaporRouteModule(): string {
  const links = Array.from({ length: routeLinkCount }, (_, index) => `
    <a class="shell-link" :href="route.link${index}Href">{{ route.link${index}Label }}</a>
  `).join("");

  const metrics = Array.from({ length: routeMetricCount }, (_, index) => `
    <article class="metric-pill">
      <span>{{ route.metric${index}Label }}</span>
      <strong>{{ route.metric${index}Value }}</strong>
      <small>{{ route.metric${index}Trend }}</small>
    </article>
  `).join("");

  const cards = Array.from({ length: routeCardCount }, (_, index) => `
    <article class="content-card" :data-meta="route.card${index}Meta">
      <p>{{ route.card${index}Eyebrow }}</p>
      <h3>{{ route.card${index}Title }}</h3>
      <p>{{ route.card${index}Excerpt }}</p>
      <footer>{{ route.card${index}Meta }}</footer>
    </article>
  `).join("");

  const steps = Array.from({ length: routeStepCount }, (_, index) => `
    <li class="timeline-step">
      <div>
        <strong>{{ route.step${index}Label }}</strong>
        <p>{{ route.step${index}Detail }}</p>
      </div>
      <span>{{ route.step${index}Time }}</span>
    </li>
  `).join("");

  const { code } = compile(
    `
      <div class="route-shell">
        <header class="shell-header">
          <div class="brand-lockup">
            <strong>{{ route.brandName }}</strong>
            <p>{{ route.brandTagline }}</p>
          </div>
          <nav class="shell-nav">${links}</nav>
        </header>
        <main class="route-main">
          <section class="route-hero">
            <p>{{ route.pageKicker }}</p>
            <h1>{{ route.pageTitle }}</h1>
            <p>{{ route.pageSummary }}</p>
            <div class="hero-actions">
              <button>{{ route.primaryAction }}</button>
              <button>{{ route.secondaryAction }}</button>
            </div>
          </section>
          <section class="metrics-strip">${metrics}</section>
          <section class="content-grid">
            <div class="cards-panel">${cards}</div>
            <aside class="route-sidebar">
              <h2>{{ route.asideTitle }}</h2>
              <p>{{ route.asideSummary }}</p>
              <ol class="timeline-list">${steps}</ol>
            </aside>
          </section>
        </main>
        <footer class="route-footer">
          <strong>{{ route.footerLead }}</strong>
          <p>{{ route.footerNote }}</p>
        </footer>
      </div>
    `,
    { prefixIdentifiers: true }
  );

  return code.replaceAll(`from 'vue/vapor'`, `from '@vue-vapor/vue/vapor'`);
}

function vueVaporFrameworkBenchmarkPlugin() {
  const resolvedId = `\0${vueVaporFrameworkModuleId}`;
  const resolvedRouteId = `\0${vueVaporRouteModuleId}`;

  return {
    name: "terajs-vue-vapor-framework-benchmark",
    resolveId(id: string) {
      if (id === vueVaporFrameworkModuleId) {
        return resolvedId;
      }
      if (id === vueVaporRouteModuleId) {
        return resolvedRouteId;
      }
      return null;
    },
    load(id: string) {
      if (id === resolvedId) {
        return createVueVaporFrameworkModule();
      }
      if (id === resolvedRouteId) {
        return createVueVaporRouteModule();
      }
      return null;
    }
  };
}

export default defineConfig({
  root: repoRoot,
  base: "./",
  plugins: [vueVaporFrameworkBenchmarkPlugin()],
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