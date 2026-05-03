import { mount, renderIRModuleToFragment, unmount } from "@terajs/renderer-web";
import { signal } from "@terajs/reactivity";
import { parseSFC, compileTemplateFromSFC } from "@terajs/sfc";
import { Debug } from "@terajs/shared";
import { html as htmlLit, nothing as litNothing, render as renderLit } from "lit";
import { h as hPreact, render as renderPreact } from "preact";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { createSignal as createSolidSignal, type Accessor } from "solid-js";
import htmlSolid from "solid-js/html";
import { render as renderSolid } from "solid-js/web";
import { createApp, h, nextTick, ref } from "vue";

type BenchmarkResult = {
  framework: string;
  startupMedianMs: number;
  startupMeanMs: number;
  navigationMedianMs: number;
  navigationUsPerTransition: number;
};

type BenchState = {
  status: "running" | "done" | "error";
  results?: BenchmarkResult[];
  error?: string;
};

type RouteRecord = Record<string, string>;
type ElementFactory = (type: string, props: Record<string, unknown> | null, ...children: unknown[]) => unknown;

const LINK_COUNT = readPositiveInt("links", 12);
const METRIC_COUNT = readPositiveInt("metrics", 16);
const CARD_COUNT = readPositiveInt("cards", 40);
const STEP_COUNT = readPositiveInt("steps", 16);
const WARMUP_RUNS = readPositiveInt("warmup", 5);
const TIMED_RUNS = readPositiveInt("runs", 25);
const ROUTE_SWAPS = readPositiveInt("swaps", 60);

const arena = document.querySelector("#mount-arena") as HTMLDivElement;
const configEl = document.querySelector("#config") as HTMLDivElement;
const statusEl = document.querySelector("#status") as HTMLDivElement;
const resultsBodyEl = document.querySelector("#results-body") as HTMLTableSectionElement;
const summaryEl = document.querySelector("#summary") as HTMLDivElement;

const routeLaunch = createRouteRecord("launch", {
  brandTagline: "Release candidate workspace",
  pageKicker: "Route readiness",
  pageTitle: "Launch route workspace",
  pageSummary: "Validate route startup, metadata, diagnostics, and first-interaction readiness before cutover.",
  primaryAction: "Open diagnostics",
  secondaryAction: "Run smoke suite",
  asideTitle: "Startup checklist",
  asideSummary: "Focused startup steps for the launch route before exposing traffic.",
  footerLead: "Launch route kept warm",
  footerNote: "Diagnostics, route metadata, and action hooks ready for cutover."
});

const routeDiagnostics = createRouteRecord("diagnostics", {
  brandTagline: "Router diagnostics workspace",
  pageKicker: "Runtime visibility",
  pageTitle: "Diagnostics route workspace",
  pageSummary: "Inspect routing phases, startup timing, and live state before shipping route changes.",
  primaryAction: "Inspect route tree",
  secondaryAction: "Open timing timeline",
  asideTitle: "Diagnostics checklist",
  asideSummary: "Startup-focused route checks that surface regressions before they reach users.",
  footerLead: "Diagnostics route active",
  footerNote: "Route phases, startup timings, and mounted state snapshots are available."
});

const benchState: BenchState = {
  status: "running"
};

(globalThis as typeof globalThis & { __TERAJS_ROUTE_BROWSER_BENCH__?: BenchState }).__TERAJS_ROUTE_BROWSER_BENCH__ = benchState;

Debug.emit = () => {};

configEl.innerHTML = `<p><code>${LINK_COUNT}</code> links, <code>${METRIC_COUNT}</code> metrics, <code>${CARD_COUNT}</code> cards, <code>${STEP_COUNT}</code> steps, <code>${ROUTE_SWAPS}</code> route swaps, <code>${WARMUP_RUNS}</code> warmups, <code>${TIMED_RUNS}</code> timed runs.</p>`;

