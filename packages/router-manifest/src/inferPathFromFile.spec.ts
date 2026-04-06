import { describe, expect, it } from "vitest";
import { inferPathFromFile } from "./index";

describe("inferPathFromFile", () => {
  it("maps root index files to slash", () => {
    expect(inferPathFromFile("/src/pages/index.nbl")).toBe("/");
  });

  it("maps page files to route paths", () => {
    expect(inferPathFromFile("/src/pages/about.nbl")).toBe("/about");
  });

  it("maps bracket params to dynamic params", () => {
    expect(inferPathFromFile("/src/pages/blog/[slug].nbl")).toBe("/blog/:slug");
  });

  it("supports nested dynamic segments", () => {
    expect(inferPathFromFile("/src/pages/admin/users/[id].nbl")).toBe("/admin/users/:id");
  });

  it("supports routes directories too", () => {
    expect(inferPathFromFile("/src/routes/dashboard/index.nbl")).toBe("/dashboard");
  });
});