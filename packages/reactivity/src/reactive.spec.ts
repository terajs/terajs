import { describe, it, expect } from "vitest";
import { reactive } from "./reactive";
import { effect } from "./effect";

describe("reactive()", () => {
    it("tracks primitive properties", () => {
        const user = reactive({ name: "Gabriel" });
        let calls = 0;

        effect(() => {
            user.name;
            calls++;
        });

        expect(calls).toBe(1);

        user.name = "Terajs";
        expect(calls).toBe(2);
    });

    it("tracks nested properties", () => {
        const user = reactive({
            address: { city: "Beaverton" }
        });

        let calls = 0;

        effect(() => {
            user.address.city;
            calls++;
        });

        expect(calls).toBe(1);

        user.address.city = "Portland";
        expect(calls).toBe(2);
    });

    it("reacts to new properties added later", () => {
        const obj = reactive({});

        let calls = 0;

        effect(() => {
            (obj as any).foo;
            calls++;
        });

        expect(calls).toBe(1);

        (obj as any).foo = 123;
        expect(calls).toBe(2);
    });

    it("supports nested reactive objects added later", () => {
        const obj = reactive({});

        let calls = 0;

        effect(() => {
            (obj as any).nested?.value;
            calls++;
        });

        expect(calls).toBe(1);

        (obj as any).nested = { value: 1 };
        expect(calls).toBe(2);

        (obj as any).nested.value = 2;
        expect(calls).toBe(3);
    });
});