run().catch((error) => {
  benchState.status = "error";
  benchState.error = error instanceof Error ? error.stack ?? error.message : String(error);
  statusEl.classList.add("error");
  statusEl.innerHTML = `<strong>Failed.</strong> <code>${escapeHtml(benchState.error)}</code>`;
  summaryEl.innerHTML = "";
  console.error("Browser route startup benchmark failed.", error);
});

async function run(): Promise<void> {
  const terajsIrModule = createTerajsRouteIR();
  const results: BenchmarkResult[] = [];

  statusEl.innerHTML = "<strong>Running…</strong> Measuring a route-like app shell in a production browser bundle.";

  results.push(await benchmarkFramework("Terajs", () => createTerajsHarness(terajsIrModule)));
  renderResults(results);

  results.push(await benchmarkFramework("Solid", () => createSolidHarness()));
  renderResults(results);

  results.push(await benchmarkFramework("Preact", () => createPreactHarness()));
  renderResults(results);

  results.push(await benchmarkFramework("Lit", () => createLitHarness()));
  renderResults(results);

  results.push(await benchmarkFramework("Vue", () => createVueHarness()));
  renderResults(results);

  results.push(await benchmarkFramework("React", () => createReactHarness()));
  renderResults(results);

  benchState.status = "done";
  benchState.results = results;
  statusEl.innerHTML = "<strong>Complete.</strong> Results below come from a production browser bundle, not jsdom or dev mode.";
  summaryEl.innerHTML = renderSummary(results);
  console.table(results);
}

function readPositiveInt(param: string, fallback: number): number {
  const raw = new URLSearchParams(location.search).get(param);
  const parsed = raw ? Number(raw) : fallback;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${param} must be a positive integer.`);
  }
  return parsed;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

function formatMs(value: number): string {
  return `${value.toFixed(2)} ms`;
}

function formatUs(value: number): string {
  return `${value.toFixed(1)} us`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function createRouteRecord(name: string, copy: {
  brandTagline: string;
  pageKicker: string;
  pageTitle: string;
  pageSummary: string;
  primaryAction: string;
  secondaryAction: string;
  asideTitle: string;
  asideSummary: string;
  footerLead: string;
  footerNote: string;
}): RouteRecord {
  const route: RouteRecord = {
    brandName: "Terajs",
    brandTagline: copy.brandTagline,
    pageKicker: copy.pageKicker,
    pageTitle: copy.pageTitle,
    pageSummary: copy.pageSummary,
    primaryAction: copy.primaryAction,
    secondaryAction: copy.secondaryAction,
    asideTitle: copy.asideTitle,
    asideSummary: copy.asideSummary,
    footerLead: copy.footerLead,
    footerNote: copy.footerNote,
  };

  for (let index = 0; index < LINK_COUNT; index += 1) {
    route[`link${index}Label`] = `${name} nav ${index + 1}`;
    route[`link${index}Href`] = `#${name}-nav-${index + 1}`;
  }

  for (let index = 0; index < METRIC_COUNT; index += 1) {
    route[`metric${index}Label`] = `${name} metric ${index + 1}`;
    route[`metric${index}Value`] = `${(index + 1) * (name === "launch" ? 3 : 5)} ms`;
    route[`metric${index}Trend`] = name === "launch" ? `stable ${index + 1}` : `watch ${index + 1}`;
  }

  for (let index = 0; index < CARD_COUNT; index += 1) {
    route[`card${index}Eyebrow`] = `${name} surface ${index + 1}`;
    route[`card${index}Title`] = `${copy.pageTitle} card ${index + 1}`;
    route[`card${index}Excerpt`] = `Card ${index + 1} keeps route diagnostics, startup context, and update readiness visible.`;
    route[`card${index}Meta`] = name === "launch" ? `ready ${index + 1}` : `trace ${index + 1}`;
  }

  for (let index = 0; index < STEP_COUNT; index += 1) {
    route[`step${index}Label`] = `${name} step ${index + 1}`;
    route[`step${index}Detail`] = `Verify route startup slice ${index + 1} before exposing this surface.`;
    route[`step${index}Time`] = `${index + 1}m`;
  }

  return route;
}

