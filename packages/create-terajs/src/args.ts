const passthroughCommands = new Set(["init", "dev", "build", "doctor", "--help", "-h", "--version", "-V"]);

export function normalizeCreateArgs(argv: string[]): string[] {
  if (argv.length === 0) {
    return ["--help"];
  }

  const [firstArg] = argv;
  if (firstArg && passthroughCommands.has(firstArg)) {
    return argv;
  }

  return ["init", ...argv];
}