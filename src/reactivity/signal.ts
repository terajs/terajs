import { currentEffect } from "./deps";
import type { ReactiveEffect } from "./deps";
import { scheduleEffect } from "./effect";
import { Debug } from "../debug/events";

/**
 * A reactive signal holding a value of type T.
 */
export interface Signal<T> {
    (): T;
    set(value: T): void;
    update(fn: (value: T) => T): void;
    _value: T;
    _dep: Set<ReactiveEffect>;
}

/**
 * Create a reactive signal.
 *
 * @param value - The initial value.
 */
export function signal<T>(value: T): Signal<T> {
    const sig = function () {
        if (currentEffect) {
            sig._dep.add(currentEffect);
            if (!currentEffect.deps.includes(sig._dep)) {
                currentEffect.deps.push(sig._dep);
            }

            Debug.emit("signal:link", {
                signal: sig,
                effect: currentEffect
            });
        }

        Debug.emit("signal:read", {
            signal: sig,
            value: sig._value
        });
        return sig._value;
    } as Signal<T>;


    sig._value = value;
    sig._dep = new Set<ReactiveEffect>();

    Debug.emit("signal:create", {
        signal: sig,
        initialValue: value
    });

    sig.set = (v: T) => {
        if (Object.is(v, sig._value)) return;
        const oldValue = sig._value;
        sig._value = v;

        Debug.emit("signal:update", {
            signal: sig,
            oldValue,
            newValue: v
        });

        const subs = Array.from(sig._dep); // snapshot
        for (const eff of subs) {
            scheduleEffect(eff);
        }
        Debug.emit("signal:update", { signal: sig, value: v });
    };

    sig.update = (fn) => sig.set(fn(sig._value));

    return sig;
}
