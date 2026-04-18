import { runCli } from "@terajs/cli";
import { normalizeCreateArgs } from "./args.js";

export async function runCreate(argv: string[] = process.argv.slice(2)): Promise<void> {
  await runCli(normalizeCreateArgs(argv));
}