import { afterEach, describe, expect, it, vi } from "vitest";
import { setHydrationState } from "./hydration";
import { setRuntimeMode } from "@terajs/reactivity";
import {
  createResource,
  createFetchServerFunctionTransport,
  createServerFunctionRequestHandler,
  invalidateResources,
  server,
  type ServerFunctionCall
} from "./index";

describe("server transport", () => {
  afterEach(() => {
    setRuntimeMode("client");
    setHydrationState({});
  });

  it("sends server calls through the configured fetch transport", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({
        ok: true,
        result: {
          echoed: init?.body ? JSON.parse(String(init.body)) : null
        }
      }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    });

    const transport = createFetchServerFunctionTransport({
      endpoint: "/_terajs/server",
      fetch: fetchMock,
      headers: {
        "x-terajs": "1"
      }
    });

    await expect(transport.invoke({ id: "getUser", args: ["42"] })).resolves.toEqual({
      echoed: {
        id: "getUser",
        args: ["42"]
      }
    });
    expect(fetchMock).toHaveBeenCalledWith("/_terajs/server", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-terajs": "1"
      })
    }));
  });

  it("handles HTTP requests by dispatching registered server functions", async () => {
    setRuntimeMode("server");
    const getTenant = server(async (name: string, context) => {
      return `${name}:${context.request?.cookies?.tenant}:${String(context.locals?.region)}`;
    }, { id: "getTenant" });

    expect(getTenant.id).toBe("getTenant");

    const handler = createServerFunctionRequestHandler({
      context: {
        locals: {
          region: "us"
        }
      }
    });

    const response = await handler(new Request("https://terajs.local/_terajs/server", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "tenant=docs"
      },
      body: JSON.stringify({
        id: "getTenant",
        args: ["router"]
      } satisfies ServerFunctionCall)
    }));

    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: "router:docs:us",
      invalidated: []
    });
  });

  it("returns invalidated resource keys from server mutations", async () => {
    setRuntimeMode("server");
    const updatePost = server(async () => {
      await invalidateResources(["posts", "dashboard"]);
      return "updated";
    }, { id: "updatePost" });

    expect(updatePost.id).toBe("updatePost");

    const handler = createServerFunctionRequestHandler();
    const response = await handler(new Request("https://terajs.local/_terajs/server", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: "updatePost",
        args: []
      } satisfies ServerFunctionCall)
    }));

    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: "updated",
      invalidated: ["posts", "dashboard"]
    });
  });

  it("returns a structured not-found response for unknown server functions", async () => {
    setRuntimeMode("server");
    const handler = createServerFunctionRequestHandler();
    const response = await handler(new Request("https://terajs.local/_terajs/server", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: "missing",
        args: []
      } satisfies ServerFunctionCall)
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        message: 'Unknown server function "missing".'
      }
    });
  });

  it("applies invalidated resource keys on the client transport", async () => {
    setRuntimeMode("client");
    let version = 0;
    const resource = createResource(async () => {
      version += 1;
      return `post-${version}`;
    }, {
      key: "posts"
    });

    await resource.promise();
    expect(resource.data()).toBe("post-1");

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      result: "updated",
      invalidated: ["posts"]
    }), {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    }));

    const transport = createFetchServerFunctionTransport({
      endpoint: "/_terajs/server",
      fetch: fetchMock
    });

    await expect(transport.invoke({ id: "updatePost", args: [] })).resolves.toBe("updated");
    expect(resource.data()).toBe("post-2");
  });
});