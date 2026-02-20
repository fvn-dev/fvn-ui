#!/usr/bin/env node

import { copyFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');
const cwd = process.cwd();

const files = ['AGENTS.md', 'LLM.md'];

console.log('Copying fvn-ui documentation for LLMs to project root...\n');

for (const file of files) {
  const src = join(pkgRoot, file === 'LLM.md' ? 'src/fvn-ui/LLM.md' : file);
  const dest = join(cwd, file);
  
  if (!existsSync(src)) {
    console.log(`  ⚠ ${file} not found in package`);
    continue;
  }
  
  try {
    copyFileSync(src, dest);
    console.log(`  ✓ ${file}`);
  } catch (err) {
    console.log(`  ✗ ${file}: ${err.message}`);
  }
}

console.log('\nDone! Add to .gitignore if needed:\n  AGENTS.md\n  LLM.md');
