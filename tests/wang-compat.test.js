/**
 * Wang Compatibility Tests - Comprehensive test suite converted from Wang
 */

import { TestContext, expect } from './test-utils.js';

const tests = [];
const ctx = new TestContext();

// ==== INCREMENT/DECREMENT OPERATORS ====

tests.push({
  name: 'Inc/Dec: postfix increment',
  run: async () => {
    const result = await ctx.execute(`
      let x = 5
      let y = x++
      return { x, y }
    `);
    expect(result).toEqual({ x: 6, y: 5 });
  }
});

tests.push({
  name: 'Inc/Dec: postfix decrement',
  run: async () => {
    const result = await ctx.execute(`
      let x = 5
      let y = x--
      return { x, y }
    `);
    expect(result).toEqual({ x: 4, y: 5 });
  }
});

tests.push({
  name: 'Inc/Dec: prefix increment',
  run: async () => {
    const result = await ctx.execute(`
      let x = 5
      let y = ++x
      return { x, y }
    `);
    expect(result).toEqual({ x: 6, y: 6 });
  }
});

tests.push({
  name: 'Inc/Dec: prefix decrement',
  run: async () => {
    const result = await ctx.execute(`
      let x = 5
      let y = --x
      return { x, y }
    `);
    expect(result).toEqual({ x: 4, y: 4 });
  }
});

// ==== COMPOUND ASSIGNMENT ====

tests.push({
  name: 'Compound: += operator',
  run: async () => {
    const result = await ctx.execute(`
      let x = 10
      x += 5
      return x
    `);
    expect(result).toBe(15);
  }
});

tests.push({
  name: 'Compound: -= operator',
  run: async () => {
    const result = await ctx.execute(`
      let x = 10
      x -= 3
      return x
    `);
    expect(result).toBe(7);
  }
});

tests.push({
  name: 'Compound: *= operator',
  run: async () => {
    const result = await ctx.execute(`
      let x = 5
      x *= 3
      return x
    `);
    expect(result).toBe(15);
  }
});

tests.push({
  name: 'Compound: /= operator',
  run: async () => {
    const result = await ctx.execute(`
      let x = 20
      x /= 4
      return x
    `);
    expect(result).toBe(5);
  }
});

tests.push({
  name: 'Compound: %= operator',
  run: async () => {
    const result = await ctx.execute(`
      let x = 17
      x %= 5
      return x
    `);
    expect(result).toBe(2);
  }
});

// ==== TERNARY OPERATOR ====

tests.push({
  name: 'Ternary: simple ternary',
  run: async () => {
    const result = await ctx.execute(`
      let x = 5
      let result = x > 3 ? "yes" : "no"
      return result
    `);
    expect(result).toBe("yes");
  }
});

tests.push({
  name: 'Ternary: nested ternary',
  run: async () => {
    const result = await ctx.execute(`
      let x = 10
      let result = x > 10 ? "big" : x === 10 ? "equal" : "small"
      return result
    `);
    expect(result).toBe("equal");
  }
});

// ==== SHORT CIRCUIT EVALUATION ====

tests.push({
  name: 'Short-circuit: && operator',
  run: async () => {
    const result = await ctx.execute(`
      let called = false
      function side() { called = true; return true }
      let result = false && side()
      return { result, called }
    `);
    expect(result).toEqual({ result: false, called: false });
  }
});

tests.push({
  name: 'Short-circuit: || operator',
  run: async () => {
    const result = await ctx.execute(`
      let called = false
      function side() { called = true; return false }
      let result = true || side()
      return { result, called }
    `);
    expect(result).toEqual({ result: true, called: false });
  }
});

// ==== FOR-IN LOOP ====

tests.push({
  name: 'For-in: iterate object keys',
  run: async () => {
    const result = await ctx.execute(`
      let obj = { a: 1, b: 2, c: 3 }
      let keys = []
      for (let key in obj) {
        keys.push(key)
      }
      return keys.sort()
    `);
    expect(result).toEqual(['a', 'b', 'c']);
  }
});

tests.push({
  name: 'For-in: iterate array indices',
  run: async () => {
    const result = await ctx.execute(`
      let arr = ['x', 'y', 'z']
      let indices = []
      for (let i in arr) {
        indices.push(i)
      }
      return indices
    `);
    expect(result).toEqual(['0', '1', '2']);
  }
});

// ==== RETURN VALUES ====

