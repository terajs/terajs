export interface SuspenseProps {
  fallback?: any;
  children?: any;
}

export function Suspense(props: SuspenseProps) {
  return props.children;
}
