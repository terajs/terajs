import { describe, expect, it, vi } from "vitest";

import { Form, formDataToObject, type FormRenderState } from "./form";
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
        jsx("input", { name: "title", value: "nebula" }),
        jsx("button", { type: "submit", children: "Save" })
      ]
    }), root);

    const form = root.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(action).toHaveBeenCalledWith(expect.objectContaining({
      values: { title: "nebula" },
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