/**
 * Compares server-side HTML against client-side expectations.
 * Only active in development to prevent production overhead.
 */
export function validateHydration(container: HTMLElement, expectedHTML: string): void {
  if (container.innerHTML === expectedHTML) return;

  console.warn(
    "%c[Terajs Hydration Mismatch]",
    "color: #ff4757; font-weight: bold;",
    "The HTML rendered by the server does not match the client's first pass. This can cause UI flickering or broken event listeners."
  );

  console.log("Expected:", expectedHTML.slice(0, 100) + "...");
  console.log("Actual:  ", container.innerHTML.slice(0, 100) + "...");
}
