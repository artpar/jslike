// Tests for spread operator in async/await contexts
// Bug: evaluateAsync was missing SpreadElement handler, causing "Unhandled node type" errors
// when LLM-generated code used spread syntax like fn(...args) in async contexts

import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Spread Operator in Async Contexts', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        console: { log: () => {} },
        JSON: JSON,
        Math: Math,
        Array: Array,
        Object: Object,
        Set: Set,
        Promise: Promise
      }
    });

    // Inject async helper functions
    interpreter.setVariable('asyncGet', async (value) => value);
    interpreter.setVariable('asyncArray', async (...values) => values);
    interpreter.setVariable('asyncDelay', async (value, ms = 0) => {
      return new Promise(resolve => setTimeout(() => resolve(value), ms));
    });
    interpreter.setVariable('asyncFetch', async (ids) => {
      return ids.map(id => ({ id, data: `data-${id}` }));
    });
    interpreter.setVariable('asyncSum', async (...nums) => {
      return nums.reduce((a, b) => a + b, 0);
    });
    interpreter.setVariable('asyncMax', async (...nums) => {
      return Math.max(...nums);
    });
  });

  describe('Basic Async Spread - Function Calls', () => {
    it('should spread array into async function', async () => {
      const result = await interpreter.execute(`
        const nums = [1, 2, 3]
        await asyncSum(...nums)
      `);
      expect(result).toBe(6);
    });

    it('should spread awaited array into function', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 3])
        Math.max(...nums)
      `);
      expect(result).toBe(3);
    });

    it('should spread awaited array into async function', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([5, 10, 15])
        await asyncSum(...nums)
      `);
      expect(result).toBe(30);
    });

    it('should spread with additional args before - async context', async () => {
      const result = await interpreter.execute(`
        const rest = await asyncGet([2, 3, 4])
        await asyncSum(1, ...rest)
      `);
      expect(result).toBe(10);
    });

    it('should spread with additional args after - async context', async () => {
      const result = await interpreter.execute(`
        const start = await asyncGet([1, 2, 3])
        await asyncSum(...start, 4)
      `);
      expect(result).toBe(10);
    });

    it('should spread in the middle of args - async context', async () => {
      const result = await interpreter.execute(`
        const middle = await asyncGet([2, 3, 4])
        await asyncSum(1, ...middle, 5)
      `);
      expect(result).toBe(15);
    });

    it('should handle multiple spreads in async call', async () => {
      const result = await interpreter.execute(`
        const first = await asyncGet([1, 2])
        const second = await asyncGet([3, 4])
        await asyncSum(...first, ...second)
      `);
      expect(result).toBe(10);
    });
  });

  describe('Spread with Async Transformations', () => {
    it('should spread array.map() result in async context', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 3])
        await asyncSum(...nums.map(x => x * 2))
      `);
      expect(result).toBe(12);
    });

    it('should spread array.filter() result in async context', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 3, 4, 5])
        await asyncSum(...nums.filter(x => x > 2))
      `);
      expect(result).toBe(12); // 3 + 4 + 5
    });

    it('should spread chained transformations in async context', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 3, 4, 5])
        await asyncMax(...nums.filter(x => x % 2 === 0).map(x => x * 10))
      `);
      expect(result).toBe(40); // max of [20, 40]
    });

    it('should spread slice result in async context', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 3, 4, 5])
        await asyncSum(...nums.slice(1, 4))
      `);
      expect(result).toBe(9); // 2 + 3 + 4
    });
  });

  describe('Spread in Async Loops', () => {
    it('should spread inside for loop with await', async () => {
      const result = await interpreter.execute(`
        let total = 0
        const batches = [[1, 2], [3, 4], [5, 6]]
        for (let i = 0; i < batches.length; i++) {
          const batch = await asyncGet(batches[i])
          total += await asyncSum(...batch)
        }
        total
      `);
      expect(result).toBe(21);
    });

    it('should spread inside for-of loop with await', async () => {
      const result = await interpreter.execute(`
        let results = []
        const arrays = [[1, 2], [3, 4], [5, 6]]
        for (const arr of arrays) {
          const data = await asyncGet(arr)
          const sum = await asyncSum(...data)
          results.push(sum)
        }
        results
      `);
      expect(result).toEqual([3, 7, 11]);
    });

    it('should spread inside while loop with await', async () => {
      const result = await interpreter.execute(`
        let i = 0
        let maxes = []
        const batches = [[1, 5, 3], [2, 8, 4], [7, 1, 9]]
        while (i < batches.length) {
          const batch = await asyncGet(batches[i])
          maxes.push(await asyncMax(...batch))
          i++
        }
        maxes
      `);
      expect(result).toEqual([5, 8, 9]);
    });

    it('should build array with spread inside loop', async () => {
      const result = await interpreter.execute(`
        let combined = []
        for (let i = 0; i < 3; i++) {
          const chunk = await asyncGet([i * 10, i * 10 + 1])
          combined = [...combined, ...chunk]
        }
        combined
      `);
      expect(result).toEqual([0, 1, 10, 11, 20, 21]);
    });
  });

  describe('Spread with Conditional Async Values', () => {
    it('should spread conditional array in async context', async () => {
      const result = await interpreter.execute(`
        const useFirst = await asyncGet(true)
        const a = [1, 2, 3]
        const b = [4, 5, 6]
        await asyncSum(...(useFirst ? a : b))
      `);
      expect(result).toBe(6);
    });

    it('should spread ternary with async arrays', async () => {
      const result = await interpreter.execute(`
        const condition = await asyncGet(false)
        const first = await asyncGet([10, 20])
        const second = await asyncGet([30, 40])
        await asyncSum(...(condition ? first : second))
      `);
      expect(result).toBe(70);
    });

    it('should spread in if-else branches with await', async () => {
      const result = await interpreter.execute(`
        const flag = await asyncGet(true)
        let sum
        if (flag) {
          const nums = await asyncGet([1, 2, 3])
          sum = await asyncSum(...nums)
        } else {
          const nums = await asyncGet([10, 20, 30])
          sum = await asyncSum(...nums)
        }
        sum
      `);
      expect(result).toBe(6);
    });
  });

  describe('Spread with Native Methods in Async Context', () => {
    it('should spread with Math.max after await', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([3, 1, 4, 1, 5, 9, 2, 6])
        Math.max(...nums)
      `);
      expect(result).toBe(9);
    });

    it('should spread with Math.min after await', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([3, 1, 4, 1, 5, 9, 2, 6])
        Math.min(...nums)
      `);
      expect(result).toBe(1);
    });

    it('should spread with Array.prototype.push after await', async () => {
      const result = await interpreter.execute(`
        const arr = [1, 2]
        const toAdd = await asyncGet([3, 4, 5])
        arr.push(...toAdd)
        arr
      `);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should spread with Array.prototype.concat after await', async () => {
      const result = await interpreter.execute(`
        const arr1 = await asyncGet([1, 2])
        const arr2 = await asyncGet([3, 4])
        const combined = arr1.concat(...arr2)
        combined
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Spread in Async Array/Object Literals', () => {
    it('should spread awaited array into new array', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 3])
        const extended = [0, ...nums, 4]
        extended
      `);
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it('should spread multiple awaited arrays', async () => {
      const result = await interpreter.execute(`
        const a = await asyncGet([1, 2])
        const b = await asyncGet([3, 4])
        const c = await asyncGet([5, 6])
        const combined = [...a, ...b, ...c]
        combined
      `);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should spread awaited object into new object', async () => {
      const result = await interpreter.execute(`
        const base = await asyncGet({ a: 1, b: 2 })
        const extended = { ...base, c: 3 }
        extended
      `);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should merge multiple awaited objects with spread', async () => {
      const result = await interpreter.execute(`
        const defaults = await asyncGet({ color: 'red', size: 'medium' })
        const custom = await asyncGet({ color: 'blue' })
        const merged = { ...defaults, ...custom }
        merged
      `);
      expect(result).toEqual({ color: 'blue', size: 'medium' });
    });
  });

  describe('Spread with Async Arrow Functions and Callbacks', () => {
    it('should spread in immediately invoked async arrow function', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 3])
        const sum = await (async (a, b, c) => a + b + c)(...nums)
        sum
      `);
      expect(result).toBe(6);
    });

    it('should spread array built from async operations', async () => {
      const result = await interpreter.execute(`
        const items = [1, 2, 3]
        const processed = []
        for (const item of items) {
          const val = await asyncGet(item * 10)
          processed.push(val)
        }
        await asyncSum(...processed)
      `);
      expect(result).toBe(60);
    });
  });

  describe('Spread with Async Constructor Calls', () => {
    it('should spread awaited array into constructor', async () => {
      const result = await interpreter.execute(`
        class Vector {
          constructor(x, y, z) {
            this.coords = [x, y, z]
          }
          sum() {
            return this.coords.reduce((a, b) => a + b, 0)
          }
        }
        const coords = await asyncGet([10, 20, 30])
        const v = new Vector(...coords)
        v.sum()
      `);
      expect(result).toBe(60);
    });

    it('should spread with mixed async and sync args in constructor', async () => {
      const result = await interpreter.execute(`
        class Config {
          constructor(name, a, b, c) {
            this.name = name
            this.values = [a, b, c]
          }
        }
        const vals = await asyncGet([1, 2, 3])
        const name = await asyncGet('myConfig')
        const c = new Config(name, ...vals)
        c.values
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('Spread with Async Method Calls', () => {
    it('should spread into async object method', async () => {
      const result = await interpreter.execute(`
        const obj = {
          async calculate(...nums) {
            return nums.reduce((a, b) => a + b, 0)
          }
        }
        const values = await asyncGet([5, 10, 15])
        await obj.calculate(...values)
      `);
      expect(result).toBe(30);
    });

    it('should spread into chained async method call', async () => {
      const result = await interpreter.execute(`
        const factory = {
          createProcessor() {
            return {
              async process(...items) {
                return items.map(x => x * 2)
              }
            }
          }
        }
        const items = await asyncGet([1, 2, 3])
        await factory.createProcessor().process(...items)
      `);
      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('Spread Edge Cases in Async Context', () => {
    it('should spread empty awaited array', async () => {
      const result = await interpreter.execute(`
        const empty = await asyncGet([])
        await asyncSum(0, ...empty)
      `);
      expect(result).toBe(0);
    });

    it('should spread single-element awaited array', async () => {
      const result = await interpreter.execute(`
        const single = await asyncGet([42])
        await asyncSum(...single)
      `);
      expect(result).toBe(42);
    });

    it('should spread awaited array with undefined values', async () => {
      const result = await interpreter.execute(`
        const withUndefined = await asyncGet([1, undefined, 3])
        const arr = [...withUndefined]
        arr.length
      `);
      expect(result).toBe(3);
    });

    it('should spread awaited array with null values', async () => {
      const result = await interpreter.execute(`
        const withNull = await asyncGet([1, null, 3])
        const arr = [...withNull]
        arr[1]
      `);
      expect(result).toBe(null);
    });

    it('should spread nested awaited arrays', async () => {
      const result = await interpreter.execute(`
        const outer = await asyncGet([[1, 2], [3, 4]])
        const inner = await asyncGet(outer[0])
        await asyncSum(...inner)
      `);
      expect(result).toBe(3);
    });

    it('should spread string in async context', async () => {
      const result = await interpreter.execute(`
        const str = await asyncGet('abc')
        const chars = [...str]
        chars
      `);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should spread Set in async context', async () => {
      const result = await interpreter.execute(`
        const nums = await asyncGet([1, 2, 2, 3, 3, 3])
        const unique = [...new Set(nums)]
        unique
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('Spread Error Handling in Async Context', () => {
    it('should throw when spreading non-iterable in async function call', async () => {
      await expect(interpreter.execute(`
        const num = await asyncGet(42)
        await asyncSum(...num)
      `)).rejects.toThrow();
    });

    it('should throw when spreading null in async context', async () => {
      await expect(interpreter.execute(`
        const val = await asyncGet(null)
        const arr = [...val]
      `)).rejects.toThrow();
    });

    it('should throw when spreading undefined in async context', async () => {
      await expect(interpreter.execute(`
        const val = await asyncGet(undefined)
        await asyncSum(...val)
      `)).rejects.toThrow();
    });
  });

  describe('Real-World Async Patterns (Workflow Scenarios)', () => {
    it('should handle YouTube creator bias meter pattern', async () => {
      // Simulates the actual failing workflow pattern
      const result = await interpreter.execute(`
        // Simulate fetched bias scores
        const existingData = await asyncGet([
          { creator: 'A', score: 0.3 },
          { creator: 'B', score: 0.5 }
        ])
        const newData = await asyncGet([
          { creator: 'C', score: 0.7 }
        ])

        // This was failing before the fix
        const combined = [...existingData, ...newData]
        combined.length
      `);
      expect(result).toBe(3);
    });

    it('should aggregate async API responses with spread', async () => {
      const result = await interpreter.execute(`
        const page1 = await asyncFetch([1, 2])
        const page2 = await asyncFetch([3, 4])
        const allResults = [...page1, ...page2]
        allResults.map(r => r.id)
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should merge async config objects with spread', async () => {
      const result = await interpreter.execute(`
        const serverConfig = await asyncGet({ port: 3000, host: 'localhost' })
        const envConfig = await asyncGet({ port: 8080 })
        const userConfig = await asyncGet({ debug: true })

        const finalConfig = { ...serverConfig, ...envConfig, ...userConfig }
        finalConfig
      `);
      expect(result).toEqual({ port: 8080, host: 'localhost', debug: true });
    });

    it('should collect async results with spread in accumulator', async () => {
      const result = await interpreter.execute(`
        const ids = [1, 2, 3]
        let allItems = []

        for (const id of ids) {
          const items = await asyncFetch([id])
          allItems = [...allItems, ...items]
        }

        allItems.map(item => item.data)
      `);
      expect(result).toEqual(['data-1', 'data-2', 'data-3']);
    });

    it('should process batch operations with spread', async () => {
      const result = await interpreter.execute(`
        const batches = [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]

        let batchSums = []
        for (const batch of batches) {
          const values = await asyncGet(batch)
          const sum = await asyncSum(...values)
          batchSums.push(sum)
        }

        // Get max of batch sums
        Math.max(...batchSums)
      `);
      expect(result).toBe(24); // 7+8+9
    });

    it('should handle concurrent data merging with spread', async () => {
      const result = await interpreter.execute(`
        // Simulate fetching from multiple sources
        const source1 = await asyncGet({ users: ['alice', 'bob'] })
        const source2 = await asyncGet({ users: ['charlie'] })
        const source3 = await asyncGet({ users: ['diana', 'eve'] })

        // Merge all users
        const allUsers = [
          ...source1.users,
          ...source2.users,
          ...source3.users
        ]

        allUsers
      `);
      expect(result).toEqual(['alice', 'bob', 'charlie', 'diana', 'eve']);
    });

    it('should handle dynamic argument spreading in async workflow', async () => {
      const result = await interpreter.execute(`
        async function processWithOptions(base, ...options) {
          let result = base
          for (const opt of options) {
            result = result + await asyncGet(opt)
          }
          return result
        }

        const additionalOptions = await asyncGet([10, 20, 30])
        await processWithOptions(100, ...additionalOptions)
      `);
      expect(result).toBe(160);
    });
  });

  describe('Complex Nested Async Spread Patterns', () => {
    it('should handle deeply nested spread with multiple awaits', async () => {
      const result = await interpreter.execute(`
        const level1 = await asyncGet([1, 2])
        const level2 = await asyncGet([...level1, 3])
        const level3 = await asyncGet([...level2, 4])
        await asyncSum(...level3)
      `);
      expect(result).toBe(10);
    });

    it('should spread inside nested async function calls', async () => {
      const result = await interpreter.execute(`
        async function outer(...nums) {
          return await asyncSum(...nums)
        }

        const values = await asyncGet([1, 2, 3])
        await outer(...values)
      `);
      expect(result).toBe(6);
    });

    it('should handle spread with async map returning arrays', async () => {
      const result = await interpreter.execute(`
        const items = await asyncGet([1, 2, 3])
        const doubled = items.map(x => [x, x * 2])
        const flat = []
        for (const pair of doubled) {
          flat.push(...pair)
        }
        flat
      `);
      expect(result).toEqual([1, 2, 2, 4, 3, 6]);
    });

    it('should handle mixed sync and async spread operations', async () => {
      const result = await interpreter.execute(`
        const syncArr = [1, 2]
        const asyncArr = await asyncGet([3, 4])
        const mixed = [...syncArr, ...asyncArr]
        await asyncSum(...mixed)
      `);
      expect(result).toBe(10);
    });
  });
});
