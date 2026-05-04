import { beforeEach, describe, expect, it, vi } from "vitest";

const { collectSignalRegistrySnapshot, isSignalLikeUpdate, summarizeLog } = vi.hoisted(() => ({
  collectSignalRegistrySnapshot: vi.fn(),
  isSignalLikeUpdate: vi.fn((type: string) => type === "signal:update"),
  summarizeLog: vi.fn(() => ""),
}));

vi.mock("../inspector/dataCollectors.js", () => ({
  collectSignalRegistrySnapshot,
  isSignalLikeUpdate,
  summarizeLog,
}));

import { buildSignalWorkbenchModel } from "./runtimeWorkbenchModels.js";

describe("buildSignalWorkbenchModel", () => {
  beforeEach(() => {
    collectSignalRegistrySnapshot.mockReset();
    isSignalLikeUpdate.mockClear();
    summarizeLog.mockClear();
  });

  it("summarizes registry entries from the actual retained value instead of a truncated preview string", () => {
    collectSignalRegistrySnapshot.mockReturnValue([
      {
        id: "signal:filters",
        key: "filters",
        type: "signal",
        scope: "page",
        label: "filters",
        valuePreview: '{"filters":{"tag":"docs"',
        value: {
          filters: { tag: "docs" },
          status: "open",
        },
      },
    ]);

    const model = buildSignalWorkbenchModel([], null, "", "active");

    expect(model.entries).toHaveLength(1);
    expect(model.entries[0]?.summary).toBe("Object · filters, status");
    expect(model.entries[0]?.summary).not.toContain('{"filters"');
  });

  it("keeps long text previews compact in the navigator model", () => {
    collectSignalRegistrySnapshot.mockReturnValue([]);

    const model = buildSignalWorkbenchModel(
      [
        {
          type: "signal:update",
          timestamp: 10,
          payload: {
            key: "status",
            value: "x".repeat(48),
          },
        },
      ],
      null,
      "",
      "recent",
    );

    expect(model.entries).toHaveLength(1);
    expect(model.entries[0]?.summary).toBe("Text · 48 chars");
    expect(model.entries[0]?.summary).not.toContain("xxxxxxxx");
  });
});