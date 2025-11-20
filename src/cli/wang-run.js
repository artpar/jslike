#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { stdin } from 'process';
import { execute } from '../index.js';

const args = process.argv.slice(2);

// Parse flags
const verbose = args.includes('--verbose');
const quiet = args.includes('--quiet');
const help = args.includes('--help') || args.includes('-h');

// Filter out flags to get file path
const filePath = args.find(arg => !arg.startsWith('--') && arg !== '-h');

if (help) {
  console.log(`
Wang Language Runtime

Usage:
  wang-run <file>           Execute a Wang file
  wang-run -                Read from stdin
  wang-run --help           Show this help message

Options:
  --verbose                 Show detailed execution information
  --quiet                   Suppress extra output
  -h, --help                Show this help message

Examples:
  wang-run script.wang
  echo "console.log('test')" | wang-run -
  `.trim());
  process.exit(0);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function run() {
  try {
    let code;

    if (filePath === '-') {
      // Read from stdin
      code = await readStdin();
    } else if (filePath) {
      // Read from file
      code = await readFile(filePath, 'utf8');
    } else {
      console.error('Error: No input file specified');
      console.error('Use --help for usage information');
      process.exit(1);
    }

    if (verbose) {
      console.log('🚀 Executing Wang code...');
    }

    // Execute the code
    await execute(code);

    if (verbose) {
      console.log('✅ Execution completed successfully');
    }

    process.exit(0);
  } catch (error) {
    // For file not found errors, show generic error message
    if (error.code === 'ENOENT') {
      console.error('Error:', error.message);
    } else {
      console.error('❌ Execution failed:');
      console.error(error.message);
      if (verbose) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

run();