function createTerajsRouteIR() {
  const links = Array.from({ length: LINK_COUNT }, (_, index) => `
    <a class="shell-link" :href="route.link${index}Href">{{ route.link${index}Label }}</a>
  `).join("");

  const metrics = Array.from({ length: METRIC_COUNT }, (_, index) => `
    <article class="metric-pill">
      <span>{{ route.metric${index}Label }}</span>
      <strong>{{ route.metric${index}Value }}</strong>
      <small>{{ route.metric${index}Trend }}</small>
    </article>
  `).join("");

  const cards = Array.from({ length: CARD_COUNT }, (_, index) => `
    <article class="content-card" :data-meta="route.card${index}Meta">
      <p>{{ route.card${index}Eyebrow }}</p>
      <h3>{{ route.card${index}Title }}</h3>
      <p>{{ route.card${index}Excerpt }}</p>
      <footer>{{ route.card${index}Meta }}</footer>
    </article>
  `).join("");

  const steps = Array.from({ length: STEP_COUNT }, (_, index) => `
    <li class="timeline-step">
      <div>
        <strong>{{ route.step${index}Label }}</strong>
        <p>{{ route.step${index}Detail }}</p>
      </div>
      <span>{{ route.step${index}Time }}</span>
    </li>
  `).join("");

  const source = `
    <template>
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
    </template>
  `;

  const parsed = parseSFC(source, "/benchmarks/route-startup.tera");
  return compileTemplateFromSFC(parsed);
}

function createMountTarget(): HTMLDivElement {
  const root = document.createElement("div");
  arena.appendChild(root);
  return root;
}

function createTerajsHarness(irModule: ReturnType<typeof createTerajsRouteIR>) {
  const root = createMountTarget();
  const route = signal(routeLaunch);
  let active = routeLaunch;

  mount(() => renderIRModuleToFragment(irModule, { route }), root);

  return {
    async navigate(iteration: number) {
      active = iteration % 2 === 0 ? routeDiagnostics : routeLaunch;
      route.set(active);
    },
    async destroy() {
      unmount(root);
      root.remove();
    }
  };
}

function readRouteField(route: RouteRecord, key: string): string {
  return route[key] ?? "";
}

function renderSolidRouteLinks(route: Accessor<RouteRecord>) {
  return () => Array.from({ length: LINK_COUNT }, (_, index) => htmlSolid`<a class="shell-link" href=${readRouteField(route(), `link${index}Href`)}>${readRouteField(route(), `link${index}Label`)}</a>`);
}

function renderSolidRouteMetrics(route: Accessor<RouteRecord>) {
  return () => Array.from({ length: METRIC_COUNT }, (_, index) => htmlSolid`
    <article class="metric-pill">
      <span>${readRouteField(route(), `metric${index}Label`)}</span>
      <strong>${readRouteField(route(), `metric${index}Value`)}</strong>
      <small>${readRouteField(route(), `metric${index}Trend`)}</small>
    </article>
  `);
}

function renderSolidRouteCards(route: Accessor<RouteRecord>) {
  return () => Array.from({ length: CARD_COUNT }, (_, index) => htmlSolid`
    <article class="content-card" data-meta=${readRouteField(route(), `card${index}Meta`)}>
      <p>${readRouteField(route(), `card${index}Eyebrow`)}</p>
      <h3>${readRouteField(route(), `card${index}Title`)}</h3>
      <p>${readRouteField(route(), `card${index}Excerpt`)}</p>
      <footer>${readRouteField(route(), `card${index}Meta`)}</footer>
    </article>
  `);
}

function renderSolidRouteSteps(route: Accessor<RouteRecord>) {
  return () => Array.from({ length: STEP_COUNT }, (_, index) => htmlSolid`
    <li class="timeline-step">
      <div>
        <strong>${readRouteField(route(), `step${index}Label`)}</strong>
        <p>${readRouteField(route(), `step${index}Detail`)}</p>
      </div>
      <span>${readRouteField(route(), `step${index}Time`)}</span>
    </li>
  `);
}

