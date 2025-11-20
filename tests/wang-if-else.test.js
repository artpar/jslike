/**
 * If/Else Statements test (converted from Wang)
 */

import { TestContext, expect } from './test-utils.js';

const tests = [];
const ctx = new TestContext();

// Basic if/else patterns
tests.push({
  name: 'If/Else: simple if/else with semicolons',
  run: async () => {
    const result = await ctx.execute(`
      let result;
      if (true) result = "A";
      else result = "B";
      return result;
    `);
    expect(result).toBe('A');
  }
});

tests.push({
  name: 'If/Else: simple if/else without semicolons',
  run: async () => {
    const result = await ctx.execute(`
      let result
      if (false) result = "A"
      else result = "B"
      return result
    `);
    expect(result).toBe('B');
  }
});

tests.push({
  name: 'If/Else: if without else',
  run: async () => {
    const result = await ctx.execute(`
      let x = 0
      if (true) x = 5
      return x
    `);
    expect(result).toBe(5);
  }
});

tests.push({
  name: 'If/Else: if/else with braces',
  run: async () => {
    const result = await ctx.execute(`
      let result
      if (true) {
        result = "A"
      } else {
        result = "B"
      }
      return result
    `);
    expect(result).toBe('A');
  }
});

tests.push({
  name: 'If/Else: mixed statement terminators',
  run: async () => {
    const result = await ctx.execute(`
      let x = 3
      let result
      if (x === 1) result = "one"
      else if (x === 2) result = "two"
      else if (x === 3) result = "three"
      else result = "other"
      return result
    `);
    expect(result).toBe('three');
  }
});

// If/else if/else chains
tests.push({
  name: 'If/Else: simple if/else if/else chain',
  run: async () => {
    const result = await ctx.execute(`
      let x = 2
      let result
      if (x === 1) result = "one"
      else if (x === 2) result = "two"
      else result = "other"
      return result
    `);
    expect(result).toBe('two');
  }
});

tests.push({
  name: 'If/Else: long if/else if chain',
  run: async () => {
    const result = await ctx.execute(`
      let x = 4
      let result
      if (x === 1) result = "one"
      else if (x === 2) result = "two"
      else if (x === 3) result = "three"
      else if (x === 4) result = "four"
      else if (x === 5) result = "five"
      else result = "other"
      return result
    `);
    expect(result).toBe('four');
  }
});

tests.push({
  name: 'If/Else: if/else if without final else',
  run: async () => {
    const result = await ctx.execute(`
      let x = 10
      let result = "default"
      if (x === 1) result = "one"
      else if (x === 2) result = "two"
      else if (x === 3) result = "three"
      return result
    `);
    expect(result).toBe('default');
  }
});

// Nesting scenarios
tests.push({
  name: 'If/Else: nested if/else inside if block',
  run: async () => {
    const result = await ctx.execute(`
      let outer = true
      let inner = false
      let result
      if (outer) {
        if (inner) result = "both true"
        else result = "outer true, inner false"
      } else result = "outer false"
      return result
    `);
    expect(result).toBe('outer true, inner false');
  }
});

tests.push({
  name: 'If/Else: nested if/else inside else block',
  run: async () => {
    const result = await ctx.execute(`
      let outer = false
      let inner = true
      let result
      if (outer) result = "outer true"
      else {
        if (inner) result = "outer false, inner true"
        else result = "both false"
      }
      return result
    `);
    expect(result).toBe('outer false, inner true');
  }
});

tests.push({
  name: 'If/Else: multiple levels of nesting',
  run: async () => {
    const result = await ctx.execute(`
      let a = true, b = false, c = true
      let result
      if (a) {
        if (b) {
          result = "a and b"
        } else {
          if (c) result = "a and c, not b"
          else result = "only a"
        }
      } else result = "not a"
      return result
    `);
    expect(result).toBe('a and c, not b');
  }
});

// Complex expressions
tests.push({
  name: 'If/Else: complex boolean expressions',
  run: async () => {
    const result = await ctx.execute(`
      let a = true, b = false, c = true
      let result
      if (a && b || c) result = "complex1"
      else result = "complex2"
      return result
    `);
    expect(result).toBe('complex1');
  }
});

tests.push({
  name: 'If/Else: function calls in conditions',
  run: async () => {
    const result = await ctx.execute(`
      function isEven(n) { return n % 2 === 0 }
      let x = 6
      let result
      if (isEven(x)) result = "even"
      else result = "odd"
      return result
    `);
    expect(result).toBe('even');
  }
});

tests.push({
  name: 'If/Else: assignment in if statement',
  run: async () => {
    const result = await ctx.execute(`
      let x
      let assigned
      if (assigned = 5) x = assigned
      else x = 0
      return x
    `);
    expect(result).toBe(5);
  }
});

tests.push({
  name: 'If/Else: object property access',
  run: async () => {
    const result = await ctx.execute(`
      let obj = { flag: true, value: 42 }
      let result
      if (obj.flag) result = obj.value
      else result = 0
      return result
    `);
    expect(result).toBe(42);
  }
});

// Run all tests
async function runTests() {
  console.log('🧪 Running If/Else Tests\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.run();
      console.log(`  ✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${test.name}`);
      console.log(`     ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
