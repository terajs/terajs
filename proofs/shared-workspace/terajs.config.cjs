module.exports = {
  workspace: {
    mode: "universal",
    sourceRoot: "src/shared",
    targets: {
      selected: ["web", "android", "ios"],
      web: {
        outputDir: "dist"
      },
      android: {
        generatedDir: ".terajs/generated/android",
        hostDir: ".terajs/hosts/android"
      },
      ios: {
        generatedDir: ".terajs/generated/ios",
        hostDir: ".terajs/hosts/ios"
      }
    }
  },
  autoImportDirs: ["src/shared/components"],
  routeDirs: ["src/shared/pages"],
  devtools: {
    enabled: true,
    startOpen: false,
    position: "bottom-center",
    panelShortcut: "Alt+Shift+D",
    visibilityShortcut: "Alt+Shift+H"
  },
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    keepPreviousDuringLoading: true,
    applyMeta: true
  }
};