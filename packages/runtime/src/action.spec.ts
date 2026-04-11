import { describe, expect, it } from "vitest";
import { createAction } from "./action";
import { createMutationQueue } from "./queue/mutationQueue";

describe("createAction", () => {
  it("tracks pending, data, and success state", async () => {
    const action = createAction(async (value: string) => value.toUpperCase());

    const pending = action.run("tera");
    expect(action.pending()).toBe(true);
    await expect(pending).resolves.toBe("TERA");
    expect(action.pending()).toBe(false);
    expect(action.data()).toBe("TERA");
    expect(action.state()).toBe("success");
  });

  it("captures errors from the latest run", async () => {
    const action = createAction(async (value: string) => {
      if (value === "boom") {
        throw new Error("boom");
      }

      return value;
    });

    await expect(action.run("boom")).rejects.toThrow("boom");
    expect(action.pending()).toBe(false);
    expect(action.state()).toBe("error");
    expect(action.error()).toBeInstanceOf(Error);
  });

  it("keeps the latest successful result when older runs settle later", async () => {
    let resolveFirst: ((value: string) => void) | undefined;
    let resolveSecond: ((value: string) => void) | undefined;
    const action = createAction((value: string) => new Promise<string>((resolve) => {
      if (value === "first") {
        resolveFirst = resolve;
        return;
      }

      resolveSecond = resolve;
    }));

    const first = action.run("first");
    const second = action.run("second");

    resolveSecond?.("SECOND");
    await expect(second).resolves.toBe("SECOND");
    expect(action.data()).toBe("SECOND");
    expect(action.state()).toBe("success");

    resolveFirst?.("FIRST");
    await expect(first).resolves.toBe("FIRST");
    expect(action.data()).toBe("SECOND");
    expect(action.state()).toBe("success");
  });

  it("resets back to the initial state", async () => {
    const action = createAction(async () => "saved", {
      initialValue: "draft"
    });

    await action.run();
    expect(action.data()).toBe("saved");

    action.reset();

    expect(action.data()).toBe("draft");
    expect(action.state()).toBe("success");
    expect(action.error()).toBeUndefined();
  });

  it("queues failed runs when using runQueued", async () => {
    let offline = true;
    const action = createAction(async (value: string) => {
      if (offline) {
        throw new Error("offline");
      }

      return value.toUpperCase();
    }, {
      id: "profileSave"
    });
    const queue = await createMutationQueue({
      createId: () => "queued-1",
      now: () => 10
    });

    const outcome = await action.runQueued({ queue }, "tera");

    expect(outcome.status).toBe("queued");
    expect(action.state()).toBe("queued");
    expect(queue.pendingCount()).toBe(1);

    offline = false;
    const flushed = await queue.flush();

    expect(flushed.flushed).toBe(1);
    expect(queue.pendingCount()).toBe(0);
  });

  it("can opt out of queueing for selected errors", async () => {
    const action = createAction(async () => {
      throw new Error("fatal");
    }, {
      id: "fatalAction"
    });
    const queue = await createMutationQueue({
      now: () => 20
    });

    await expect(action.runQueued({
      queue,
      shouldQueue: () => false
    })).rejects.toThrow("fatal");

    expect(queue.pendingCount()).toBe(0);
    expect(action.state()).toBe("error");
  });
});