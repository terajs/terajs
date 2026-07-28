const APP_BOOTSTRAP_VIRTUAL_ID = "virtual:terajs-bootstrap";
const RESOLVED_APP_BOOTSTRAP_VIRTUAL_ID = `\0${APP_BOOTSTRAP_VIRTUAL_ID}`;
const DEV_APP_BOOTSTRAP_MODULE_PATH = `/@id/__x00__${APP_BOOTSTRAP_VIRTUAL_ID}`;

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function toPublicAssetPath(fileName: string, base = "/"): string {
  const normalizedFileName = normalizePath(fileName);
  const normalizedBase = ensureTrailingSlash(base);

  if (normalizedBase === "./") {
    return `./${normalizedFileName}`;
  }

  return `${normalizedBase}${normalizedFileName}`;
}

function generateAppBootstrapModule(appVirtualId: string): string {
  return [
    `import { bootstrapTerajsApp } from "${appVirtualId}";`,
    "bootstrapTerajsApp();"
  ].join("\n");
}

export {
  APP_BOOTSTRAP_VIRTUAL_ID,
  RESOLVED_APP_BOOTSTRAP_VIRTUAL_ID,
  DEV_APP_BOOTSTRAP_MODULE_PATH,
  generateAppBootstrapModule,
  toPublicAssetPath
};
