import { effect } from "@terajs/reactivity";
import { emitRendererDebug } from "./debug.js";
import { unwrap } from "./unwrap.js";
function isRefSource(value) {
    return typeof value === "object"
        && value !== null
        && "_sig" in value;
}
function disposeDirectSubscriber(dep, subscriber) {
    dep.delete(subscriber);
    subscriber.active = false;
}
export function createHostBindings(runtime, options = {}) {
    const setDirectTextValue = options.setDirectTextValue ?? runtime.setText;
    function subscribeTextSource(node, source) {
        const signalSource = isRefSource(source) ? source._sig : source;
        const dep = signalSource._dep;
        const subscriber = (() => {
            setDirectTextValue(node, signalSource._value);
        });
        subscriber.active = true;
        dep.add(subscriber);
        runtime.addNodeCleanup(node, () => {
            disposeDirectSubscriber(dep, subscriber);
        });
        setDirectTextValue(node, signalSource._value);
    }
    function subscribePropSource(el, name, source) {
        const signalSource = isRefSource(source) ? source._sig : source;
        const dep = signalSource._dep;
        const subscriber = (() => {
            if (subscriber.active === false) {
                return;
            }
            runtime.setProp(el, name, signalSource._value);
        });
        subscriber.active = true;
        dep.add(subscriber);
        runtime.addNodeCleanup(el, () => {
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
                const resolved = {};
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
