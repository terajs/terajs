import type { RendererEventHandler } from "@terajs/renderer";
import { effect, type ReactiveEffect, type Ref, type Signal } from "@terajs/reactivity";

import { emitRendererDebug } from "./debug.js";
import { unwrap } from "./unwrap.js";

type DirectSubscriber = ReactiveEffect & {
    active: boolean;
};

export interface HostBindingRuntime<NodeLike, ElementLike extends NodeLike = NodeLike, TextLike extends NodeLike = NodeLike> {
    addEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    addNodeCleanup(node: NodeLike, cleanup: () => void): void;
    removeEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    setClass(el: ElementLike, className: string): void;
    setProp(el: ElementLike, name: string, value: any): void;
    setStyle(el: ElementLike, style: Record<string, string>): void;
    setText(node: TextLike, value: any): void;
}

export interface HostBindingOptions<TextLike> {
    setDirectTextValue?: (node: TextLike, value: unknown) => void;
}

export interface HostBindings<ElementLike, TextLike> {
    bindText(node: TextLike, compute: () => any): void;
    bindDirectTextSource(node: TextLike, source: Signal<unknown> | Ref<unknown>): void;
    bindDirectPropSource(el: ElementLike, name: string, source: Signal<unknown> | Ref<unknown>): void;
    bindProp(el: ElementLike, name: string, compute: () => any): void;
    bindClass(el: ElementLike, compute: () => any): void;
    bindStyle(el: ElementLike, compute: () => Record<string, any>): void;
    bindEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    unbindEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
}

function isRefSource(value: unknown): value is Ref<unknown> {
    return typeof value === "object"
        && value !== null
        && "_sig" in value;
}

function disposeDirectSubscriber(dep: Set<ReactiveEffect>, subscriber: DirectSubscriber): void {
    dep.delete(subscriber);
    subscriber.active = false;
}

export function createHostBindings<NodeLike, ElementLike extends NodeLike = NodeLike, TextLike extends NodeLike = NodeLike>(
    runtime: HostBindingRuntime<NodeLike, ElementLike, TextLike>,
    options: HostBindingOptions<TextLike> = {}
): HostBindings<ElementLike, TextLike> {
    const setDirectTextValue = options.setDirectTextValue ?? runtime.setText;

    function subscribeTextSource(node: TextLike, source: Signal<unknown> | Ref<unknown>): void {
        const signalSource = isRefSource(source) ? source._sig : source;
        const dep = signalSource._dep;

        const subscriber = (() => {
            setDirectTextValue(node, signalSource._value);
        }) as DirectSubscriber;

        subscriber.active = true;

        dep.add(subscriber);

        runtime.addNodeCleanup(node as NodeLike, () => {
            disposeDirectSubscriber(dep, subscriber);
        });

        setDirectTextValue(node, signalSource._value);
    }

    function subscribePropSource(el: ElementLike, name: string, source: Signal<unknown> | Ref<unknown>): void {
        const signalSource = isRefSource(source) ? source._sig : source;
        const dep = signalSource._dep;

        const subscriber = (() => {
            if (subscriber.active === false) {
                return;
            }

            runtime.setProp(el, name, signalSource._value);
        }) as DirectSubscriber;

        subscriber.active = true;

        dep.add(subscriber);

        runtime.addNodeCleanup(el as NodeLike, () => {
            disposeDirectSubscriber(dep, subscriber);
        });

        runtime.setProp(el, name, signalSource._value);
    }

    return {
        bindText(node, compute) {
            emitRendererDebug("binding:create", () => ({
                type: "text",
                node,
            }));

            effect(() => {
                const value = unwrap(compute());

                emitRendererDebug("binding:update", () => ({
                    type: "text",
                    node,
                    value,
                }));

                runtime.setText(node, value);
            });
        },
        bindDirectTextSource(node, source) {
            emitRendererDebug("binding:create", () => ({
                type: "text:direct",
                node,
                sourceType: isRefSource(source) ? "ref" : "signal",
            }));

            subscribeTextSource(node, source);
        },
        bindDirectPropSource(el, name, source) {
            emitRendererDebug("binding:create", () => ({
                type: "prop:direct",
                el,
                name,
                sourceType: isRefSource(source) ? "ref" : "signal",
            }));

            subscribePropSource(el, name, source);
        },
        bindProp(el, name, compute) {
            emitRendererDebug("binding:create", () => ({
                type: "prop",
                el,
                name,
            }));

            effect(() => {
                const value = unwrap(compute());

                emitRendererDebug("binding:update", () => ({
                    type: "prop",
                    el,
                    name,
                    value,
                }));

                runtime.setProp(el, name, value);
            });
        },
        bindClass(el, compute) {
            emitRendererDebug("binding:create", () => ({
                type: "class",
                el,
            }));

            effect(() => {
                const value = unwrap(compute());

                emitRendererDebug("binding:update", () => ({
                    type: "class",
                    el,
                    value,
                }));

                runtime.setClass(el, value);
            });
        },
        bindStyle(el, compute) {
            emitRendererDebug("binding:create", () => ({
                type: "style",
                el,
            }));

            effect(() => {
                const styleObj = unwrap(compute());
                const resolved: Record<string, string> = {};

                for (const key in styleObj) {
                    resolved[key] = unwrap(styleObj[key]);
                }

                emitRendererDebug("binding:update", () => ({
                    type: "style",
                    el,
                    value: resolved,
                }));

                runtime.setStyle(el, resolved);
            });
        },
        bindEvent(el, name, handler) {
            emitRendererDebug("binding:create", () => ({
                type: "event",
                el,
                name,
                handler,
            }));

            runtime.addEvent(el, name, handler);
        },
        unbindEvent(el, name, handler) {
            emitRendererDebug("binding:dispose", () => ({
                type: "event",
                el,
                name,
                handler,
            }));

            runtime.removeEvent(el, name, handler);
        }
    };
}
