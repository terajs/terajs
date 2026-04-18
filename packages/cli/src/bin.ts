#!/usr/bin/env node
import { runCli } from "./index.js";

void runCli().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});