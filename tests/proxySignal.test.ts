import { describe, it, expect } from "vitest";
import { ref } from "../src/reactivity/ref";
import { effect } from "../src/reactivity/effect";

describe("ref()", () => {
    it("reads and writes through .value", () => {
        const count = ref(1);
        expect(count.value).toBe(1);

        count.value = 2;
        expect(count.value).toBe(2);
    });

    it("triggers effects when .value changes", () => {
        const count = ref(0);
        let calls = 0;

        effect(() => {
            count.value;
            calls++;
        });

        expect(calls).toBe(1);

        count.value = 1;
        expect(calls).toBe(2);
    });

    it("does not trigger effects when value is unchanged", () => {
        const count = ref(5);
        let calls = 0;

        effect(() => {
            count.value;
            calls++;
        });

        expect(calls).toBe(1);

        count.value = 5;
        expect(calls).toBe(1);
    });
});
