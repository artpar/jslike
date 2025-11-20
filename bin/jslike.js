#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execute } from '../src/index.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: jslike <file.js>');
  console.error('');
  console.error('Run a JavaScript-like program using the JSLike interpreter');
  process.exit(1);
}

const filename = args[0];
const filepath = resolve(process.cwd(), filename);

try {
  const code = readFileSync(filepath, 'utf-8');
  execute(code);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`Error: File not found: ${filename}`);
    process.exit(1);
  }

  console.error('Error:', error.message);
  if (error.stack && process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}
