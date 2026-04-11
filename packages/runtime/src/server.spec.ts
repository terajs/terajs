import { afterEach, describe, expect, it, vi } from "vitest";
import { setRuntimeMode } from "@terajs/reactivity";
import {
  executeServerFunction,
  server,
  setServerFunctionTransport,
  type ServerExecutionContext,
  type ServerFunctionCall
} from "./server";

describe("server", () => {
  afterEach(() => {
    setServerFunctionTransport(undefined);
    setRuntimeMode("client");
  });

  it("executes on the server with explicit request context", async () => {
    setRuntimeMode("server");

    const getGreeting = server(async (name: string, context: ServerExecutionContext) => {
      return `${context.request?.method}:${name}:${context.locals?.tenant}`;
    }, { id: "getGreeting" });

    await expect(
      executeServerFunction(getGreeting, {
        request: { method: "POST" },
        locals: { tenant: "docs" }
      }, "router")
    ).resolves.toBe("POST:router:docs");
  });

  it("uses the configured client transport outside the server runtime", async () => {
    setRuntimeMode("client");
    const invoke = vi.fn(async ({ id, args }: ServerFunctionCall) => `${id}:${String(args[0])}`);
    setServerFunctionTransport({ invoke });

    const getUser = server(async (id: string) => id.toUpperCase(), { id: "getUser" });
    await expect(getUser("42")).resolves.toBe("getUser:42");
    expect(invoke).toHaveBeenCalledWith({ id: "getUser", args: ["42"] });
  });

  it("fails clearly on the client when no transport is configured", async () => {
    setRuntimeMode("client");
    const getUser = server(async (id: string) => id, { id: "missingTransport" });

    await expect(getUser("42")).rejects.toThrow(
      'Terajs server(): no client transport is configured for server function "missingTransport".'
    );
  });
});