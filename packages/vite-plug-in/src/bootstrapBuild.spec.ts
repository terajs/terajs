import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { build, type Plugin } from "vite";
import { afterEach, describe, expect, it } from "vitest";
import terajsPlugin from "./index";

describe("production bootstrap assets", () => {
  const repositoryRoot = process.cwd();
  let projectRoot: string | null = null;

  afterEach(async () => {
    process.chdir(repositoryRoot);

    if (projectRoot) {
      await rm(projectRoot, { recursive: true, force: true });
      projectRoot = null;
    }
  });

  async function buildVersion(version: string): Promise<{
    bootstrapFile: string;
    javascript: Map<string, string>;
  }> {
    if (!projectRoot) {
      throw new Error("Test project was not initialized.");
    }

    const outDir = path.join(projectRoot, `dist-${version}`);
    const versionPlugin: Plugin = {
      name: `bootstrap-version-${version}`,
      transform(code, id) {
        if (id === "\0virtual:terajs-bootstrap") {
          return `${code}\nglobalThis.__TERAJS_BOOTSTRAP_BUILD__ = ${JSON.stringify(version)};`;
        }

        return null;
      }
    };

    await build({
      root: projectRoot,
      configFile: false,
      logLevel: "silent",
      resolve: {
        alias: {
          "@terajs/app": path.join(repositoryRoot, "packages/terajs/dist/index.js")
        }
      },
      plugins: [terajsPlugin(), versionPlugin],
      build: {
        outDir,
        emptyOutDir: true
      }
    });

    const html = await readFile(path.join(outDir, "index.html"), "utf8");
    const bootstrapMatch = html.match(
      /\bsrc=["'](?:\/|\.\.?\/)?(assets\/terajs-bootstrap-[^"']+\.js)["']/
    );
    expect(bootstrapMatch).not.toBeNull();

    const assetsDir = path.join(outDir, "assets");
    const javascript = new Map<string, string>();
    for (const fileName of await readdir(assetsDir)) {
      if (fileName.endsWith(".js")) {
        javascript.set(
          `assets/${fileName}`,
          await readFile(path.join(assetsDir, fileName), "utf8")
        );
      }
    }

    return {
      bootstrapFile: bootstrapMatch![1],
      javascript
    };
  }

  it("content-hashes bootstrap entries and keeps each rebuild import graph self-contained", async () => {
    projectRoot = await mkdtemp(path.join(tmpdir(), "terajs-bootstrap-build-"));
    await mkdir(path.join(projectRoot, "src/pages"), { recursive: true });
    await writeFile(
      path.join(projectRoot, "index.html"),
      "<!doctype html><html><body><div id=\"app\"></div></body></html>"
    );
    await writeFile(
      path.join(projectRoot, "src/pages/index.tera"),
      "<template><main>Cache-safe bootstrap</main></template>"
    );
    process.chdir(projectRoot);

    const first = await buildVersion("first");
    const second = await buildVersion("second");

    expect(first.bootstrapFile).not.toBe(second.bootstrapFile);
    expect(first.javascript.get(first.bootstrapFile)).toContain(
      "__TERAJS_BOOTSTRAP_BUILD__"
    );
    expect(first.javascript.get(first.bootstrapFile)).toContain("first");
    expect(second.javascript.get(second.bootstrapFile)).toContain(
      "__TERAJS_BOOTSTRAP_BUILD__"
    );
    expect(second.javascript.get(second.bootstrapFile)).toContain("second");

    for (const buildOutput of [first, second]) {
      expect(Array.from(buildOutput.javascript.keys())).not.toContain(
        "assets/terajs-bootstrap.js"
      );

      for (const [importer, source] of buildOutput.javascript) {
        const relativeImports = source.matchAll(
          /(?:from\s*|import\s*(?:\(\s*)?)[="'`](\.\/[^"'`]+\.js)["'`]/g
        );
        for (const match of relativeImports) {
          const importedFile = path.posix.normalize(
            path.posix.join(path.posix.dirname(importer), match[1])
          );
          expect(
            buildOutput.javascript.has(importedFile),
            `${importer} imports missing build artifact ${importedFile}`
          ).toBe(true);
        }
      }
    }
  });
});
