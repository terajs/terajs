// DevTools UI using Nebula components and Tailwind (scaffold)
import { createSignal } from "@nebula/reactivity";

export interface DebugEvent {
  type: string;
  timestamp: number;
  payload: unknown;
}

export function DevtoolsApp() {
  // Placeholder: will use Nebula's component system
  return (
    <div class="p-4 font-mono text-sm bg-slate-900 text-slate-100">
      <h1 class="font-bold text-lg mb-2">Nebula DevTools (Scaffold)</h1>
      <div>Event stream and inspection UI coming soon.</div>
    </div>
  );
}
