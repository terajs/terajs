# Terajs Brand Tokens

Use this file as the quick reference for the public website, docs, landing pages, and marketing surfaces.

## Palette

```css
:root {
  --tera-black: #05070F;
  --tera-carbon: #0D1320;
  --tera-graphite: #1D2940;
  --tera-blue: #2F6DFF;
  --tera-cyan: #32D7FF;
  --tera-purple: #6F6DFF;
  --tera-mint: #25D39F;
  --tera-amber: #FFBE55;
  --tera-rose: #FF6F91;
  --tera-mist: #93A7CB;
  --tera-cloud: #F2F7FF;
}
```

## Typography

Primary UI font:

```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

Heading font:

```css
font-family: "Space Grotesk", "Inter", sans-serif;
```

Alternate heading option:

```css
font-family: "Satoshi", "Inter", sans-serif;
```

Code font:

```css
font-family: "JetBrains Mono", "Fira Code", monospace;
```

## Usage

- Use `--tera-black` for full-page dark backgrounds.
- Use `--tera-carbon` for cards, panels, and elevated surfaces.
- Use `--tera-graphite` for borders, dividers, and inactive controls.
- Use `--tera-blue` for primary actions.
- Use `--tera-cyan` for active states, selection, and queue/live indicators.
- Use `--tera-purple` for AI and analytics emphasis.
- Use `--tera-mint` for success and healthy sync states.
- Use `--tera-amber` for warnings and queue latency hints.
- Use `--tera-rose` for error/severity accents.
- Use `--tera-mist` for muted text and secondary labels.
- Use `--tera-cloud` for primary text on dark UI.

## Tailwind Reference

The current Tailwind mapping lives in `packages/devtools/tailwind.config.js` under `theme.extend.colors.tera` and `theme.extend.fontFamily`.