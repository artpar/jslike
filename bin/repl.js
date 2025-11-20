#!/usr/bin/env node

import * as readline from 'readline';
import { execute, createEnvironment } from '../src/index.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

const env = createEnvironment();

console.log('JSLike REPL v1.0.0');
console.log('Type JavaScript-like code and press Enter to execute');
console.log('Press Ctrl+C or Ctrl+D to exit\n');

rl.prompt();

rl.on('line', (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  try {
    const result = execute(input, env);

    // Don't print undefined for statements
    if (result !== undefined) {
      console.log(result);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (process.env.DEBUG && error.stack) {
      console.error(error.stack);
    }
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});
