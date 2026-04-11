// Shared event bus for Terajs DevTools (runtime <-> overlay)
import { shallowRef } from "@terajs/reactivity";

export interface DevtoolsEvent {
  type: string;
  timestamp: number;
  payload?: any;
  file?: string;
  line?: number;
  column?: number;
  level?: "info" | "warn" | "error";
}

const eventsRef = shallowRef<DevtoolsEvent[]>([]);

export function pushEvent(event: DevtoolsEvent) {
  eventsRef.value = [...eventsRef.value, event];
}

export function useEvents() {
  return eventsRef;
}

