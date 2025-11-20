#!/usr/bin/env node
/**
 * Run all Wang tests with JSLike
 * This adapts Wang's Vitest tests to run with our test-utils
 */

import { TestContext } from './test-utils.js';
import { describe, it, expect, beforeEach } from './vitest-compat.js';

// Track global test results
global.testResults = { passed: 0, failed: 0, tests: [] };

// Import all test files
const testFiles = [
  './wang-unit/binary-operators.test.js',
  './wang-unit/compound-assignment.test.js',
  './wang-unit/for-in-loop.test.js',
  './wang-unit/if-else-statements.test.js',
  './wang-unit/increment-decrement.test.js',
  './wang-unit/member-increment-decrement.test.js',
  './wang-unit/multiline-conditionals.test.js',
  './wang-unit/multiline-syntax.test.js',
  './wang-unit/return-value.test.js',
  './wang-unit/short-circuit-evaluation.test.js',
  './wang-unit/template-literals.test.js',
  './wang-unit/ternary-operator.test.js',
];

console.log('🧪 Running All Wang Tests with JSLike\n');
console.log(`Found ${testFiles.length} test files\n`);

// Run tests sequentially
for (const file of testFiles) {
  try {
    console.log(`\n📄 ${file.replace('./wang-unit/', '')}`);
    await import(file);
  } catch (error) {
    console.log(`   ❌ Error loading: ${error.message}`);
    global.testResults.failed++;
  }
}

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📊 FINAL RESULTS');
console.log('='.repeat(60));
console.log(`Total Tests: ${global.testResults.tests.length}`);
console.log(`✅ Passed: ${global.testResults.passed}`);
console.log(`❌ Failed: ${global.testResults.failed}`);
console.log(`Success Rate: ${((global.testResults.passed / global.testResults.tests.length) * 100).toFixed(1)}%`);

if (global.testResults.failed > 0) {
  process.exit(1);
}
