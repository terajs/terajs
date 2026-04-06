// Shared event bus for Nebula DevTools (runtime <-> overlay)
import { createSignal } from "@nebula/reactivity";

export interface DevtoolsEvent {
  type: string;
  timestamp: number;
  payload?: any;
  file?: string;
  line?: number;
  column?: number;
  level?: "info" | "warn" | "error";
}

const [events, setEvents] = createSignal<DevtoolsEvent[]>([]);

export function pushEvent(event: DevtoolsEvent) {
  setEvents([...events(), event]);
}

export function useEvents() {
  return events;
}
