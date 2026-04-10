import { Debug, type ServerContext } from "@terajs/shared";
import { invalidateResources } from "./invalidation.js";
import {
  executeServerFunctionCallWithMetadata,
  type ServerFunctionCall,
  type ServerFunctionTransport
} from "./server.js";

export interface ServerFunctionSuccessResponse<TResult = unknown> {
  ok: true;
  result: TResult;
  invalidated?: string[];
}

export interface ServerFunctionErrorResponse {
  ok: false;
  error: {
    message: string;
  };
}

export type ServerFunctionResponse<TResult = unknown> =
  | ServerFunctionSuccessResponse<TResult>
  | ServerFunctionErrorResponse;

export interface FetchServerFunctionTransportOptions {
  endpoint?: string;
  fetch?: typeof fetch;
  credentials?: RequestCredentials;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
}

export interface ServerFunctionRequestHandlerOptions {
  context?: ServerContext | ((request: Request, call: ServerFunctionCall) => ServerContext | Promise<ServerContext>);
}

function createJsonResponse(body: ServerFunctionResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {};

  headers.forEach((value, key) => {
    normalized[key] = value;
  });

  return normalized;
}

function parseCookies(header: string | null): Record<string, string> | undefined {
  if (!header) {
    return undefined;
  }

  const cookies: Record<string, string> = {};

  for (const part of header.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name) {
      continue;
    }

    cookies[name] = decodeURIComponent(valueParts.join("="));
  }

  return Object.keys(cookies).length > 0 ? cookies : undefined;
}

export async function readServerFunctionCall(request: Pick<Request, "json">): Promise<ServerFunctionCall> {
  const payload = await request.json() as Partial<ServerFunctionCall>;

  if (typeof payload.id !== "string" || !Array.isArray(payload.args)) {
    throw new Error("Invalid server function payload.");
  }

  return {
    id: payload.id,
    args: payload.args
  };
}

export function createServerContextFromRequest(
  request: Pick<Request, "url" | "method" | "headers">,
  base: ServerContext = {}
): ServerContext {
  const headers = normalizeHeaders(request.headers);

  return {
    ...base,
    request: {
      url: request.url,
      method: request.method,
      headers,
      cookies: parseCookies(request.headers.get("cookie"))
    }
  };
}

export function createFetchServerFunctionTransport(
  options: FetchServerFunctionTransportOptions = {}
): ServerFunctionTransport {
  const endpoint = options.endpoint ?? "/_terajs/server";
  const fetchImpl = options.fetch ?? fetch;

  return {
    invoke: async (call) => {
      const extraHeaders = typeof options.headers === "function"
        ? await options.headers()
        : options.headers;
      const response = await fetchImpl(endpoint, {
        method: "POST",
        credentials: options.credentials,
        headers: {
          "content-type": "application/json",
          ...(extraHeaders ?? {})
        },
        body: JSON.stringify(call)
      });
      const payload = await response.json() as ServerFunctionResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? `Server function request failed with status ${response.status}.` : payload.error.message);
      }

      if (Array.isArray(payload.invalidated) && payload.invalidated.length > 0) {
        try {
          await invalidateResources(payload.invalidated);
        } catch (error) {
          Debug.emit("resource:error", {
            source: payload.invalidated,
            error: error instanceof Error ? error.message : error
          });
        }
      }

      return payload.result;
    }
  };
}

export async function handleServerFunctionRequest(
  request: Request,
  options: ServerFunctionRequestHandlerOptions = {}
): Promise<Response> {
  if (request.method !== "POST") {
    return createJsonResponse({
      ok: false,
      error: {
        message: "Method not allowed."
      }
    }, 405);
  }

  try {
    const call = await readServerFunctionCall(request);
    const baseContext = typeof options.context === "function"
      ? await options.context(request, call)
      : (options.context ?? {});
    const context = createServerContextFromRequest(request, baseContext);
    const execution = await executeServerFunctionCallWithMetadata(call, context);

    return createJsonResponse({ ok: true, result: execution.result, invalidated: execution.invalidated }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server function request failed.";
    const status = message === "Invalid server function payload." ? 400
      : message.startsWith("Unknown server function") ? 404
      : 500;

    Debug.emit("server:function:error", {
      id: "http",
      message
    });

    return createJsonResponse({
      ok: false,
      error: {
        message
      }
    }, status);
  }
}

export function createServerFunctionRequestHandler(
  options: ServerFunctionRequestHandlerOptions = {}
): (request: Request) => Promise<Response> {
  return (request: Request) => handleServerFunctionRequest(request, options);
}