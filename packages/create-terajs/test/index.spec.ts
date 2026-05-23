import { describe, expect, it } from "vitest";
import { normalizeCreateArgs } from "../src/args";

describe("create-terajs argument normalization", () => {
  it("treats a bare project name as an init scaffold request", () => {
    expect(normalizeCreateArgs(["my-app"])).toEqual(["init", "my-app"]);
  });

  it("preserves extra scaffold flags on bare project creation", () => {
    expect(normalizeCreateArgs(["my-app", "--mode", "universal"]))
      .toEqual(["init", "my-app", "--mode", "universal"]);
  });

  it("passes through explicit CLI commands and help flags", () => {
    expect(normalizeCreateArgs(["init", "my-app"])).toEqual(["init", "my-app"]);
    expect(normalizeCreateArgs(["--help"])).toEqual(["--help"]);
  });

  it("shows help when no arguments are provided", () => {
    expect(normalizeCreateArgs([])).toEqual(["--help"]);
  });
});