function renderSolidRouteShell(route: Accessor<RouteRecord>) {
  return htmlSolid`
    <div class="route-shell">
      <header class="shell-header">
        <div class="brand-lockup">
          <strong>${() => readRouteField(route(), "brandName")}</strong>
          <p>${() => readRouteField(route(), "brandTagline")}</p>
        </div>
        <nav class="shell-nav">${renderSolidRouteLinks(route)}</nav>
      </header>
      <main class="route-main">
        <section class="route-hero">
          <p>${() => readRouteField(route(), "pageKicker")}</p>
          <h1>${() => readRouteField(route(), "pageTitle")}</h1>
          <p>${() => readRouteField(route(), "pageSummary")}</p>
          <div class="hero-actions">
            <button>${() => readRouteField(route(), "primaryAction")}</button>
            <button>${() => readRouteField(route(), "secondaryAction")}</button>
          </div>
        </section>
        <section class="metrics-strip">${renderSolidRouteMetrics(route)}</section>
        <section class="content-grid">
          <div class="cards-panel">${renderSolidRouteCards(route)}</div>
          <aside class="route-sidebar">
            <h2>${() => readRouteField(route(), "asideTitle")}</h2>
            <p>${() => readRouteField(route(), "asideSummary")}</p>
            <ol class="timeline-list">${renderSolidRouteSteps(route)}</ol>
          </aside>
        </section>
      </main>
      <footer class="route-footer">
        <strong>${() => readRouteField(route(), "footerLead")}</strong>
        <p>${() => readRouteField(route(), "footerNote")}</p>
      </footer>
    </div>
  `;
}

function renderRouteShellVNode(createElement: ElementFactory, route: RouteRecord) {
  return createElement(
    "div",
    { className: "route-shell" },
    createElement(
      "header",
      { className: "shell-header" },
      createElement(
        "div",
        { className: "brand-lockup" },
        createElement("strong", null, readRouteField(route, "brandName")),
        createElement("p", null, readRouteField(route, "brandTagline"))
      ),
      createElement(
        "nav",
        { className: "shell-nav" },
        Array.from({ length: LINK_COUNT }, (_, index) => createElement(
          "a",
          { key: `link-${index}`, href: readRouteField(route, `link${index}Href`) },
          readRouteField(route, `link${index}Label`)
        ))
      )
    ),
    createElement(
      "main",
      { className: "route-main" },
      createElement(
        "section",
        { className: "route-hero" },
        createElement("p", null, readRouteField(route, "pageKicker")),
        createElement("h1", null, readRouteField(route, "pageTitle")),
        createElement("p", null, readRouteField(route, "pageSummary")),
        createElement(
          "div",
          { className: "hero-actions" },
          createElement("button", null, readRouteField(route, "primaryAction")),
          createElement("button", null, readRouteField(route, "secondaryAction"))
        )
      ),
      createElement(
        "section",
        { className: "metrics-strip" },
        Array.from({ length: METRIC_COUNT }, (_, index) => createElement(
          "article",
          { key: `metric-${index}`, className: "metric-pill" },
          createElement("span", null, readRouteField(route, `metric${index}Label`)),
          createElement("strong", null, readRouteField(route, `metric${index}Value`)),
          createElement("small", null, readRouteField(route, `metric${index}Trend`))
        ))
      ),
      createElement(
        "section",
        { className: "content-grid" },
        createElement(
          "div",
          { className: "cards-panel" },
          Array.from({ length: CARD_COUNT }, (_, index) => createElement(
            "article",
            { key: `card-${index}`, className: "content-card", "data-meta": readRouteField(route, `card${index}Meta`) },
            createElement("p", null, readRouteField(route, `card${index}Eyebrow`)),
            createElement("h3", null, readRouteField(route, `card${index}Title`)),
            createElement("p", null, readRouteField(route, `card${index}Excerpt`)),
            createElement("footer", null, readRouteField(route, `card${index}Meta`))
          ))
        ),
        createElement(
          "aside",
          { className: "route-sidebar" },
          createElement("h2", null, readRouteField(route, "asideTitle")),
          createElement("p", null, readRouteField(route, "asideSummary")),
          createElement(
            "ol",
            { className: "timeline-list" },
            Array.from({ length: STEP_COUNT }, (_, index) => createElement(
              "li",
              { key: `step-${index}`, className: "timeline-step" },
              createElement(
                "div",
                null,
                createElement("strong", null, readRouteField(route, `step${index}Label`)),
                createElement("p", null, readRouteField(route, `step${index}Detail`))
              ),
              createElement("span", null, readRouteField(route, `step${index}Time`))
            ))
          )
        )
      )
    ),
    createElement(
      "footer",
      { className: "route-footer" },
      createElement("strong", null, readRouteField(route, "footerLead")),
      createElement("p", null, readRouteField(route, "footerNote"))
    )
  );
}

