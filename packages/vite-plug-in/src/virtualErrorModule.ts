function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function createVirtualErrorModule(
  moduleId: string,
  error: unknown,
  contractExports: string[] = []
): string {
  const message = describeError(error);

  return [
    ...contractExports,
    `const __terajsVirtualModuleId = ${JSON.stringify(moduleId)};`,
    `const __terajsVirtualModuleMessage = ${JSON.stringify(message)};`,
    `export const __TERAJS_VIRTUAL_MODULE_ERROR__ = {`,
    `  id: __terajsVirtualModuleId,`,
    `  message: __terajsVirtualModuleMessage`,
    `};`,
    `console.error('[terajs/vite] Failed to load module', __TERAJS_VIRTUAL_MODULE_ERROR__);`,
    `throw new Error('[terajs/vite] Failed to load ' + __terajsVirtualModuleId + ': ' + __terajsVirtualModuleMessage);`
  ].join("\n");
}
