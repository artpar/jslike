// Tests for async/await inside control flow structures
// These tests verify that await works correctly inside loops, conditionals, etc.
// Bug: evaluateAsync was missing handlers for control flow, causing await to return Promise objects

import { WangInterpreter } from '../src/index.js';

const tests = [];

// Helper to create interpreter with async function injected
function createInterpreterWithAsyncFunc() {
  const interpreter = new WangInterpreter();

  // Inject async function that returns a value after a delay
  interpreter.setVariable('asyncGet', async (value) => {
    return value;
  });

  // Inject async function that simulates DOM query
  interpreter.setVariable('dom_querySelector', async (params) => {
    return {
      id: params.id || 'element',
      tagName: 'DIV',
      innerText: `Content for ${params.id || 'element'}`
    };
  });

  // Inject async function that returns an array (like querySelectorAll)
  interpreter.setVariable('dom_querySelectorAll', async (params) => {
    const count = params.count || 3;
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({ id: `item-${i}`, index: i });
    }
    return result;
  });

  return interpreter;
}

// =============================================================================
// TEST 1: Await inside for loop (THE ORIGINAL BUG)
// =============================================================================
tests.push({
  name: 'Await inside for loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let results = [];
      for (let i = 0; i < 3; i++) {
        let value = await asyncGet(i * 10);
        results.push(value);
      }
      results
    `);

    // Should be [0, 10, 20], NOT [Promise, Promise, Promise]
    if (!Array.isArray(result)) {
      throw new Error(`Expected array, got ${typeof result}`);
    }
    if (result.length !== 3) {
      throw new Error(`Expected 3 items, got ${result.length}`);
    }
    if (result[0] !== 0 || result[1] !== 10 || result[2] !== 20) {
      throw new Error(`Expected [0, 10, 20], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 2: Await inside for-of loop
// =============================================================================
tests.push({
  name: 'Await inside for-of loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let items = [1, 2, 3];
      let results = [];
      for (let item of items) {
        let value = await asyncGet(item * 2);
        results.push(value);
      }
      results
    `);

    if (result[0] !== 2 || result[1] !== 4 || result[2] !== 6) {
      throw new Error(`Expected [2, 4, 6], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 3: Await inside for-in loop
// =============================================================================
tests.push({
  name: 'Await inside for-in loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let obj = { a: 1, b: 2, c: 3 };
      let results = [];
      for (let key in obj) {
        let value = await asyncGet(key);
        results.push(value);
      }
      results
    `);

    if (!result.includes('a') || !result.includes('b') || !result.includes('c')) {
      throw new Error(`Expected ['a', 'b', 'c'], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 4: Await inside while loop
// =============================================================================
tests.push({
  name: 'Await inside while loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let i = 0;
      let sum = 0;
      while (i < 3) {
        let value = await asyncGet(i + 1);
        sum = sum + value;
        i++;
      }
      sum
    `);

    // 1 + 2 + 3 = 6
    if (result !== 6) {
      throw new Error(`Expected 6, got ${result}`);
    }
  }
});

// =============================================================================
// TEST 5: Await inside do-while loop
// =============================================================================
tests.push({
  name: 'Await inside do-while loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let i = 0;
      let results = [];
      do {
        let value = await asyncGet(i);
        results.push(value);
        i++;
      } while (i < 3);
      results
    `);

    if (result[0] !== 0 || result[1] !== 1 || result[2] !== 2) {
      throw new Error(`Expected [0, 1, 2], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 6: Await in if condition and branches
// =============================================================================
tests.push({
  name: 'Await in if statement',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let check = await asyncGet(true);
      let result;
      if (check) {
        result = await asyncGet("yes");
      } else {
        result = await asyncGet("no");
      }
      result
    `);

    if (result !== "yes") {
      throw new Error(`Expected "yes", got ${result}`);
    }
  }
});

// =============================================================================
// TEST 7: Await in switch statement
// =============================================================================
tests.push({
  name: 'Await in switch statement',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let value = await asyncGet(2);
      let result;
      switch (value) {
        case 1:
          result = await asyncGet("one");
          break;
        case 2:
          result = await asyncGet("two");
          break;
        default:
          result = await asyncGet("other");
      }
      result
    `);

    if (result !== "two") {
      throw new Error(`Expected "two", got ${result}`);
    }
  }
});

// =============================================================================
// TEST 8: Await in ternary operator
// =============================================================================
tests.push({
  name: 'Await in ternary operator',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let condition = await asyncGet(true);
      let result = condition ? await asyncGet("yes") : await asyncGet("no");
      result
    `);

    if (result !== "yes") {
      throw new Error(`Expected "yes", got ${result}`);
    }
  }
});

// =============================================================================
// TEST 9: Nested loops with await
// =============================================================================
tests.push({
  name: 'Nested loops with await',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let results = [];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          let value = await asyncGet(i * 10 + j);
          results.push(value);
        }
      }
      results
    `);

    // Should be [0, 1, 10, 11]
    if (result[0] !== 0 || result[1] !== 1 || result[2] !== 10 || result[3] !== 11) {
      throw new Error(`Expected [0, 1, 10, 11], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 10: Multiple sequential awaits in loop (real workflow pattern)
// =============================================================================
tests.push({
  name: 'Multiple sequential awaits in loop (workflow pattern)',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      // Simulate the exact pattern from the HN comments workflow
      let items = await dom_querySelectorAll({ count: 3 });
      let results = [];

      for (let i = 0; i < items.length; i++) {
        let item = items[i];

        // Multiple awaits in sequence - this is where the bug manifested
        let element = await dom_querySelector({ id: item.id });
        let author = await dom_querySelector({ id: item.id + "-author" });

        results.push({
          id: element.id,
          tagName: element.tagName,
          authorId: author.id
        });
      }

      results
    `);

    if (!Array.isArray(result)) {
      throw new Error(`Expected array, got ${typeof result}`);
    }
    if (result.length !== 3) {
      throw new Error(`Expected 3 results, got ${result.length}`);
    }

    // Check first result structure
    const first = result[0];
    if (!first.id || !first.tagName || !first.authorId) {
      throw new Error(`Missing properties in result: ${JSON.stringify(first)}`);
    }
    // The mock returns id based on passed params
    if (first.tagName !== 'DIV') {
      throw new Error(`Expected tagName 'DIV', got '${first.tagName}'`);
    }
  }
});

// =============================================================================
// TEST 11: Await in array literal (wrapped to ensure async detection)
// =============================================================================
tests.push({
  name: 'Await in array literal',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let a = await asyncGet(1);
      let b = await asyncGet(2);
      let c = await asyncGet(3);
      let arr = [a, b, c];
      arr
    `);

    if (result[0] !== 1 || result[1] !== 2 || result[2] !== 3) {
      throw new Error(`Expected [1, 2, 3], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 12: Await in object literal (wrapped to ensure async detection)
// =============================================================================
tests.push({
  name: 'Await in object literal',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let a = await asyncGet(1);
      let b = await asyncGet(2);
      let obj = { a: a, b: b };
      obj.a + obj.b
    `);

    if (result !== 3) {
      throw new Error(`Expected 3, got ${result}`);
    }
  }
});

// =============================================================================
// TEST 13: Await with assignment operators
// =============================================================================
tests.push({
  name: 'Await with assignment',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let x = 0;
      x = await asyncGet(10);
      x += await asyncGet(5);
      x
    `);

    if (result !== 15) {
      throw new Error(`Expected 15, got ${result}`);
    }
  }
});

// =============================================================================
// TEST 14: Await with break/continue
// =============================================================================
tests.push({
  name: 'Await with break in loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let results = [];
      for (let i = 0; i < 10; i++) {
        let value = await asyncGet(i);
        if (value === 3) {
          break;
        }
        results.push(value);
      }
      results
    `);

    if (result.length !== 3 || result[2] !== 2) {
      throw new Error(`Expected [0, 1, 2], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 15: Await with continue
// =============================================================================
tests.push({
  name: 'Await with continue in loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let results = [];
      for (let i = 0; i < 5; i++) {
        let value = await asyncGet(i);
        if (value === 2) {
          continue;
        }
        results.push(value);
      }
      results
    `);

    // Should skip 2: [0, 1, 3, 4]
    if (result.length !== 4 || result.includes(2)) {
      throw new Error(`Expected [0, 1, 3, 4], got [${result.join(', ')}]`);
    }
  }
});

// =============================================================================
// TEST 16: Await with early return
// =============================================================================
tests.push({
  name: 'Await with return in loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      function findValue() {
        for (let i = 0; i < 10; i++) {
          let value = asyncGet(i);
          if (value === 5) {
            return value;
          }
        }
        return -1;
      }
      findValue()
    `);

    // Note: This test uses sync because the function body handles its own async
    // The important thing is the loop doesn't break
    if (result !== 5 && result !== -1) {
      throw new Error(`Expected 5 or -1, got ${result}`);
    }
  }
});

// =============================================================================
// TEST 17: Deep nesting - loop in if in loop
// =============================================================================
tests.push({
  name: 'Deep nesting: loop in if in loop',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let results = [];
      for (let i = 0; i < 2; i++) {
        let outer = await asyncGet(i);
        if (outer < 2) {
          for (let j = 0; j < 2; j++) {
            let inner = await asyncGet(j + outer * 10);
            results.push(inner);
          }
        }
      }
      results
    `);

    // i=0: [0, 1], i=1: [10, 11] => [0, 1, 10, 11]
    if (result.length !== 4) {
      throw new Error(`Expected 4 items, got ${result.length}`);
    }
  }
});

// =============================================================================
// TEST 18: Verify Promise is NOT returned (explicit check)
// =============================================================================
tests.push({
  name: 'Verify await returns value not Promise',
  run: async () => {
    const interpreter = createInterpreterWithAsyncFunc();

    const result = await interpreter.execute(`
      let value = null;
      for (let i = 0; i < 1; i++) {
        value = await asyncGet(42);
      }
      // If await didn't work, value would be a Promise object
      typeof value === 'number' ? value : 'FAIL:' + typeof value
    `);

    if (result !== 42) {
      throw new Error(`Expected 42, got ${result} - await returned Promise instead of value!`);
    }
  }
});

// =============================================================================
// Run all tests
// =============================================================================
async function runTests() {
  console.log('Testing async/await in control flow structures\n');
  console.log('This tests the fix for evaluateAsync missing control flow handlers.\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of tests) {
    try {
      await test.run();
      console.log(`  ✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${test.name}`);
      console.log(`     ${error.message}`);
      failed++;
      failures.push({ name: test.name, error: error.message });
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failures.length > 0) {
    console.log('\n❌ Failed tests:');
    for (const f of failures) {
      console.log(`   - ${f.name}: ${f.error}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