function renderRouteShellReact(route: RouteRecord) {
  return renderRouteShellVNode(React.createElement as ElementFactory, route);
}

function createReactHarness() {
  const rootElement = createMountTarget();
  let setRouteState: React.Dispatch<React.SetStateAction<RouteRecord>> | null = null;

  function App() {
    const [route, assignRoute] = useState<RouteRecord>(() => routeLaunch);
    setRouteState = assignRoute;
    return renderRouteShellReact(route);
  }

  const root = createRoot(rootElement);
  flushSync(() => {
    root.render(React.createElement(App));
  });

  return {
    async navigate(iteration: number) {
      flushSync(() => {
        setRouteState?.(iteration % 2 === 0 ? routeDiagnostics : routeLaunch);
      });
    },
    async destroy() {
      flushSync(() => {
        root.unmount();
      });
      rootElement.remove();
    }
  };
}

function createSolidHarness() {
  const rootElement = createMountTarget();
  const [route, setRoute] = createSolidSignal<RouteRecord>(routeLaunch);
  const dispose = renderSolid(() => renderSolidRouteShell(route), rootElement);

  return {
    async navigate(iteration: number) {
      setRoute(iteration % 2 === 0 ? routeDiagnostics : routeLaunch);
    },
    async destroy() {
      dispose();
      rootElement.remove();
    }
  };
}

function createPreactHarness() {
  const rootElement = createMountTarget();
  let route = routeLaunch;

  const renderApp = () => {
    renderPreact(renderRouteShellVNode(hPreact as ElementFactory, route), rootElement);
  };

  renderApp();

  return {
    async navigate(iteration: number) {
      route = iteration % 2 === 0 ? routeDiagnostics : routeLaunch;
      renderApp();
    },
    async destroy() {
      renderPreact(null, rootElement);
      rootElement.remove();
    }
  };
}

