/**
 * Vitest compatibility layer for Wang tests
 * Maps Vitest API to our test-utils
 */

import { TestContext, expect as jslikeExpect } from './test-utils.js';

let currentSuite = null;
let currentTest = null;
let beforeEachHooks = [];
let suiteTests = [];

export function describe(name, fn) {
  const parentSuite = currentSuite;
  const parentHooks = [...beforeEachHooks];

  currentSuite = parentSuite ? `${parentSuite} > ${name}` : name;
  beforeEachHooks = [...parentHooks];

  fn();

  currentSuite = parentSuite;
  beforeEachHooks = parentHooks;
}

export function beforeEach(fn) {
  beforeEachHooks.push(fn);
}

export function it(name, fn) {
  const testName = currentSuite ? `${currentSuite} > ${name}` : name;
  const hooks = [...beforeEachHooks];

  suiteTests.push({
    name: testName,
    fn: fn,
    hooks: hooks
  });
}

export async function runAllTests() {
  for (const test of suiteTests) {
    global.testResults.tests.push(test.name);

    try {
      // Run beforeEach hooks
      for (const hook of test.hooks) {
        await hook();
      }

      // Run test
      await test.fn();

      console.log(`  ✅ ${test.name}`);
      global.testResults.passed++;
    } catch (error) {
      console.log(`  ❌ ${test.name}`);
      console.log(`     ${error.message}`);
      global.testResults.failed++;
    }
  }
}

// Enhanced expect to match Vitest API
export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
    toThrow(message) {
      let thrown = false;
      try {
        actual();
      } catch (e) {
        thrown = true;
        if (message && !e.message.includes(message)) {
          throw new Error(`Expected error containing "${message}", got "${e.message}"`);
        }
      }
      if (!thrown) {
        throw new Error('Expected function to throw');
      }
    },
    rejects: {
      async toThrow(message) {
        let thrown = false;
        try {
          await actual;
        } catch (e) {
          thrown = true;
          if (message && typeof message === 'string' && !e.message.includes(message)) {
            throw new Error(`Expected error containing "${message}", got "${e.message}"`);
          }
        }
        if (!thrown) {
          throw new Error('Expected promise to reject');
        }
      }
    }
  };
}

export { TestContext };
