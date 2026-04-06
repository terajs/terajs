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
        filePath: "/src/routes/layout.nbl",
        source: pageSource
      },
      {
        filePath: "/src/routes/dashboard/layout.nbl",
        source: pageSource
      },
      {
        filePath: "/src/routes/dashboard/index.nbl",
        source: pageSource
      },
      {
        filePath: "/src/routes/blog/[slug].nbl",
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
        filePath: "/src/pages/admin/layout.nbl",
        source: pageSource
      },
      {
        filePath: "/src/pages/admin/users.nbl",
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
          filePath: "/src/pages/docs/getting-started.nbl",
          source: pageSource
        }
      ],
      {
        routeConfigs: [
          {
            filePath: "/src/pages/docs/getting-started.nbl",
            path: "/learn/start",
            middleware: ["docs"],
            prerender: false
          }
        ]
      }
    );

    expect(manifest[0].path).toBe("/learn/start");
    expect(manifest[0].middleware).toEqual(["docs"]);
    expect(manifest[0].prerender).toBe(false);
  });

  it("lets the component route block override config route values", () => {
    const manifest = buildRouteManifest(
      [
        {
          filePath: "/src/pages/account/profile.nbl",
          source: `
<template><section /></template>
<script>export default () => null</script>
<route>
  path: /me
  middleware: secure
</route>
`
        }
      ],
      {
        routeConfigs: [
          {
            filePath: "/src/pages/account/profile.nbl",
            path: "/account/profile",
            layout: "settings",
            middleware: ["auth"],
            prerender: false
          }
        ]
      }
    );

    expect(manifest[0].path).toBe("/me");
    expect(manifest[0].layout).toBe("settings");
    expect(manifest[0].middleware).toEqual(["secure"]);
    expect(manifest[0].prerender).toBe(false);
  });
});