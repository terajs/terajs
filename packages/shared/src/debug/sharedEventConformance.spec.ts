import { afterEach, describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";

import { signal } from "../../../reactivity/src/index.js";
import type { RouteDefinition } from "../../../router/src/definition.js";
import { createMemoryHistory, createRouter } from "../../../router/src/runtime.js";
import { createMutationQueue } from "../../../runtime/src/queue/mutationQueue.js";
import {
  createAndroidWireTransport,
  type AndroidBridgeElementNode,
} from "../../../renderer-android/src/index.js";

import { clearDebugHistory, readDebugHistory } from "./history.js";
import { normalizeSharedDebugEvent } from "./sharedEventSchema.js";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.tera",
    component: async () => ({ default: null }),
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: {},
    layouts: [],
    ...overrides
  };
}

function getSharedEvents() {
  return readDebugHistory().flatMap((event) => {
    const normalized = normalizeSharedDebugEvent(event);
    return normalized ? [normalized] : [];
  });
}

afterEach(() => {
  clearDebugHistory();
});

describe("shared debug event conformance", () => {
  it("normalizes real state, route, and queue producers into the shared schema", async () => {
    clearDebugHistory();

    const count = signal(1);
    count.set(2);

    const router = createRouter(
      [
        route({ path: "/", filePath: "/pages/index.tera" }),
        route({ id: "docs", path: "/docs", filePath: "/pages/docs.tera" })
      ],
      { history: createMemoryHistory("/") }
    );
    await router.start();
    await router.navigate("/docs");

    const queue = await createMutationQueue({
      createId: () => "m1",
      now: () => 100
    });
    queue.register("profile:update", () => undefined);
    await queue.enqueue({
      type: "profile:update",
      payload: { name: "Ada" }
    });
    await queue.flush();

    const events = getSharedEvents();

    expect(events.find((event) => event.type === "reactive:updated")?.payload).toMatchObject({
      next: 2
    });
    expect(events.find((event) => event.type === "route:navigate:start" && event.payload.to === "/docs")?.payload).toMatchObject({
      to: "/docs"
    });
    expect(events.find((event) => event.type === "route:changed" && event.payload.to === "/docs")?.payload).toMatchObject({
      to: "/docs"
    });
    expect(events.find((event) => event.type === "queue:enqueue")?.payload).toMatchObject({
      id: "m1",
      type: "profile:update"
    });
    expect(events.find((event) => event.type === "queue:flush")?.payload).toMatchObject({
      flushed: 1,
      pending: 0
    });
  });

  it("normalizes Android bridge transport diagnostics into the shared schema", () => {
    clearDebugHistory();

    const transport = createAndroidWireTransport();
    expect(transport.drainCommandBatchPayload()).not.toBeNull();

    const value = signal("Alpha");
    const onInput = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "input",
      props: [
        {
          kind: "bind",
          name: "value",
          value: "value",
          binding: {
            kind: "simple-path",
            segments: ["value"]
          }
        },
        {
          kind: "event",
          name: "input",
          value: "onInput"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = transport.session.mountIRNode(node, { value, onInput }) as AndroidBridgeElementNode;
    transport.drainCommandBatchPayload();
    transport.dispatchNativeEventPacket({
      nodeId: rendered.id,
      name: "textInput",
      payload: { value: "Beta" }
    });

    expect(onInput).toHaveBeenCalledWith({ text: "Beta", value: "Beta" });

    const events = getSharedEvents();

    expect(events.find((event) => event.type === "bridge:commands")?.payload).toMatchObject({
      target: "android",
      direction: "js-to-host",
      commandCount: expect.any(Number)
    });
    expect(events.find((event) => event.type === "bridge:event")?.payload).toMatchObject({
      target: "android",
      direction: "host-to-js",
      eventName: "textInput",
      nodeId: rendered.id
    });
  });
});