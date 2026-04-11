import { describe, it, expect } from "vitest";
import { jsx } from "./jsx-runtime";
import { template } from "./template";
import { createText } from "./dom";
import { reactive } from "@terajs/reactivity";

describe("JSX nested reactive objects", () => {
    it("updates when nested reactive values change via template()", () => {
        const user = reactive({
            address: { city: "Beaverton" }
        });

        const el = jsx("div", {
            children: template(() => createText(user.address.city))
        }) as HTMLElement;

        expect(el.textContent).toBe("Beaverton");

        user.address.city = "Portland";
        expect(el.textContent).toBe("Portland");
    });
});

