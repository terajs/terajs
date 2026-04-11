import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getSyncHubConfig } from "./config";

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
