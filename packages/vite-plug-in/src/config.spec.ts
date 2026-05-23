import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getAutoImportDirs, getRouteDirs, getSyncHubConfig, getWorkspaceConfig } from "./config";

describe("vite plugin config", () => {
  const originalCwd = process.cwd();
  let tempDir: string | null = null;

  afterEach(async () => {
    process.chdir(originalCwd);

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it("returns null when sync hub config is not defined", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    expect(getSyncHubConfig()).toBeNull();
  });

  it("returns the default web workspace config when no workspace block is defined", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    expect(getWorkspaceConfig()).toEqual({
      mode: "web",
      sourceRoot: path.resolve(tempDir, "src"),
      targets: {
        selected: ["web"],
        web: {
          outputDir: path.resolve(tempDir, "dist")
        },
        android: {
          generatedDir: path.resolve(tempDir, ".terajs/generated/android"),
          hostDir: path.resolve(tempDir, ".terajs/hosts/android")
        },
        ios: {
          generatedDir: path.resolve(tempDir, ".terajs/generated/ios"),
          hostDir: path.resolve(tempDir, ".terajs/hosts/ios")
        }
      }
    });
  });

  it("parses universal workspace config and derives shared source dirs", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);
    await mkdir(path.join(tempDir, "src/shared/pages"), { recursive: true });
    await mkdir(path.join(tempDir, "src/shared/components"), { recursive: true });

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  workspace: {
    mode: "universal",
    sourceRoot: "src/shared",
    targets: {
      selected: ["web", "android"],
      android: {
        generatedDir: ".terajs/generated/android",
        hostDir: ".terajs/hosts/android"
      }
    }
  }
};`
    );

    expect(getWorkspaceConfig()).toEqual({
      mode: "universal",
      sourceRoot: path.resolve(tempDir, "src/shared"),
      targets: {
        selected: ["web", "android"],
        web: {
          outputDir: path.resolve(tempDir, "dist")
        },
        android: {
          generatedDir: path.resolve(tempDir, ".terajs/generated/android"),
          hostDir: path.resolve(tempDir, ".terajs/hosts/android")
        },
        ios: {
          generatedDir: path.resolve(tempDir, ".terajs/generated/ios"),
          hostDir: path.resolve(tempDir, ".terajs/hosts/ios")
        }
      }
    });

    expect(getRouteDirs()).toEqual([path.resolve(tempDir, "src/shared/pages")]);
    expect(getAutoImportDirs()).toEqual([path.resolve(tempDir, "src/shared/components")]);
  });

  it("throws for unsupported universal workspace target names", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  workspace: {
    mode: "universal",
    targets: {
      selected: ["web", "desktop"]
    }
  }
};`
    );

    expect(() => getWorkspaceConfig()).toThrow('Invalid terajs workspace.targets.selected value "desktop"');
  });

  it("throws when universal mode omits explicit target selection", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  workspace: {
    mode: "universal"
  }
};`
    );

    expect(() => getWorkspaceConfig()).toThrow("workspace.targets.selected must include at least one target");
  });

  it("throws when web mode selects native targets", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  workspace: {
    mode: "web",
    targets: {
      selected: ["web", "android"]
    }
  }
};`
    );

    expect(() => getWorkspaceConfig()).toThrow('can only include "web" when workspace.mode is "web"');
  });

  it("throws when a selected native target uses a blank host directory", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  workspace: {
    mode: "universal",
    targets: {
      selected: ["android"],
      android: {
        generatedDir: ".terajs/generated/android",
        hostDir: ""
      }
    }
  }
};`
    );

    expect(() => getWorkspaceConfig()).toThrow("terajs workspace.targets.android.hostDir must be a non-empty string.");
  });

  it("throws when universal route dirs drift from the shared source root", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  workspace: {
    mode: "universal",
    sourceRoot: "src/shared",
    targets: {
      selected: ["web"]
    }
  },
  routeDirs: ["src/pages"]
};`
    );

    expect(() => getRouteDirs()).toThrow("terajs routeDirs must resolve to");
  });

  it("parses sync hub config from terajs.config.cjs", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  sync: {
    hub: {
      type: "signalr",
      url: "https://api.example.com/chat-hub",
      autoConnect: false,
      retryPolicy: "none"
    }
  }
};`
    );

    expect(getSyncHubConfig()).toEqual({
      type: "signalr",
      url: "https://api.example.com/chat-hub",
      autoConnect: false,
      retryPolicy: "none"
    });
  });

  it("parses sync hub config from terajs.config.ts default export", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.ts"),
      `export default {
  sync: {
    hub: {
      type: "signalr",
      url: "https://api.example.com/chat-hub"
    }
  }
};`
    );

    expect(getSyncHubConfig()).toEqual({
      type: "signalr",
      url: "https://api.example.com/chat-hub",
      autoConnect: true,
      retryPolicy: "exponential"
    });
  });

  it("parses socket.io sync hub config", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  sync: {
    hub: {
      type: "socket.io",
      url: "https://api.example.com/realtime"
    }
  }
};`
    );

    expect(getSyncHubConfig()).toEqual({
      type: "socket.io",
      url: "https://api.example.com/realtime",
      autoConnect: true,
      retryPolicy: "exponential"
    });
  });

  it("parses websockets sync hub config", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  sync: {
    hub: {
      type: "websockets",
      url: "wss://api.example.com/realtime",
      autoConnect: false
    }
  }
};`
    );

    expect(getSyncHubConfig()).toEqual({
      type: "websockets",
      url: "wss://api.example.com/realtime",
      autoConnect: false,
      retryPolicy: "exponential"
    });
  });

  it("throws for unsupported retry policy", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-config-"));
    process.chdir(tempDir);

    await writeFile(
      path.join(tempDir, "terajs.config.cjs"),
      `module.exports = {
  sync: {
    hub: {
      type: "signalr",
      url: "https://api.example.com/chat-hub",
      retryPolicy: "linear"
    }
  }
};`
    );

    expect(() => getSyncHubConfig()).toThrow("Invalid terajs sync.hub.retryPolicy");
  });
});
