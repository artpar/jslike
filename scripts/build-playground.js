#!/usr/bin/env node

/**
 * Build browser bundle for JSLike playground
 * Creates an IIFE bundle that exposes JSLike globally
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function buildPlayground() {
  console.log('Building browser bundle for playground...');

  try {
    await build({
      entryPoints: [join(rootDir, 'src/index.js')],
      bundle: true,
      format: 'iife',
      globalName: 'JSLike',
      outfile: join(rootDir, 'docs/jslike.browser.js'),
      platform: 'browser',
      target: ['es2020'],
      minify: false, // Keep readable for debugging
      sourcemap: true,
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      banner: {
        js: '// JSLike - JavaScript Interpreter\n// https://github.com/artpar/jslike\n'
      }
    });

    console.log('Browser bundle created: docs/jslike.browser.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildPlayground();