function renderRouteShellLit(route: RouteRecord) {
  return htmlLit`
    <div class="route-shell">
      <header class="shell-header">
        <div class="brand-lockup">
          <strong>${readRouteField(route, "brandName")}</strong>
          <p>${readRouteField(route, "brandTagline")}</p>
        </div>
        <nav class="shell-nav">
          ${Array.from({ length: LINK_COUNT }, (_, index) => htmlLit`<a class="shell-link" href=${readRouteField(route, `link${index}Href`)}>${readRouteField(route, `link${index}Label`)}</a>`)}
        </nav>
      </header>
      <main class="route-main">
        <section class="route-hero">
          <p>${readRouteField(route, "pageKicker")}</p>
          <h1>${readRouteField(route, "pageTitle")}</h1>
          <p>${readRouteField(route, "pageSummary")}</p>
          <div class="hero-actions">
            <button>${readRouteField(route, "primaryAction")}</button>
            <button>${readRouteField(route, "secondaryAction")}</button>
          </div>
        </section>
        <section class="metrics-strip">
          ${Array.from({ length: METRIC_COUNT }, (_, index) => htmlLit`
            <article class="metric-pill">
              <span>${readRouteField(route, `metric${index}Label`)}</span>
              <strong>${readRouteField(route, `metric${index}Value`)}</strong>
              <small>${readRouteField(route, `metric${index}Trend`)}</small>
            </article>
          `)}
        </section>
        <section class="content-grid">
          <div class="cards-panel">
            ${Array.from({ length: CARD_COUNT }, (_, index) => htmlLit`
              <article class="content-card" data-meta=${readRouteField(route, `card${index}Meta`)}>
                <p>${readRouteField(route, `card${index}Eyebrow`)}</p>
                <h3>${readRouteField(route, `card${index}Title`)}</h3>
                <p>${readRouteField(route, `card${index}Excerpt`)}</p>
                <footer>${readRouteField(route, `card${index}Meta`)}</footer>
              </article>
            `)}
          </div>
          <aside class="route-sidebar">
            <h2>${readRouteField(route, "asideTitle")}</h2>
            <p>${readRouteField(route, "asideSummary")}</p>
            <ol class="timeline-list">
              ${Array.from({ length: STEP_COUNT }, (_, index) => htmlLit`
                <li class="timeline-step">
                  <div>
                    <strong>${readRouteField(route, `step${index}Label`)}</strong>
                    <p>${readRouteField(route, `step${index}Detail`)}</p>
                  </div>
                  <span>${readRouteField(route, `step${index}Time`)}</span>
                </li>
              `)}
            </ol>
          </aside>
        </section>
      </main>
      <footer class="route-footer">
        <strong>${readRouteField(route, "footerLead")}</strong>
        <p>${readRouteField(route, "footerNote")}</p>
      </footer>
    </div>
  `;
}

function createLitHarness() {
  const rootElement = createMountTarget();
  let route = routeLaunch;

  const renderApp = () => {
    renderLit(renderRouteShellLit(route), rootElement);
  };

  renderApp();

  return {
    async navigate(iteration: number) {
      route = iteration % 2 === 0 ? routeDiagnostics : routeLaunch;
      renderApp();
    },
    async destroy() {
      renderLit(litNothing, rootElement);
      rootElement.remove();
    }
  };
}

function renderRouteShellVue(route: RouteRecord) {
  return h(
    "div",
    { class: "route-shell" },
    [
      h("header", { class: "shell-header" }, [
        h("div", { class: "brand-lockup" }, [
          h("strong", null, readRouteField(route, "brandName")),
          h("p", null, readRouteField(route, "brandTagline")),
        ]),
        h("nav", { class: "shell-nav" }, Array.from({ length: LINK_COUNT }, (_, index) => h(
          "a",
          { href: readRouteField(route, `link${index}Href`) },
          readRouteField(route, `link${index}Label`)
        )))
      ]),
      h("main", { class: "route-main" }, [
        h("section", { class: "route-hero" }, [
          h("p", null, readRouteField(route, "pageKicker")),
          h("h1", null, readRouteField(route, "pageTitle")),
          h("p", null, readRouteField(route, "pageSummary")),
          h("div", { class: "hero-actions" }, [
            h("button", null, readRouteField(route, "primaryAction")),
            h("button", null, readRouteField(route, "secondaryAction")),
          ])
        ]),
        h("section", { class: "metrics-strip" }, Array.from({ length: METRIC_COUNT }, (_, index) => h(
          "article",
          { class: "metric-pill" },
          [
            h("span", null, readRouteField(route, `metric${index}Label`)),
            h("strong", null, readRouteField(route, `metric${index}Value`)),
            h("small", null, readRouteField(route, `metric${index}Trend`)),
          ]
        ))),
        h("section", { class: "content-grid" }, [
          h("div", { class: "cards-panel" }, Array.from({ length: CARD_COUNT }, (_, index) => h(
            "article",
            { class: "content-card", "data-meta": readRouteField(route, `card${index}Meta`) },
            [
              h("p", null, readRouteField(route, `card${index}Eyebrow`)),
              h("h3", null, readRouteField(route, `card${index}Title`)),
              h("p", null, readRouteField(route, `card${index}Excerpt`)),
              h("footer", null, readRouteField(route, `card${index}Meta`)),
            ]
          ))),
          h("aside", { class: "route-sidebar" }, [
            h("h2", null, readRouteField(route, "asideTitle")),
            h("p", null, readRouteField(route, "asideSummary")),
            h("ol", { class: "timeline-list" }, Array.from({ length: STEP_COUNT }, (_, index) => h(
              "li",
              { class: "timeline-step" },
              [
                h("div", null, [
                  h("strong", null, readRouteField(route, `step${index}Label`)),
                  h("p", null, readRouteField(route, `step${index}Detail`)),
                ]),
                h("span", null, readRouteField(route, `step${index}Time`)),
              ]
            )))
          ])
        ])
      ]),
      h("footer", { class: "route-footer" }, [
        h("strong", null, readRouteField(route, "footerLead")),
        h("p", null, readRouteField(route, "footerNote")),
      ])
    ]
  );
}

