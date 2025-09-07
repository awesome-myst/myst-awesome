#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '..');

try {
  await build({
    entryPoints: [resolve(projectRoot, 'src/lib/render-myst-ast.bundle.ts')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    outfile: resolve(projectRoot, 'public/render-myst-ast.mjs'),
    minify: true,
    sourcemap: true,
    external: [
      '@awesome-myst/myst-zod', // Keep as external since it's already loaded
      'fs',
      'path',
      'url',
      'util',
      'buffer',
      'stream',
      'punycode',
      'querystring',
      'crypto'
    ],
    banner: {
      js: '// MyST AST Renderer Module - Dynamically loaded for performance'
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      'global': 'globalThis'
    },
    conditions: ['import', 'module', 'browser'],
    // Handle Node.js built-ins
    logLevel: 'warning'
  });

  console.log('✓ Built render-myst-ast.mjs successfully');
} catch (error) {
  console.error('✗ Build failed:', error);
  process.exit(1);
}
