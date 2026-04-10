import { describe, expect, it } from "vitest";
import { signal } from "@terajs/reactivity";
import { captureStateSnapshot, defineAIActions } from "./index";

describe("adapter-ai", () => {
  it("exports a JSON-LD snapshot for non-sensitive signals", () => {
    const username = signal("alice");
    const password = signal("hunter2", { key: "password" });

    const snapshot = captureStateSnapshot([username, password]);

    expect(snapshot["@context"]).toBe("https://schema.org");
    expect(snapshot["@type"]).toBe("TerajsStateSnapshot");
    expect(snapshot.signals.some((signal) => signal.key === "password")).toBe(false);
    expect(snapshot.signals.some((signal) => signal.scope === username._meta.scope)).toBe(true);
  });

  it("defaults to active keyed signals when no explicit signals are provided", () => {
    const active = signal("hello", { key: "greeting" });
    signal("hidden");

    const snapshot = captureStateSnapshot();

    expect(snapshot.signals.some((entry) => entry.id === active._meta.rid)).toBe(true);
  });

  it("enforces explicit AI action schemas", () => {
    const actions = defineAIActions({
      greet: {
        description: "Send a greeting to the user.",
        params: {
          name: { type: "string", required: true, description: "The user name." }
        }
      }
    });

    expect(actions.validate("greet", { name: "Taylor" })).toBe(true);
    expect(actions.validate("greet", { name: 12 })).toBe(false);
    expect(actions.validate("unknown" as keyof typeof actions.schema, {} as Record<string, unknown>)).toBe(false);
  });
});
