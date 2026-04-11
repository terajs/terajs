import { afterEach, vi } from "vitest";
import {
  resetDebugGraphRegistry,
  resetDebugHandlers,
  resetDebugIdCounters,
  resetDebugListeners,
  resetDebugRegistry
} from "@terajs/shared";

afterEach(() => {
  resetDebugHandlers();
  resetDebugListeners();
  resetDebugRegistry();
  resetDebugGraphRegistry();
  resetDebugIdCounters();
  vi.clearAllMocks();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  document.title = "";
});
