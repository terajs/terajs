import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseSFC } from "@terajs/sfc";

const componentFiles = [
  "ComponentTree.tera",
  "DevtoolsApp.tera",
  "DevtoolsOverlay.tera",
  "IssuesPanel.tera",
  "LogsPanel.tera",
  "MetaInspector.tera",
  "PerformancePanel.tera",
  "SettingsPanel.tera",
  "SignalInspector.tera",
  "ThemePanel.tera",
  "TimelinePanel.tera"
];

function scriptContent(script: string | { content: string; lang?: string }) {
  return typeof script === "string" ? script : script.content;
}

describe("devtools component SFC structure", () => {
  it("keeps every devtools component in explicit SFC block form", () => {
    const componentsDir = path.resolve(process.cwd(), "packages/devtools/src/components");

    for (const file of componentFiles) {
      const source = readFileSync(path.join(componentsDir, file), "utf8");
      const sfc = parseSFC(source, file);

      expect(source).toMatch(/<template>/i);
      expect(source).toMatch(/<script>/i);
      expect(typeof sfc.template === "string" ? sfc.template.trim().length : sfc.template.content.trim().length).toBeGreaterThan(0);
      expect(scriptContent(sfc.script).trim().length).toBeGreaterThan(0);

      if (/<meta>/i.test(source)) {
        expect(source).toMatch(/<meta>[\s\S]*title:/i);
        expect(sfc.meta).toBeTypeOf("object");
      }

      if (/<ai>/i.test(source)) {
        expect(source).toMatch(/<ai>[\s\S]*summary:/i);
        expect(sfc.ai === undefined || typeof sfc.ai === "object").toBe(true);
      }

      if (/<style/i.test(source)) {
        expect(source).toMatch(/<style\s+scoped>/i);
        expect(sfc.style).not.toBeNull();
        expect(typeof sfc.style).toBe("object");
        expect(typeof sfc.style === "object" && sfc.style ? sfc.style.scoped : false).toBe(true);
        expect(typeof sfc.style === "object" && sfc.style ? sfc.style.content.trim().length : 0).toBeGreaterThan(0);
      }
      else {
        expect(sfc.style).toBeNull();
      }
    }
  });

  it("allows components to omit optional blocks", () => {
    const componentsDir = path.resolve(process.cwd(), "packages/devtools/src/components");
    const filesWithoutMeta: string[] = [];
    const filesWithoutAi: string[] = [];

    for (const file of componentFiles) {
      const source = readFileSync(path.join(componentsDir, file), "utf8");
      const sfc = parseSFC(source, file);

      if (!/<meta>/i.test(source)) {
        filesWithoutMeta.push(file);
        expect(Object.keys(sfc.meta)).toHaveLength(0);
      }

      if (!/<ai>/i.test(source)) {
        filesWithoutAi.push(file);
        expect(sfc.ai).toBeUndefined();
      }
    }

    expect(filesWithoutMeta.length).toBeGreaterThan(0);
    expect(filesWithoutAi.length).toBeGreaterThan(0);
  });
});