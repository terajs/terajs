import { describe, expect, it } from "vitest";
import { buildRouteManifest } from "./manifest";

const pageSource = `
<template><div /></template>
<script>export default () => null</script>
`;

describe("buildRouteManifest", () => {
  it("supports routes directories and ignores layout files as pages", () => {
    const manifest = buildRouteManifest([
      {
        filePath: "/src/routes/layout.tera",
        source: pageSource
      },
      {
        filePath: "/src/routes/dashboard/layout.tera",
        source: pageSource
      },
      {
        filePath: "/src/routes/dashboard/index.tera",
        source: pageSource
      },
      {
        filePath: "/src/routes/blog/[slug].tera",
        source: `
<template><article /></template>
<script>export default () => null</script>
<route>
  middleware: auth
</route>
`
      }
    ]);

    expect(manifest).toHaveLength(2);
    expect(manifest.map((entry) => entry.path)).toEqual(["/blog/:slug", "/dashboard"]);
    expect(manifest[1].layouts.map((layout) => layout.id)).toEqual(["root", "dashboard"]);
    expect(manifest[0].middleware).toEqual(["auth"]);
  });

  it("preserves explicit route path overrides while attaching file layouts", () => {
    const manifest = buildRouteManifest([
      {
        filePath: "/src/pages/admin/layout.tera",
        source: pageSource
      },
      {
        filePath: "/src/pages/admin/users.tera",
        source: `
<template><section /></template>
<script>export default () => null</script>
<route>
  path: /team
  layout: control
</route>
`
      }
    ]);

    expect(manifest[0].path).toBe("/team");
    expect(manifest[0].layout).toBe("control");
    expect(manifest[0].layouts.map((layout) => layout.id)).toEqual(["admin"]);
  });

  it("applies config-defined routes when the component does not define a route block", () => {
    const manifest = buildRouteManifest(
      [
        {
          filePath: "/src/pages/docs/getting-started.tera",
          source: pageSource
        }
      ],
      {
        routeConfigs: [
          {
            filePath: "/src/pages/docs/getting-started.tera",
            path: "/learn/start",
            mountTarget: "docs-root",
            middleware: ["docs"],
            prerender: false
          }
        ]
      }
    );

    expect(manifest[0].path).toBe("/learn/start");
    expect(manifest[0].mountTarget).toBe("docs-root");
    expect(manifest[0].middleware).toEqual(["docs"]);
    expect(manifest[0].prerender).toBe(false);
  });

  it("lets the component route block override config route values", () => {
    const manifest = buildRouteManifest(
      [
        {
          filePath: "/src/pages/account/profile.tera",
          source: `
<template><section /></template>
<script>export default () => null</script>
<route>
  path: /me
  mountTarget: profile-root
  middleware: secure
</route>
`
        }
      ],
      {
        routeConfigs: [
          {
            filePath: "/src/pages/account/profile.tera",
            path: "/account/profile",
            layout: "settings",
            mountTarget: "account-root",
            middleware: ["auth"],
            prerender: false
          }
        ]
      }
    );

    expect(manifest[0].path).toBe("/me");
    expect(manifest[0].layout).toBe("settings");
    expect(manifest[0].mountTarget).toBe("profile-root");
    expect(manifest[0].middleware).toEqual(["secure"]);
    expect(manifest[0].prerender).toBe(false);
  });
});