import { afterEach, describe, expect, it } from "vitest";

import { hasStyle, registerStyle, unregisterStyle } from "./styles.js";

describe("web style registry", () => {
  afterEach(() => {
    unregisterStyle("test:visible-style");
  });

  it("registers CSS that visibly affects rendered DOM and unregisters it", () => {
    const target = document.createElement("div");
    target.className = "terajs-visible-style-fixture";
    target.textContent = "Styled";
    document.body.appendChild(target);

    registerStyle(
      "test:visible-style",
      ".terajs-visible-style-fixture { color: rgb(255, 0, 0); }"
    );

    expect(hasStyle("test:visible-style")).toBe(true);
    expect(getComputedStyle(target).color).toBe("rgb(255, 0, 0)");

    unregisterStyle("test:visible-style");

    expect(hasStyle("test:visible-style")).toBe(false);

    target.remove();
  });
});
