import { describe, expect, it } from "vitest";

import { annotateRuntimeDebugNames } from "./annotateRuntimeDebugNames.js";

describe("annotateRuntimeDebugNames", () => {
  it("injects stable names for top-level computed, watch, and watchEffect bindings", () => {
    const source = [
      "const doubledRef = computed(() => countRef() * stepRef())",
      "const stopDoubledWatch = watch(() => doubledRef.get(), (next, prev) => {",
      "  watchSummaryRef.set(`${prev} -> ${next}`)",
      "})",
      "const stopSurfaceWatch = watchEffect(() => {",
      "  void panel.value",
      "})"
    ].join("\n");

    const annotated = annotateRuntimeDebugNames(source);

    expect(annotated).toContain('const doubledRef = computed(() => countRef() * stepRef(), { key: "doubledRef" })');
    expect(annotated).toContain('{ debugName: "doubledRef" }');
    expect(annotated).toContain('{ debugName: "stopSurfaceWatch" }');
  });

  it("preserves calls that already provide explicit options", () => {
    const source = [
      'const total = computed(() => count(), { key: "total" })',
      'const stopGateWatch = watch(() => gate.value, () => {}, { debugName: "gate" })',
      'const stopFx = watchEffect(() => sync(), { debugName: "stopFx" })'
    ].join("\n");

    expect(annotateRuntimeDebugNames(source)).toBe(source);
  });
});