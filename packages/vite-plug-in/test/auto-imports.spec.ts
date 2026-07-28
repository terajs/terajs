// Test utility for Terajs auto-imports
// Run with: npx vitest run
import { describe, it, expect } from 'vitest';
import terajsPlugin from '../src/index';
import fs from 'node:fs';
import path from 'node:path';

describe('terajsPlugin auto-imports', () => {
  it('generates virtual module with all .tera components', () => {
    const plugin = terajsPlugin();
    const resolved = plugin.resolveId('virtual:terajs-auto-imports');
    expect(resolved).toBe('\0virtual:terajs-auto-imports');
    const loaded = plugin.load('\0virtual:terajs-auto-imports');
    const code = typeof loaded === 'string'
      ? loaded
      : loaded && typeof loaded === 'object' && 'code' in loaded
        ? loaded.code
        : null;
    expect(typeof code).toBe('string');
    // Should export all .tera files in components dir
    const componentsDir = path.resolve(process.cwd(), 'packages/devtools/src/components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tera'));
    for (const f of files) {
      const name = f.replace(/\.tera$/, '');
      expect(code).toContain(name);
    }
  });
});
