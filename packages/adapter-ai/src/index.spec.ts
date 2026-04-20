import { describe, expect, it, vi } from "vitest";
import { signal } from "@terajs/reactivity";
import { captureStateSnapshot, createAIChatbot, defineAIActions } from "./index";

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

  it("builds a safe chatbot request with explicit actions and sanitized state", () => {
    const cart = signal({ items: 2 }, { key: "cart" });
    const token = signal("secret-token", { key: "token" });

    const chatbot = createAIChatbot({
      endpoint: "/api/chat",
      includeStateSnapshot: true,
      signals: [cart, token],
      actions: {
        recommend: {
          description: "Recommend products for the shopper.",
          params: {
            query: { type: "string", required: true }
          }
        }
      }
    });

    const request = chatbot.buildRequest("Find me running shoes", {
      conversation: [{ role: "user", content: "I need a gift" }],
      metadata: { route: "/cart", signedIn: true, step: 2 }
    });

    expect(request.actions.recommend.description).toBe("Recommend products for the shopper.");
    expect(request.message).toBe("Find me running shoes");
    expect(request.state?.signals.some((entry) => entry.key === "cart")).toBe(true);
    expect(request.state?.signals.some((entry) => entry.key === "token")).toBe(false);
    expect(request.metadata).toEqual({ route: "/cart", signedIn: true, step: 2 });
  });

  it("rejects external endpoints by default", async () => {
    const chatbot = createAIChatbot({
      endpoint: "https://assistant.example.com/chat",
      origin: "https://shop.example.com"
    });

    await expect(chatbot.sendMessage("hello")).rejects.toThrow(
      "AI chatbot endpoint must be relative or same-origin unless allowExternalEndpoint is true."
    );
  });

  it("sends same-origin requests with JSON payloads", async () => {
    const catalog = signal(["shoe", "sock"], { key: "catalog" });
    const fetchStub = vi.fn(async (_input: string, init: { body: string; credentials: "same-origin" | "omit" }) => {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ received: JSON.parse(init.body), credentials: init.credentials })
      };
    });

    const chatbot = createAIChatbot({
      endpoint: "/api/chat",
      includeStateSnapshot: true,
      signals: [catalog],
      actions: {
        searchCatalog: {
          description: "Search the product catalog."
        }
      },
      fetch: fetchStub
    });

    const result = await chatbot.sendMessage("show me shoes");
    const [, init] = fetchStub.mock.calls[0] as [string, { body: string; credentials: "same-origin" | "omit" }];
    const parsedBody = JSON.parse(init.body) as { message: string; state?: { signals: Array<{ key?: string }> } };

    expect(init.credentials).toBe("same-origin");
    expect(parsedBody.message).toBe("show me shoes");
    expect(parsedBody.state?.signals.some((entry) => entry.key === "catalog")).toBe(true);
    expect((result.data as { credentials: string }).credentials).toBe("same-origin");
  });

  it("honors the kill switch and omits ambient credentials for external opt-in", async () => {
    const disabledFetch = vi.fn();
    const disabledChatbot = createAIChatbot({
      endpoint: "/api/chat",
      enabled: false,
      fetch: disabledFetch
    });

    await expect(disabledChatbot.sendMessage("hello")).rejects.toThrow("AI chatbot is disabled.");
    expect(disabledFetch).not.toHaveBeenCalled();

    const externalFetch = vi.fn(async (_input: string, init: { credentials: "same-origin" | "omit" }) => {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ credentials: init.credentials })
      };
    });

    const externalChatbot = createAIChatbot({
      endpoint: "https://assistant.example.com/chat",
      allowExternalEndpoint: true,
      fetch: externalFetch
    });

    const result = await externalChatbot.sendMessage("hello");

    expect(externalFetch).toHaveBeenCalledTimes(1);
    expect((result.data as { credentials: string }).credentials).toBe("omit");
  });
});
