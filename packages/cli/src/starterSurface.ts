type StarterHubType = "signalr" | "socket.io" | "websockets";

const DOCS_URL = "https://terajs.com/docs";
const QUICKSTART_URL = "https://terajs.com/docs/quickstart";
const GITHUB_URL = "https://github.com/Thecodergabe/terajs";

export function createStarterHero(): string {
  return `<template>
  <section class="hero">
    <div v-if="hasLogo()" class="hero__logo-frame">
      <img
        :src="logo()"
        :alt="logoAlt()"
        class="hero__logo-image"
        loading="eager"
        decoding="async"
      />
    </div>

    <h1 class="hero__title">{{ title() }}</h1>
  </section>
</template>

<script>
const DEFAULT_TITLE = 'Terajs starter'

function title() {
  return typeof props.title === 'string' && props.title.length > 0
    ? props.title
    : DEFAULT_TITLE
}

function logo() {
  return typeof props.logo === 'string' ? props.logo : ''
}

function logoAlt() {
  return typeof props.logoAlt === 'string' ? props.logoAlt : ''
}

function hasLogo() {
  return logo().length > 0
}
</script>
`;
}

export function createStarterLayout(): string {
  return `<template>
  <main class="starter-shell">
    <slot />
  </main>
</template>
`;
}

function createStageCopy(hubType?: StarterHubType): string {
  return hubType
    ? `Routes, components, and ${hubType} sync are already wired. Open <code>src/pages</code>, shape the first screen, and let Terajs handle the route surface.`
    : `Routes, components, and the Vite plugin are already wired. Open <code>src/pages</code>, shape the first screen, and let Terajs handle the route surface.`;
}

function createStarterCards(hubType?: StarterHubType): Array<{ eyebrow: string; title: string; body: string }> {
  return [
    {
      eyebrow: "Route-first",
      title: "Start in src/pages",
      body: `Add a <code>.tera</code> file and Terajs turns it into a route without another registry step.`
    },
    {
      eyebrow: "Auto-import",
      title: "Compose from src/components",
      body: `Drop in a component and use it directly in your templates without manual registration.`
    },
    {
      eyebrow: hubType ? "Sync ready" : "Tooling",
      title: hubType ? `${hubType} is already configured` : "Plugin boot is already wired",
      body: hubType
        ? `Update <code>terajs.config.cjs</code> if the hub URL changes. The rest of the starter stays the same.`
        : `The starter boots through <code>src/plugins/index.ts</code> so you can stay focused on the app.`
    },
    {
      eyebrow: "Reference",
      title: "Keep the docs close",
      body: `Read the <a href="${DOCS_URL}" target="_blank" rel="noreferrer">docs</a>, skim the <a href="${QUICKSTART_URL}" target="_blank" rel="noreferrer">quickstart</a>, or inspect <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>.`
    }
  ];
}

function createStarterCardMarkup(hubType?: StarterHubType): string {
  return createStarterCards(hubType)
    .map((item) => `      <article class="starter-card">
        <p class="starter-card__eyebrow">${item.eyebrow}</p>
        <h2 class="starter-card__title">${item.title}</h2>
        <p class="starter-card__body">${item.body}</p>
      </article>`)
    .join("\n");
}

export function createStarterPage(displayName: string, hubType?: StarterHubType): string {
  const stageCopy = createStageCopy(hubType);
  const cardMarkup = createStarterCardMarkup(hubType);

  return `<template>
  <section class="starter-stage">
    <section class="starter-stage__hero">
      <StarterHero
        title=${JSON.stringify("Start building with Terajs.")}
        logo="/terajs-logo.png"
        logoAlt=${JSON.stringify("Terajs logo artwork with a fragmented teal-to-violet T surrounded by floating cubes.")}
      />

      <p class="starter-lede">${stageCopy}</p>
    </section>

    <section class="starter-grid" aria-label="Starter guide">
${cardMarkup}
    </section>
  </section>
</template>

<meta>
  title: ${JSON.stringify(`${displayName} | Terajs Starter`)}
  description: ${JSON.stringify(`${displayName} is a Terajs starter with a spacious logo-first stage, a route-first setup, and concise starter guidance.`)}
</meta>

<ai>
  summary: ${JSON.stringify(`${displayName} is a Terajs starter route with a large centered logo, a short practical intro, and a compact guide grid for routes, components, tooling, and docs.`)}
  tags:
    - terajs
    - starter
    - local-first
</ai>
`;
}

