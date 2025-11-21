#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { stdin } from 'process';
import { parse } from 'acorn';
import { isTopLevelAwait } from '../index.js';

const args = process.argv.slice(2);

// Parse flags
const showAst = args.includes('--ast');
const help = args.includes('--help') || args.includes('-h');

// Filter out flags to get file path
const filePath = args.find(arg => !arg.startsWith('--') && arg !== '-h');

if (help) {
  console.log(`
Wang Language Validator

Usage:
  wang-validate <file>      Validate a Wang file
  wang-validate -           Read from stdin
  wang-validate --help      Show this help message

Options:
  --ast                     Show the Abstract Syntax Tree
  -h, --help                Show this help message

Examples:
  wang-validate script.wang
  echo "let x = 1" | wang-validate -
  wang-validate script.wang --ast
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

async function validate() {
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

    // Check for top-level await
    const hasAwait = isTopLevelAwait(code);

    // Parse the code to validate syntax
    const ast = parse(code, {
      ecmaVersion: 'latest',
      sourceType: hasAwait ? 'module' : 'script',
      locations: true
    });

    console.log('✅ Valid Wang syntax');

    if (showAst) {
      console.log('\nAST:');
      console.log(JSON.stringify(ast, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Invalid Wang syntax:');
    console.error(error.message);
    process.exit(1);
  }
}

validate();
