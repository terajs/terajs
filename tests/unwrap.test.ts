import { describe, it, expect } from "vitest";
import { unwrap } from "../src/renderer/unwrap";
import { signal } from "../src/reactivity/signal";
import { ref } from "../src/reactivity/ref";
import { reactive } from "../src/reactivity/reactive";

describe("unwrap()", () => {
    it("unwraps signals", () => {
        const count = signal(1);
        expect(unwrap(count)).toBe(1);
    });

    it("unwraps boxed signals", () => {
        const count = ref(2);
        expect(unwrap(() => count.value)).toBe(2);
    });

    it("unwraps reactive object properties", () => {
        const user = reactive({ name: "Gabriel" });
        expect(unwrap(() => user.name)).toBe("Gabriel");
    });

    it("unwraps nested reactive values", () => {
        const user = reactive({ address: { city: "Beaverton" } });
        expect(unwrap(() => user.address.city)).toBe("Beaverton");
    });

    it("unwraps accessor functions", () => {
        const fn = () => 42;
        expect(unwrap(fn)).toBe(42);
    });
});
