/**
 * Test utilities for JSLike tests (adapted from Wang)
 */

import { execute as jslikeExecute, createEnvironment, parse as jslikeParse } from '../src/index.js';
import { InMemoryModuleResolver } from '../src/interpreter/index.js';

export class TestContext {
  constructor(options = {}) {
    this.customFunctions = {};
    this.modules = new Map();  // Store module code
    this.env = null;
    this.abortSignal = options.abortSignal;
  }

  addFunction(name, fn) {
    this.customFunctions[name] = fn;
  }

  addModule(name, code) {
    this.modules.set(name, code);
  }

  parse(code) {
    // Parse code and return in array format for test compatibility
    const ast = jslikeParse(code);
    return [ast];
  }

  async execute(code) {
    // Create fresh environment for each execution to avoid state bleed
    const env = createEnvironment();

    // Inject custom functions into environment
    for (const [name, fn] of Object.entries(this.customFunctions)) {
      if (env.has(name)) {
        env.set(name, fn);
      } else {
        env.define(name, fn);
      }
    }

    // Create module resolver if modules have been added
    let moduleResolver = null;
    if (this.modules.size > 0) {
      moduleResolver = new InMemoryModuleResolver();
      for (const [name, moduleCode] of this.modules) {
        moduleResolver.addModule(name, moduleCode);
      }
    }

    // Execute with module support
    try {
      const result = await jslikeExecute(code, env, {
        moduleResolver: moduleResolver,
        abortSignal: this.abortSignal
        // sourceType will be auto-detected from code
      });
      return result;
    } catch (error) {
      // Re-throw for test assertions
      throw error;
    }
  }
}

export function assertEqual(actual, expected, testName) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${testName}: Expected ${expectedStr}, got ${actualStr}`);
  }
}

export function assertThrows(fn, errorType, testName) {
  let thrown = false;
  let error = null;
  try {
    fn();
  } catch (e) {
    thrown = true;
    error = e;
  }
  if (!thrown) {
    throw new Error(`${testName}: Expected error to be thrown`);
  }
  if (errorType && !(error instanceof errorType)) {
    throw new Error(
      `${testName}: Expected error type ${errorType.name}, got ${error.constructor.name}`,
    );
  }
}

export async function assertAsyncThrows(fn, errorType, testName) {
  let thrown = false;
  let error = null;
  try {
    await fn();
  } catch (e) {
    thrown = true;
    error = e;
  }
  if (!thrown) {
    throw new Error(`${testName}: Expected error to be thrown`);
  }
  if (errorType && !(error instanceof errorType)) {
    throw new Error(
      `${testName}: Expected error type ${errorType.name}, got ${error.constructor.name}`,
    );
  }
}

export function runTest(name, fn) {
  return {
    name,
    run: async () => {
      try {
        await fn();
        return { name, passed: true };
      } catch (error) {
        return { name, passed: false, error: error.message };
      }
    },
  };
}

export async function runTests(tests) {
  console.log('🧪 Running JSLike Tests\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.run();
    if (result.passed) {
      console.log(`  ✅ ${result.name}`);
      passed = passed + 1;
    } else {
      console.log(`  ❌ ${result.name}`);
      console.log(`     ${result.error}`);
      failed = failed + 1;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Vitest-compatible assertion helpers
export class ExpectHelper {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`);
    }
  }

  toEqual(expected) {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
    }
  }

  async rejects() {
    return {
      toThrow: async (message) => {
        let thrown = false;
        try {
          await this.actual;
        } catch (e) {
          thrown = true;
          if (message && !e.message.includes(message)) {
            throw new Error(`Expected error containing "${message}", got "${e.message}"`);
          }
        }
        if (!thrown) {
          throw new Error('Expected promise to reject');
        }
      }
    };
  }
}

export function expect(actual) {
  return new ExpectHelper(actual);
}
