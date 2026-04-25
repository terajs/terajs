import type { ReactiveMetadata, ReactiveType } from "@terajs/shared";

export const debugInstrumentationEnabled = process.env.NODE_ENV !== "production";

const metadataPlaceholders: Record<ReactiveType, ReactiveMetadata> = {
  ref: Object.freeze({
    rid: "",
    type: "ref",
    scope: "",
    instance: 0,
    createdAt: 0
  }),
  signal: Object.freeze({
    rid: "",
    type: "signal",
    scope: "",
    instance: 0,
    createdAt: 0
  }),
  reactive: Object.freeze({
    rid: "",
    type: "reactive",
    scope: "",
    instance: 0,
    createdAt: 0
  }),
  shallowReactive: Object.freeze({
    rid: "",
    type: "shallowReactive",
    scope: "",
    instance: 0,
    createdAt: 0
  }),
  readonly: Object.freeze({
    rid: "",
    type: "readonly",
    scope: "",
    instance: 0,
    createdAt: 0
  }),
  computed: Object.freeze({
    rid: "",
    type: "computed",
    scope: "",
    instance: 0,
    createdAt: 0
  }),
  effect: Object.freeze({
    rid: "",
    type: "effect",
    scope: "",
    instance: 0,
    createdAt: 0
  })
};

export function getProductionMetadataPlaceholder(type: ReactiveType): ReactiveMetadata {
  return metadataPlaceholders[type];
}