tests.push({
  name: 'Return: early return',
  run: async () => {
    const result = await ctx.execute(`
      function test() {
        return "early"
        return "late"
      }
      return test()
    `);
    expect(result).toBe("early");
  }
});

tests.push({
  name: 'Return: return in if',
  run: async () => {
    const result = await ctx.execute(`
      function test(x) {
        if (x > 5) return "big"
        return "small"
      }
      return test(10)
    `);
    expect(result).toBe("big");
  }
});

// ==== TEMPLATE LITERALS ====

tests.push({
  name: 'Template: simple interpolation',
  run: async () => {
    const code = 'let name = "World"; let result = `Hello, ${name}!`; return result';
    const result = await ctx.execute(code);
    expect(result).toBe("Hello, World!");
  }
});

tests.push({
  name: 'Template: multiple expressions',
  run: async () => {
    const code = 'let x = 5; let y = 10; let result = `${x} + ${y} = ${x + y}`; return result';
    const result = await ctx.execute(code);
    expect(result).toBe("5 + 10 = 15");
  }
});

// ==== MULTILINE SYNTAX ====

tests.push({
  name: 'Multiline: function with newlines',
  run: async () => {
    const result = await ctx.execute(`
      function add(a, b) {
        return a + b
      }
      return add(
        5,
        3
      )
    `);
    expect(result).toBe(8);
  }
});

tests.push({
  name: 'Multiline: array with newlines',
  run: async () => {
    const result = await ctx.execute(`
      let arr = [
        1,
        2,
        3
      ]
      return arr
    `);
    expect(result).toEqual([1, 2, 3]);
  }
});

// ==== CONTROL FLOW ====

tests.push({
  name: 'Control: while loop',
  run: async () => {
    const result = await ctx.execute(`
      let i = 0
      let sum = 0
      while (i < 5) {
        sum += i
        i++
      }
      return sum
    `);
    expect(result).toBe(10);
  }
});

tests.push({
  name: 'Control: do-while loop',
  run: async () => {
    const result = await ctx.execute(`
      let i = 0
      let sum = 0
      do {
        sum += i
        i++
      } while (i < 5)
      return sum
    `);
    expect(result).toBe(10);
  }
});

tests.push({
  name: 'Control: for loop',
  run: async () => {
    const result = await ctx.execute(`
      let sum = 0
      for (let i = 0; i < 5; i++) {
        sum += i
      }
      return sum
    `);
    expect(result).toBe(10);
  }
});

tests.push({
  name: 'Control: switch statement',
  run: async () => {
    const result = await ctx.execute(`
      let x = 2
      let result
      switch (x) {
        case 1:
          result = "one"
          break
        case 2:
          result = "two"
          break
        default:
          result = "other"
      }
      return result
    `);
    expect(result).toBe("two");
  }
});

tests.push({
  name: 'Control: try-catch',
  run: async () => {
    const result = await ctx.execute(`
      let result
      try {
        throw "error"
      } catch (e) {
        result = "caught: " + e
      }
      return result
    `);
    expect(result).toBe("caught: error");
  }
});

// ==== BINARY OPERATORS ====

tests.push({
  name: 'Operators: arithmetic',
  run: async () => {
    const result = await ctx.execute(`
      return {
        add: 5 + 3,
        sub: 10 - 4,
        mul: 6 * 7,
        div: 20 / 4,
        mod: 17 % 5,
        exp: 2 ** 3
      }
    `);
    expect(result).toEqual({ add: 8, sub: 6, mul: 42, div: 5, mod: 2, exp: 8 });
  }
});

tests.push({
  name: 'Operators: comparison',
  run: async () => {
    const result = await ctx.execute(`
      return {
        eq: 5 === 5,
        neq: 5 !== 3,
        lt: 3 < 5,
        lte: 5 <= 5,
        gt: 7 > 5,
        gte: 5 >= 5
      }
    `);
    expect(result).toEqual({ eq: true, neq: true, lt: true, lte: true, gt: true, gte: true });
  }
});

tests.push({
  name: 'Operators: logical',
  run: async () => {
    const result = await ctx.execute(`
      return {
        and: true && true,
        or: false || true,
        not: !false
      }
    `);
    expect(result).toEqual({ and: true, or: true, not: true });
  }
});

// Run all tests
async function runTests() {
  console.log('🧪 Running Wang Compatibility Tests\n');
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
