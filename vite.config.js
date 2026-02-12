import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const base = `https://${pkg.bucket || 'fvnmm'}.s3.amazonaws.com/${pkg.name}/`;

export default defineConfig({
  base
});
