import { contract } from "./dx/contract";
import { ref } from "./ref";
import { effect } from "./effect";
import { describe, test, expect } from "vitest";

describe("contract()", () => {
    test("freezes the contract shape", () => {
        const ui = contract({ a: ref(1) });

        expect(Object.isFrozen(ui)).toBe(true);

        // @ts-expect-error shape is frozen
        expect(() => (ui.b = 2)).toThrow();
    });

    test("does not auto-wrap primitives", () => {
        const ui = contract({
            name: "Gabriel",
            count: 0
        });

        expect(ui.name).toBe("Gabriel");
        expect(ui.count).toBe(0);
    });

    test("reactive values inside remain reactive", () => {
        const name = ref("Gabriel");
        const ui = contract({ name });

        let runs = 0;
        effect(() => {
            ui.name.value;
            runs++;
        });

        expect(runs).toBe(1);

        ui.name.value = "Terajs";
        expect(runs).toBe(2);
    });
});

describe("contract.reactive()", () => {
    test("wraps primitive values in refs", () => {
        const ui = contract.reactive({
            name: "Gabriel",
            count: 0
        });

        expect(ui.name.value).toBe("Gabriel");
        expect(ui.count.value).toBe(0);
    });

    test("leaves objects, functions, and refs untouched", () => {
        const existing = ref(5);

        const ui = contract.reactive({
            existing,
            obj: { x: 1 },
            fn: () => 123
        });

        expect(ui.existing).toBe(existing);
        expect(ui.obj).toEqual({ x: 1 });
        expect(typeof ui.fn).toBe("function");
    });

    test("reactive primitives update correctly", () => {
        const ui = contract.reactive({
            count: 0
        });

        let runs = 0;
        effect(() => {
            ui.count.value;
            runs++;
        });

        expect(runs).toBe(1);

        ui.count.value = 10;
        expect(runs).toBe(2);
    });

    test("shape is frozen but reactive values are mutable", () => {
        const ui = contract.reactive({
            count: 0
        });

        expect(Object.isFrozen(ui)).toBe(true);

        // @ts-expect-error shape is frozen
        expect(() => (ui.newProp = 123)).toThrow();

        // but reactive values still update
        ui.count.value = 5;
        expect(ui.count.value).toBe(5);
    });
});