export function createStarterStyles(): string {
  return `@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap");

:root {
  color-scheme: dark;
  --starter-bg: #08111d;
  --starter-border: rgba(124, 145, 182, 0.18);
  --starter-text: #f4f7fb;
  --starter-muted: #a1afc9;
  --starter-accent: #6ce8ff;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(circle at top, rgba(79, 195, 255, 0.1), transparent 24%),
    linear-gradient(180deg, #0a1220 0%, var(--starter-bg) 55%, #050810 100%);
  color: var(--starter-text);
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  display: block;
  max-width: 100%;
}

.starter-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(3.5rem, 11vh, 7rem) clamp(1.5rem, 5vw, 3.25rem) clamp(4rem, 10vh, 7rem);
}

.starter-stage {
  width: min(100%, 76rem);
  display: grid;
  gap: clamp(2.5rem, 6vw, 4.75rem);
  justify-items: center;
}

.hero {
  width: min(100%, 42rem);
  display: grid;
  justify-items: center;
  gap: 0;
  padding: 0.25rem 0 0;
  text-align: center;
}

.hero__logo-frame {
  display: grid;
  place-items: center;
}

.hero__logo-image {
  width: min(640px, 82vw);
  margin: 0 auto 2.5rem;
  height: auto;
}

.hero__title {
  margin: 0;
  max-width: 18ch;
  font-family: "Manrope", "IBM Plex Sans", sans-serif;
  font-size: clamp(1.35rem, 2.6vw, 1.95rem);
  line-height: 1.22;
  letter-spacing: -0.04em;
  color: rgba(244, 247, 251, 0.78);
  text-align: center;
}

.starter-stage__hero {
  width: min(100%, 48rem);
  display: grid;
  gap: 1.5rem;
  justify-items: center;
}

.starter-lede {
  margin: 0;
  max-width: 40rem;
  color: var(--starter-muted);
  font-size: 1rem;
  line-height: 1.9;
  text-align: center;
}

.starter-lede code {
  font-size: 0.94em;
  color: var(--starter-text);
}

.starter-grid {
  width: min(100%, 72rem);
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  align-items: stretch;
}

.starter-card {
  min-height: 13rem;
  padding: 1.4rem 1.35rem 1.5rem;
  border: 1px solid var(--starter-border);
  border-radius: 1.35rem;
  background:
    linear-gradient(180deg, rgba(15, 27, 44, 0.92), rgba(10, 18, 32, 0.88)),
    radial-gradient(circle at top right, rgba(108, 232, 255, 0.12), transparent 42%);
  box-shadow: 0 18px 54px rgba(2, 8, 20, 0.26);
}

.starter-card__eyebrow {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--starter-accent);
}

.starter-card__title {
  margin: 0;
  padding-top: 0.85rem;
  font-family: "Manrope", "IBM Plex Sans", sans-serif;
  font-size: 1.12rem;
  font-weight: 700;
  color: rgba(244, 247, 251, 0.9);
}

.starter-card__body {
  margin: 0.65rem 0 0;
  color: var(--starter-muted);
  font-size: 0.97rem;
  line-height: 1.8;
}

.starter-card__body a {
  color: var(--starter-accent);
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.starter-card__body a:hover {
  color: var(--starter-text);
}

.starter-card__body code {
  font-size: 0.92em;
  color: var(--starter-text);
}

@media (min-width: 700px) {
  .starter-shell {
    padding-inline: clamp(2rem, 4vw, 4rem);
  }
}

@media (min-width: 960px) {
  .hero__logo-image {
    width: min(700px, 74vw);
  }

  .starter-grid {
    gap: 1.25rem;
  }
}
`;
}