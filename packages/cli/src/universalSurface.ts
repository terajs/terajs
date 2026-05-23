const DOCS_URL = "https://terajs.com/docs";
const QUICKSTART_URL = "https://terajs.com/docs/quickstart";
const GITHUB_URL = "https://github.com/terajs/terajs";

function createUniversalCards(): Array<{ eyebrow: string; title: string; body: string }> {
  return [
    {
      eyebrow: "Shared source",
      title: "Author in src/shared/pages",
      body: "Keep route modules in <code>src/shared/pages</code> so one workspace owns the neutral .tera source."
    },
    {
      eyebrow: "Components",
      title: "Reuse from src/shared/components",
      body: "Keep shared components close to the routes they support without coupling them to a single target host."
    },
    {
      eyebrow: "Target map",
      title: "Select targets in terajs.config.cjs",
      body: "The workspace config reserves explicit paths for web output plus Android and iOS generated host surfaces."
    },
    {
      eyebrow: "Default path",
      title: "Keep the web-first starter for browser-only apps",
      body: `Use the default scaffold when you only need the web launch surface. Reach for this mode when one workspace must own shared source across targets. Read the <a href="${DOCS_URL}" target="_blank" rel="noreferrer">docs</a>, skim the <a href="${QUICKSTART_URL}" target="_blank" rel="noreferrer">quickstart</a>, or inspect <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>.`
    }
  ];
}

function createUniversalCardMarkup(): string {
  return createUniversalCards()
    .map((item) => `      <article class="starter-card">
        <p class="starter-card__eyebrow">${item.eyebrow}</p>
        <h2 class="starter-card__title">${item.title}</h2>
        <p class="starter-card__body">${item.body}</p>
      </article>`)
    .join("\n");
}

export function createUniversalPage(displayName: string): string {
  const cardMarkup = createUniversalCardMarkup();

  return `<template>
  <section class="starter-stage">
    <section class="starter-stage__hero">
      <StarterHero
        title=${JSON.stringify("Author once. Map targets deliberately.")}
        logo="/terajs-logo.png"
        logoAlt=${JSON.stringify("Terajs logo artwork with a fragmented teal-to-violet T surrounded by floating cubes.")}
      />

      <p class="starter-lede">
        This universal workspace keeps shared routes in <code>src/shared/pages</code>, shared components in
        <code>src/shared/components</code>, and reserves <code>.terajs/generated</code> plus
        <code>.terajs/hosts</code> for target-owned native output.
      </p>
    </section>

    <section class="starter-grid" aria-label="Universal workspace guide">
${cardMarkup}
    </section>
  </section>
</template>

<meta>
  title: ${JSON.stringify(`${displayName} | Terajs Universal Workspace`)}
  description: ${JSON.stringify(`${displayName} is a Terajs universal workspace starter with shared source folders, explicit target mapping, and reserved native output directories.`)}
</meta>

<ai>
  summary: ${JSON.stringify(`${displayName} is a Terajs universal workspace route with shared-source guidance, explicit target mapping, and reserved native output directories for Android and iOS.`)}
  tags:
    - terajs
    - universal-workspace
    - native-renderers
</ai>
`;
}

export function createUniversalWorkspaceReadme(displayName: string): string {
  return `# ${displayName}

This project was scaffolded with Terajs universal workspace mode.

## When to use this mode

Use \`--mode universal\` when one workspace should own shared \`.tera\` source and explicit target mapping for web, Android, and iOS.

Use the default scaffold when the application is web-first and only needs the standard browser launch surface.

## Workspace layout

- \`src/shared/pages\` for shared route modules
- \`src/shared/components\` for shared components
- \`src/plugins/index.ts\` for web preview wiring
- \`.terajs/generated/android\` for generated Android-target artifacts
- \`.terajs/generated/ios\` for generated iOS-target artifacts
- \`.terajs/hosts/android\` for generated Android host scaffolding
- \`.terajs/hosts/ios\` for generated iOS host scaffolding

## Target map

Target selection lives in \`terajs.config.cjs\`.

- \`web\` previews shared routes through Vite and writes browser assets to \`dist\`
- \`android\` reserves \`.terajs/generated/android\` and \`.terajs/hosts/android\`
- \`ios\` reserves \`.terajs/generated/ios\` and \`.terajs/hosts/ios\`

## Next steps

1. Open \`src/shared/pages\` and shape the shared route surface.
2. Use \`npm run dev\` to preview the shared source on the web target.
3. Keep generated native output under \`.terajs\` until you are ready to adopt a committed native host.

More guidance: ${DOCS_URL}
`;
}