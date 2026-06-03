import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  resolveAndroidSdkRoot,
  resolveJavaHome,
} from "../packages/cli/src/androidToolchain.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const rootManifest = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
const proofDir = join(repoRoot, "proofs");
const proofKeystorePath = join(proofDir, "android-release-proof.keystore");
const proofStorePassword = "terajs-proof-store";
const proofAlias = "terajs-proof";

function createAndroidEnv() {
  const env = { ...process.env };
  const javaHome = resolveJavaHome(env);
  const androidSdkRoot = resolveAndroidSdkRoot(env);

  if (!javaHome) {
    console.error("Missing JDK 17+. Install Android Studio with its bundled JBR or set JAVA_HOME.");
    process.exit(1);
  }

  if (!androidSdkRoot) {
    console.error("Missing Android SDK. Set ANDROID_SDK_ROOT or ANDROID_HOME.");
    process.exit(1);
  }

  env.JAVA_HOME = javaHome;
  env.ANDROID_SDK_ROOT = androidSdkRoot;
  env.ANDROID_HOME = androidSdkRoot;
  env.TERA_ANDROID_RELEASE_STORE_FILE = proofKeystorePath;
  env.TERA_ANDROID_RELEASE_STORE_PASSWORD = proofStorePassword;
  env.TERA_ANDROID_RELEASE_KEY_ALIAS = proofAlias;
  env.TERA_ANDROID_RELEASE_KEY_PASSWORD = proofStorePassword;
  env.TERA_ANDROID_RELEASE_VERSION_CODE ??= "2";
  env.TERA_ANDROID_RELEASE_VERSION_NAME ??= `${rootManifest.version}-rc.local`;

  return { androidSdkRoot, env, javaHome };
}

async function run(command, args, options = {}) {
  const { cwd = repoRoot, env = process.env } = options;

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} ${args.join(" ")} terminated by signal ${signal}.`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? -1}.`));
        return;
      }

      resolve();
    });
  });
}

async function ensureProofKeystore(javaHome) {
  if (existsSync(proofKeystorePath)) {
    return;
  }

  const keytoolPath = process.platform === "win32"
    ? join(javaHome, "bin", "keytool.exe")
    : join(javaHome, "bin", "keytool");

  if (!existsSync(keytoolPath)) {
    throw new Error(`Missing keytool at ${keytoolPath}.`);
  }

  await mkdir(proofDir, { recursive: true });
  await run(keytoolPath, [
    "-genkeypair",
    "-v",
    "-keystore",
    proofKeystorePath,
    "-storepass",
    proofStorePassword,
    "-keypass",
    proofStorePassword,
    "-alias",
    proofAlias,
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-dname",
    "CN=Terajs Android Proof, OU=RC, O=Terajs, L=Local, ST=CA, C=US",
  ], { env: process.env });
}

function npmCommand() {
  if (typeof process.env.npm_execpath === "string" && process.env.npm_execpath.length > 0) {
    return {
      command: process.execPath,
      prefixArgs: [process.env.npm_execpath],
    };
  }

  return {
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    prefixArgs: [],
  };
}

const { androidSdkRoot, env, javaHome } = createAndroidEnv();
await ensureProofKeystore(javaHome);

console.log("Terajs Android full RC proof");
console.log(`Using JAVA_HOME: ${javaHome}`);
console.log(`Using Android SDK: ${androidSdkRoot}`);
console.log(`Using proof keystore: ${proofKeystorePath}`);
console.log(`Using proof version: ${env.TERA_ANDROID_RELEASE_VERSION_CODE} / ${env.TERA_ANDROID_RELEASE_VERSION_NAME}`);

const npm = npmCommand();
await run(npm.command, [...npm.prefixArgs, "run", "build"], { env });
await run(npm.command, [...npm.prefixArgs, "run", "rc:native:android:doctor"], { env });
await run(npm.command, [...npm.prefixArgs, "run", "rc:native:android"], { env });
await run(npm.command, [...npm.prefixArgs, "run", "rc:native:android:shell-debug"], { env });
await run(npm.command, [...npm.prefixArgs, "run", "rc:native:android:shell-release"], { env });

console.log("Terajs Android full RC proof passed.");
