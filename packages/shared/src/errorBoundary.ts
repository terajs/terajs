export type ComponentErrorPhase = "render" | "template";

export interface ComponentBoundaryError {
  error: unknown;
  phase: ComponentErrorPhase;
  componentName?: string;
}

export type ComponentErrorBoundaryHandler = (captured: ComponentBoundaryError) => void;