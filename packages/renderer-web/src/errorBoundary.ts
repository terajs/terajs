import { getCurrentContext, onCleanup } from "@terajs/runtime";
import { Debug, type ComponentBoundaryError } from "@terajs/shared";

import { mount, unmount } from "./mount.js";
import type { FrameworkComponent } from "./render.js";

export interface ErrorBoundaryFallbackContext {
  error: unknown;
  retry: () => void;
}

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

        Debug.emit("error:component", {
          error: captured.error,
          phase: captured.phase,
          component: captured.componentName ?? "Unknown"
        });
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