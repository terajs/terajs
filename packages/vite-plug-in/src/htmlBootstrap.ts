import {
  APP_BOOTSTRAP_VIRTUAL_ID,
  DEV_APP_BOOTSTRAP_MODULE_PATH
} from "./bootstrapEntry.js";

interface InjectAppBootstrapScriptOptions {
  command?: string;
  base?: string;
}

export function injectAppBootstrapScript(
  html: string,
  options: InjectAppBootstrapScriptOptions
): string {
  const moduleScriptPattern = /<script\b[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
  let hasAppEntry = false;
  let match: RegExpExecArray | null = null;

  while ((match = moduleScriptPattern.exec(html)) !== null) {
    const tag = match[0] ?? "";
    const body = (match[1] ?? "").trim();
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    const ignoreBootstrap = /\bdata-terajs-ignore-bootstrap(?:=["']?(?:true|1|yes)?["']?)?/i.test(tag);

    if (ignoreBootstrap) {
      continue;
    }

    if (srcMatch) {
      const src = srcMatch[1].trim();
      if (src === "/@vite/client" || src === "@vite/client") {
        continue;
      }

      hasAppEntry = true;
      break;
    }

    if (body.length > 0) {
      hasAppEntry = true;
      break;
    }
  }

  if (hasAppEntry) {
    return html;
  }

  const appEntrySpecifier = options.command === "build"
    ? APP_BOOTSTRAP_VIRTUAL_ID
    : DEV_APP_BOOTSTRAP_MODULE_PATH;

  const bootstrapTag = `    <script type="module" src="${appEntrySpecifier}"></script>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${bootstrapTag}\n  </body>`);
  }

  return `${html}\n${bootstrapTag}`;
}
