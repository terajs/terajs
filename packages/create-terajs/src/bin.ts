#!/usr/bin/env node
import { runCreate } from "./index.js";

void runCreate().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});