import fs from "node:fs";
import path from "node:path";
import { compileTemplateFromSFC, type ParsedSFC } from "@terajs/sfc";

export interface AutoImportPrelude {
  code: string;
  bindings: Record<string, string>;
}

type ToProjectImportPath = (filePath: string) => string;

function pascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function isComponentTagName(tag: unknown): tag is string {
  return typeof tag === "string" && tag.length > 0 && tag[0] >= "A" && tag[0] <= "Z";
}

function collectComponentTags(node: any, tags: Set<string>): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (node.type === "element" && isComponentTagName(node.tag)) {
    tags.add(node.tag);
  }

  for (const key of ["children", "then", "else", "body", "fallback"]) {
    const value = node[key];
    if (!Array.isArray(value)) {
      continue;
    }

    for (const child of value) {
      collectComponentTags(child, tags);
    }
  }
}

function collectUsedComponentTags(sfc: ParsedSFC): string[] {
  const ir = compileTemplateFromSFC(sfc);
  const tags = new Set<string>();

  for (const node of ir.template) {
    collectComponentTags(node, tags);
  }

  tags.delete("Link");
  return Array.from(tags).sort();
}

function resolveAutoImportEntries(
  autoImportDirs: string[],
  toProjectImportPath: ToProjectImportPath
): Map<string, string> {
  const entries = new Map<string, string>();

  for (const dir of autoImportDirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs.readdirSync(dir).filter((fileName) => fileName.endsWith(".tera"));
    for (const fileName of files) {
      const name = pascalCase(fileName.replace(/\.tera$/, ""));
      entries.set(name, toProjectImportPath(path.join(dir, fileName)));
    }
  }

  return entries;
}

export function generateAutoImports(
  autoImportDirs: string[],
  toProjectImportPath: ToProjectImportPath
): string {
  let code = "";

  for (const dir of autoImportDirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs.readdirSync(dir).filter((fileName) => fileName.endsWith(".tera"));
    for (const fileName of files) {
      const name = pascalCase(fileName.replace(/\.tera$/, ""));
      const importPath = toProjectImportPath(path.join(dir, fileName));
      code += `export { default as ${name} } from '${importPath}';\n`;
    }
  }

  return code;
}

export function generateUsedAutoImportPrelude(
  sfc: ParsedSFC,
  autoImportDirs: string[],
  toProjectImportPath: ToProjectImportPath
): AutoImportPrelude {
  const available = resolveAutoImportEntries(autoImportDirs, toProjectImportPath);
  const bindings: Record<string, string> = {};
  const imports: string[] = [];
  let index = 0;

  for (const tag of collectUsedComponentTags(sfc)) {
    const importPath = available.get(tag);
    if (!importPath) {
      continue;
    }

    const localName = `__terajsAutoImport${index}`;
    index += 1;
    bindings[tag] = localName;
    imports.push(`import ${localName} from '${importPath}';`);
  }

  return {
    code: imports.length > 0 ? `${imports.join("\n")}\n` : "",
    bindings
  };
}
