import { emitRendererDebug } from "./debug.js";
export function unwrap(value) {
    if (value && typeof value === "object" && "_sig" in value) {
        const out = value._sig();
        emitRendererDebug("unwrap:ref", () => ({
            input: value,
            output: out
        }));
        return out;
    }
    if (typeof value === "function" && "_dep" in value && "_value" in value) {
        const out = value();
        emitRendererDebug("unwrap:signal", () => ({
            input: value,
            output: out
        }));
        return out;
    }
    if (typeof value === "function") {
        const out = value();
        emitRendererDebug("unwrap:accessor", () => ({
            input: value,
            output: out
        }));
        return out;
    }
    emitRendererDebug("unwrap:raw", () => ({
        input: value,
        output: value
    }));
    return value;
}
