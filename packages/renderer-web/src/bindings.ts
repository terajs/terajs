/**
 * @file bindings.ts
 * @description
 * Fine-grained DOM bindings for Terajs's reactive renderer.
 */

import { effect, type ReactiveEffect, type Ref, type Signal } from "@terajs/reactivity";

import { emitRendererDebug } from "./debug.js";
import {
    addEvent,
    addNodeCleanup,
    removeEvent,
    setClass,
    setProp,
    setStyle,
    setText,
} from "./dom.js";
import { unwrap } from "./unwrap.js";

type DirectSubscriber = ReactiveEffect & {
    active: boolean;
};

const shouldDebugBindings = process.env.NODE_ENV !== "production";

const setDirectTextValue: (node: Text, value: unknown) => void = process.env.NODE_ENV !== "production"
    ? setText
    : (node, value) => {
        node.data = String(value);
    };

function isRefSource(value: unknown): value is Ref<unknown> {
    return typeof value === "object"
        && value !== null
        && "_sig" in value;
}

function disposeDirectSubscriber(dep: Set<ReactiveEffect>, subscriber: DirectSubscriber): void {
    dep.delete(subscriber);
    subscriber.active = false;
}

function subscribeTextSource(node: Text, source: Signal<unknown> | Ref<unknown>): void {
    const signalSource = isRefSource(source) ? source._sig : source;
    const dep = signalSource._dep;

    const subscriber = process.env.NODE_ENV !== "production"
        ? (() => {
            setText(node, signalSource._value);
        }) as DirectSubscriber
        : (() => {
            node.data = String(signalSource._value);
        }) as DirectSubscriber;

    subscriber.active = true;

    dep.add(subscriber);

    addNodeCleanup(node, () => {
        disposeDirectSubscriber(dep, subscriber);
    });

    setDirectTextValue(node, signalSource._value);
}

function subscribePropSource(el: Element, name: string, source: Signal<unknown> | Ref<unknown>): void {
    const signalSource = isRefSource(source) ? source._sig : source;
    const dep = signalSource._dep;

    const subscriber = (() => {
        if (subscriber.active === false) {
            return;
        }

        setProp(el, name, signalSource._value);
    }) as DirectSubscriber;

    subscriber.active = true;

    dep.add(subscriber);

    addNodeCleanup(el, () => {
        disposeDirectSubscriber(dep, subscriber);
    });

    setProp(el, name, signalSource._value);
}

export function bindText(node: Text, compute: () => any): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:create", () => ({
            type: "text",
            node,
        }));
    }

    effect(() => {
        const value = unwrap(compute());

        if (shouldDebugBindings) {
            emitRendererDebug("binding:update", () => ({
                type: "text",
                node,
                value,
            }));
        }

        setText(node, value);
    });
}

export function bindDirectTextSource(node: Text, source: Signal<unknown> | Ref<unknown>): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:create", () => ({
            type: "text:direct",
            node,
            sourceType: isRefSource(source) ? "ref" : "signal",
        }));
    }

    subscribeTextSource(node, source);
}

export function bindDirectPropSource(el: Element, name: string, source: Signal<unknown> | Ref<unknown>): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:create", () => ({
            type: "prop:direct",
            el,
            name,
            sourceType: isRefSource(source) ? "ref" : "signal",
        }));
    }

    subscribePropSource(el, name, source);
}

export function bindProp(el: Element, name: string, compute: () => any): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:create", () => ({
            type: "prop",
            el,
            name,
        }));
    }

    effect(() => {
        const value = unwrap(compute());

        if (shouldDebugBindings) {
            emitRendererDebug("binding:update", () => ({
                type: "prop",
                el,
                name,
                value,
            }));
        }

        setProp(el, name, value);
    });
}

export function bindClass(el: Element, compute: () => any): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:create", () => ({
            type: "class",
            el,
        }));
    }

    effect(() => {
        const value = unwrap(compute());

        if (shouldDebugBindings) {
            emitRendererDebug("binding:update", () => ({
                type: "class",
                el,
                value,
            }));
        }

        setClass(el, value);
    });
}

export function bindStyle(el: Element, compute: () => Record<string, any>): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:create", () => ({
            type: "style",
            el,
        }));
    }

    effect(() => {
        const styleObj = unwrap(compute());
        const resolved: Record<string, string> = {};

        for (const key in styleObj) {
            resolved[key] = unwrap(styleObj[key]);
        }

        if (shouldDebugBindings) {
            emitRendererDebug("binding:update", () => ({
                type: "style",
                el,
                value: resolved,
            }));
        }

        setStyle(el, resolved);
    });
}

export function bindEvent(el: Element, name: string, handler: EventListener): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:create", () => ({
            type: "event",
            el,
            name,
            handler,
        }));
    }

    addEvent(el, name, handler);
}

export function unbindEvent(el: Element, name: string, handler: EventListener): void {
    if (shouldDebugBindings) {
        emitRendererDebug("binding:dispose", () => ({
            type: "event",
            el,
            name,
            handler,
        }));
    }

    removeEvent(el, name, handler);
}
