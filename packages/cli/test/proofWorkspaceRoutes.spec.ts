import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { runBuildCommand } from "../src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "./proofWorkspaceTestHarness.js";

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

describe("proof workspace routes", () => {
  it("emits the home route and parameterized detail route through the shared layout", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const routes = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "generated", "android", "routes.json"), "utf8")
    ) as Array<{
      id: string;
      path: string;
      filePath: string;
      layout?: string;
      mountTarget?: string;
      asset?: string;
      middleware: string[];
      prerender: boolean;
      hydrate: string;
      edge: boolean;
      meta: Record<string, unknown>;
      layouts: Array<{ id: string; filePath: string }>;
    }>;

    expect(routes).toHaveLength(2);
    expect(routes[0]).toMatchObject({
      id: "index",
      path: "/",
      filePath: "/src/shared/pages/index.tera",
      middleware: [],
      prerender: true,
      hydrate: "eager",
      edge: false,
      layouts: [
        {
          id: "root",
          filePath: "/src/shared/pages/layout.tera"
        }
      ]
    });
    expect(routes[1]).toMatchObject({
      id: "stories/[id]",
      path: "/stories/:id",
      filePath: "/src/shared/pages/stories/[id].tera",
      middleware: [],
      prerender: true,
      hydrate: "eager",
      edge: false,
      layouts: [
        {
          id: "root",
          filePath: "/src/shared/pages/layout.tera"
        }
      ]
    });
  });
});