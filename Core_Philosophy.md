# Nebula Core Philosophy

Nebula is built on a few non‑negotiable principles that guide every API, every feature, and every design decision.

---

## **1. TypeScript‑first, but never TypeScript‑required**

Nebula is designed so that:

- TypeScript users get **full inference**, **strict types**, and **zero‑config ergonomics**  
- JavaScript users get **the exact same APIs**, with no warnings or penalties  
- Every feature works in both TS and JS  
- No decorators, no magical syntax, no TS‑only features  

Nebula’s stance:

> **TypeScript should enhance your experience, not gatekeep it.**

---

## **2. Zero opinions on styling**

Nebula does not enforce or prefer any styling approach.

You can use:

- Tailwind  
- UnoCSS  
- CSS Modules  
- SCSS  
- Styled Components  
- Vanilla CSS  
- Inline styles  
- Design systems  
- No styles at all  

Nebula’s renderer doesn’t care — it just updates the DOM.

---

## **3. Zero opinions on platform**

Nebula is renderer‑agnostic by design.

Supported and planned targets include:

- Web (DOM)  
- Native (iOS/Android)  
- Canvas/WebGL  
- Terminal  
- Server‑only  
- Embedded devices  
- Custom renderers  

The component model stays the same everywhere.

Nebula’s stance:

> **Your code shouldn’t care where it runs.**

---

## **4. Developer Experience above everything**

Nebula is built for humans:

- predictable reactivity  
- simple mental model  
- no hidden magic  
- no footguns  
- fast feedback loops  
- readable stack traces  
- clear error messages  
- tooling that feels invisible  

DX isn’t an afterthought — it’s the product.

---

## **5. Debugging is a first‑class feature**

Nebula is designed to be easy to debug:

- clear reactive graph  
- traceable signal updates  
- component boundaries visible  
- hydration logs  
- SSR logs  
- template → IR → DOM mapping  
- devtools hooks  
- no opaque runtime behavior  

If something breaks, you should know **exactly why**.

---

## **6. Flexibility over dogma**

Nebula avoids:

- rigid file structures  
- mandatory patterns  
- enforced conventions  
- opinionated architecture  
- “the one true way” thinking  

Developers can:

- structure components however they want  
- mix JSX and templates  
- use or ignore scoped styles  
- use or ignore routing/meta  
- build custom renderers  
- drop down to low‑level APIs  

Nebula’s stance:

> **Give developers power, not rules.**

---

## **7. Performance without complexity**

Nebula delivers high performance through:

- fine‑grained reactivity  
- direct DOM updates  
- compiler‑generated IR  
- zero VDOM  
- zero diffing  
- zero component re‑renders  

But the mental model stays simple.

---

## **8. AI‑ready and meta‑aware**

Nebula treats metadata as a first‑class concern:

- SEO metadata  
- AI hints  
- semantic tags  
- component‑level meta  
- template‑level overrides  
- route‑level aggregation  

This enables AI‑aware tooling and consistent SEO.

---
