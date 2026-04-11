import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatDoctorReport, inspectTerajsProject } from "../src/doctor";

describe("cli doctor", () => {
  it("passes scaffold-like projects", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-doctor-ok-"));
    await mkdir(join(root, "src", "routes"), { recursive: true });

    await writeFile(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "doctor-ok",
          private: true,
          dependencies: {
            "terajs": "*"
          },
          devDependencies: {
            "vite": "*"
          },
          scripts: {
            dev: "vite",
            build: "vite build"
          }
        },
        null,
        2
      )
    );

    await writeFile(join(root, "vite.config.ts"), "export default {};\n");
    await writeFile(join(root, "terajs.config.cjs"), "module.exports = {};\n");
    await writeFile(join(root, "src", "routes", "index.tera"), "<template><div/></template>\n");

    const report = await inspectTerajsProject(root);

    expect(report.ok).toBe(true);
    expect(report.checks.every((check) => check.ok)).toBe(true);
    expect(report.checks.some((check) => check.id === "dep:terajs" && check.ok)).toBe(true);

    const text = formatDoctorReport(report);
    expect(text).toContain("Doctor summary: setup is ready for development.");
  });

  it("fails when required setup is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-doctor-fail-"));

    await writeFile(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "doctor-fail",
          private: true,
          dependencies: {},
          devDependencies: {},
          scripts: {}
        },
        null,
        2
      )
    );

    const report = await inspectTerajsProject(root);

    expect(report.ok).toBe(false);
    expect(report.checks.some((check) => check.id === "dep:@terajs/runtime" && check.ok === false)).toBe(true);
    expect(report.checks.some((check) => check.id === "vite-config" && check.ok === false)).toBe(true);

    const text = formatDoctorReport(report);
    expect(text).toContain("Doctor summary: fix FAIL items before continuing.");
  });
});
