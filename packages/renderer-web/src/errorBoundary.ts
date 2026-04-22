import { getCurrentContext, onCleanup } from "@terajs/runtime";
import { type ComponentBoundaryError } from "@terajs/shared";
import { emitRendererDebug } from "./debug.js";

import { mount, unmount } from "./mount.js";
import type { FrameworkComponent } from "./render.js";

/**
 * Context passed to an error-boundary fallback renderer.
 */
export interface ErrorBoundaryFallbackContext {
  error: unknown;
  retry: () => void;
}

/**
 * Configuration for `withErrorBoundary`.
 */
export interface ErrorBoundaryOptions {
  fallback: (context: ErrorBoundaryFallbackContext) => Node;
  onError?: (captured: ComponentBoundaryError) => void;
}

function safeUnmount(host: HTMLElement): void {
  try {
    unmount(host);
  } catch {
    host.innerHTML = "";
  }
}

function safeRenderFallback(
  host: HTMLElement,
  fallback: (context: ErrorBoundaryFallbackContext) => Node,
  error: unknown,
  retry: () => void
): void {
  safeUnmount(host);

  try {
    host.appendChild(fallback({ error, retry }));
  } catch (fallbackError) {
    host.textContent = fallbackError instanceof Error ? fallbackError.message : "Error boundary fallback failed.";
  }
}

/**
 * Wraps a component in a local error boundary.
 *
 * Rendering failures are redirected to the provided fallback renderer, which
 * receives both the captured error and a retry callback.
 *
 * @param component - The component to protect with an error boundary.
 * @param options - Fallback rendering and optional error reporting hooks.
 * @returns A framework component that renders through the configured boundary.
 */
export function withErrorBoundary(
  component: FrameworkComponent,
  options: ErrorBoundaryOptions
): FrameworkComponent {
  return (props?: any) => {
    const host = document.createElement("div");
    host.setAttribute("data-tera-error-boundary", "true");

    let disposed = false;

    const renderChild = () => {
      if (disposed) {
        return;
      }

      safeUnmount(host);

      const parentContext = getCurrentContext();
      const previousBoundary = parentContext?.errorBoundary;
      const handleBoundaryError = (captured: ComponentBoundaryError) => {
        if (disposed) {
          return;
        }

        emitRendererDebug("error:component", () => ({
          error: captured.error,
          phase: captured.phase,
          component: captured.componentName ?? "Unknown"
        }));
        options.onError?.(captured);
        safeRenderFallback(host, options.fallback, captured.error, renderChild);
      };

      if (parentContext) {
        parentContext.errorBoundary = handleBoundaryError;
      }

      try {
        mount(component, host, props);
      } catch (error) {
        handleBoundaryError({
          error,
          phase: "render"
        });
      } finally {
        if (parentContext) {
          parentContext.errorBoundary = previousBoundary;
        }
      }
    };

    renderChild();

    onCleanup(() => {
      disposed = true;
      safeUnmount(host);
    });

    return host;
  };
}