function createVueHarness() {
  const rootElement = createMountTarget();
  const route = ref<RouteRecord>(routeLaunch);

  const app = createApp({
    setup() {
      return () => renderRouteShellVue(route.value);
    }
  });

  app.mount(rootElement);

  return {
    async navigate(iteration: number) {
      route.value = iteration % 2 === 0 ? routeDiagnostics : routeLaunch;
      await nextTick();
    },
    async destroy() {
      app.unmount();
      rootElement.remove();
    }
  };
}

async function warmupAndMeasure(runs: number, execute: () => void | Promise<void>) {
  for (let runIndex = 0; runIndex < WARMUP_RUNS; runIndex += 1) {
    await execute();
  }

  const samples: number[] = [];
  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    const startedAt = performance.now();
    await execute();
    samples.push(performance.now() - startedAt);
  }

  return {
    meanMs: average(samples),
    medianMs: median(samples)
  };
}

async function benchmarkFramework(name: string, createHarness: () => {
  navigate: (iteration: number) => void | Promise<void>;
  destroy: () => void | Promise<void>;
}) {
  const startup = await warmupAndMeasure(TIMED_RUNS, async () => {
    const harness = createHarness();
    await harness.destroy();
  });

  const navigation = await warmupAndMeasure(TIMED_RUNS, async () => {
    const harness = createHarness();
    try {
      for (let updateIndex = 0; updateIndex < ROUTE_SWAPS; updateIndex += 1) {
        await harness.navigate(updateIndex);
      }
    } finally {
      await harness.destroy();
    }
  });

  return {
    framework: name,
    startupMedianMs: startup.medianMs,
    startupMeanMs: startup.meanMs,
    navigationMedianMs: navigation.medianMs,
    navigationUsPerTransition: (navigation.medianMs * 1000) / ROUTE_SWAPS,
  } satisfies BenchmarkResult;
}

function renderResults(results: BenchmarkResult[]): void {
  resultsBodyEl.innerHTML = results.map((entry) => `
    <tr>
      <td>${entry.framework}</td>
      <td>${formatMs(entry.startupMedianMs)}</td>
      <td>${formatMs(entry.startupMeanMs)}</td>
      <td>${formatMs(entry.navigationMedianMs)}</td>
      <td>${formatUs(entry.navigationUsPerTransition)}</td>
    </tr>
  `).join("");
}

function renderSummary(results: BenchmarkResult[]): string {
  const terajs = results.find((entry) => entry.framework === "Terajs");
  if (!terajs) {
    return "";
  }

  return results.map((entry) => {
    const startupRatio = (entry.startupMedianMs / terajs.startupMedianMs).toFixed(2);
    const navigationRatio = (entry.navigationMedianMs / terajs.navigationMedianMs).toFixed(2);

    return `<p><code>${entry.framework}</code>: startup ${startupRatio}x, route swap ${navigationRatio}x relative to Terajs.</p>`;
  }).join("");
}