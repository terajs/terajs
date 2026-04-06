import { describe, it, expect } from "vitest";
import { inferPathFromFile } from "./index";

describe("inferPathFromFile", () => {
  it("maps index to root", () => {
    expect(inferPathFromFile("/src/pages/index.nbl")).toBe("/");
  });

  it("maps simple pages", () => {
    expect(inferPathFromFile("/src/pages/about.nbl")).toBe("/about");
  });

  it("maps dynamic params", () => {
    expect(inferPathFromFile("/src/pages/blog/[slug].nbl")).toBe("/blog/:slug");
  });

  it("maps nested routes", () => {
    expect(inferPathFromFile("/src/pages/admin/users/[id].nbl"))
      .toBe("/admin/users/:id");
  });

  it("supports routes directories too", () => {
    expect(inferPathFromFile("/src/routes/dashboard/index.nbl"))
      .toBe("/dashboard");
  });
});
