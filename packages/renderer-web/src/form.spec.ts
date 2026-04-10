import { describe, expect, it, vi } from "vitest";
import { createMutationQueue } from "@terajs/runtime";

import { Form, FormStatus, SubmitButton, formDataToObject, type FormRenderState } from "./form";
import { jsx } from "./jsx-runtime";
import { mount, unmount } from "./mount";

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Form", () => {
  it("serializes fields for enhanced action handlers and updates state attributes", async () => {
    let resolveSubmit: ((value: string) => void) | undefined;
    const action = vi.fn(() => new Promise<string>((resolve) => {
      resolveSubmit = resolve;
    }));
    const root = document.createElement("div");

    mount(() => Form({
      action,
      children: [
        jsx("input", { name: "title", value: "terajs" }),
        jsx("button", { type: "submit", children: "Save" })
      ]
    }), root);

    const form = root.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(action).toHaveBeenCalledWith(expect.objectContaining({
      values: { title: "terajs" },
      method: "GET"
    }));
    expect(form.getAttribute("data-state")).toBe("pending");
    expect(form.getAttribute("data-pending")).toBe("true");
    expect(form.getAttribute("aria-busy")).toBe("true");

    resolveSubmit?.("saved");
    await flush();

    expect(form.getAttribute("data-state")).toBe("success");
    expect(form.getAttribute("data-pending")).toBeNull();
    expect(form.getAttribute("aria-busy")).toBeNull();

    unmount(root);
  });

  it("supports reactive render-prop children during submission", async () => {
    let resolveSubmit: (() => void) | undefined;
    const root = document.createElement("div");

    mount(() => Form({
      action: () => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      }),
      children: ({ pending, state }: FormRenderState<void>) => [
        jsx("input", { name: "email", value: "hello@tera.dev" }),
        jsx("button", {
          type: "submit",
          disabled: () => pending(),
          "data-state": () => state(),
          children: "Send"
        })
      ]
    }), root);

    const form = root.querySelector("form") as HTMLFormElement;
    const button = root.querySelector("button") as HTMLButtonElement;

    expect(button.disabled).toBe(false);
    expect(button.getAttribute("data-state")).toBe("idle");

    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("data-state")).toBe("pending");

    resolveSubmit?.();
    await flush();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute("data-state")).toBe("success");

    unmount(root);
  });

  it("resets the form after successful submission when requested", async () => {
    const root = document.createElement("div");

    mount(() => Form({
      action: async () => "saved",
      resetOnSuccess: true,
      children: [
        jsx("input", { name: "title" }),
        jsx("button", { type: "submit", children: "Save" })
      ]
    }), root);

    const form = root.querySelector("form") as HTMLFormElement;
    const input = root.querySelector("input") as HTMLInputElement;
    input.value = "draft";

    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(input.value).toBe("");

    unmount(root);
  });

  it("binds SubmitButton and FormStatus helpers to the nearest enhanced form", async () => {
    let resolveSubmit: (() => void) | undefined;
    const root = document.createElement("div");

    mount(() => Form({
      action: () => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      }),
      children: [
        jsx("input", { name: "title", value: "terajs" }),
        SubmitButton({ children: "Save" }),
        FormStatus({ idle: "idle", pending: "saving", success: "saved" })
      ]
    }), root);

    const form = root.querySelector("form") as HTMLFormElement;
    const button = root.querySelector("button") as HTMLButtonElement;

    await flush();
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("data-state")).toBe("idle");
    expect(root.textContent).toContain("idle");

    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("data-state")).toBe("pending");
    expect(root.textContent).toContain("saving");

    resolveSubmit?.();
    await flush();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute("data-state")).toBe("success");
    expect(root.textContent).toContain("saved");

    unmount(root);
  });

  it("renders error status helpers after failed submission", async () => {
    const root = document.createElement("div");

    mount(() => Form({
      action: async () => {
        throw new Error("save failed");
      },
      children: [
        SubmitButton({ children: "Save" }),
        FormStatus({
          idle: "idle",
          error: (error: unknown) => error instanceof Error ? error.message : String(error)
        })
      ]
    }), root);

    const form = root.querySelector("form") as HTMLFormElement;
    const button = root.querySelector("button") as HTMLButtonElement;

    await flush();
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute("data-state")).toBe("error");
    expect(root.textContent).toContain("save failed");

    unmount(root);
  });

  it("queues enhanced submissions when queue integration is enabled", async () => {
    let offline = true;
    const queued = vi.fn();
    const queue = await createMutationQueue({
      createId: () => "form-q-1",
      now: () => 1_000
    });
    const root = document.createElement("div");

    mount(() => Form({
      action: async () => {
        if (offline) {
          throw new Error("offline");
        }

        return "saved";
      },
      queue,
      queueType: "form:save",
      onQueued: queued,
      children: [
        jsx("input", { name: "title", value: "terajs" }),
        SubmitButton({ children: "Save" }),
        FormStatus({ idle: "idle", queued: "queued", success: "saved" } as any)
      ]
    }), root);

    const form = root.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await flush();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(form.getAttribute("data-state")).toBe("queued");
    expect(queue.pendingCount()).toBe(1);
    expect(queued).toHaveBeenCalledTimes(1);

    offline = false;
    const flushed = await queue.flush();
    expect(flushed.flushed).toBe(1);
    expect(queue.pendingCount()).toBe(0);

    unmount(root);
  });
});

describe("formDataToObject", () => {
  it("collects duplicate keys into arrays", () => {
    const formData = new FormData();
    formData.append("tag", "tera");
    formData.append("tag", "router");

    expect(formDataToObject(formData)).toEqual({
      tag: ["tera", "router"]
    });
  });
});