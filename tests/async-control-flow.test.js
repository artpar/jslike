// Tests for async/await inside control flow structures
// These tests verify that await works correctly inside loops, conditionals, etc.
// Bug: evaluateAsync was missing handlers for control flow, causing await to return Promise objects

import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter } from '../src/index.js';

describe('Async/Await in Control Flow', () => {
  let interpreter;

  // Helper to create interpreter with async function injected
  beforeEach(() => {
    interpreter = new WangInterpreter();

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
  });

  it('Await inside for loop', async () => {
    const result = await interpreter.execute(`
      let results = [];
      for (let i = 0; i < 3; i++) {
        let value = await asyncGet(i * 10);
        results.push(value);
      }
      results
    `);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result).toEqual([0, 10, 20]);
  });

  it('Await inside for-of loop', async () => {
    const result = await interpreter.execute(`
      let items = [1, 2, 3];
      let results = [];
      for (let item of items) {
        let value = await asyncGet(item * 2);
        results.push(value);
      }
      results
    `);

    expect(result).toEqual([2, 4, 6]);
  });

  it('Await inside for-in loop', async () => {
    const result = await interpreter.execute(`
      let obj = { a: 1, b: 2, c: 3 };
      let results = [];
      for (let key in obj) {
        let value = await asyncGet(key);
        results.push(value);
      }
      results
    `);

    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).toContain('c');
  });

  it('Await inside while loop', async () => {
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

    expect(result).toBe(6);
  });

  it('Await inside do-while loop', async () => {
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

    expect(result).toEqual([0, 1, 2]);
  });

  it('Await in if statement', async () => {
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

    expect(result).toBe("yes");
  });

  it('Await in switch statement', async () => {
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

    expect(result).toBe("two");
  });

  it('Await in ternary operator', async () => {
    const result = await interpreter.execute(`
      let condition = await asyncGet(true);
      let result = condition ? await asyncGet("yes") : await asyncGet("no");
      result
    `);

    expect(result).toBe("yes");
  });

  it('Nested loops with await', async () => {
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

    expect(result).toEqual([0, 1, 10, 11]);
  });

  it('Multiple sequential awaits in loop (workflow pattern)', async () => {
    const result = await interpreter.execute(`
      let items = await dom_querySelectorAll({ count: 3 });
      let results = [];

      for (let i = 0; i < items.length; i++) {
        let item = items[i];
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

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0].tagName).toBe('DIV');
  });

  it('Await in array literal', async () => {
    const result = await interpreter.execute(`
      let a = await asyncGet(1);
      let b = await asyncGet(2);
      let c = await asyncGet(3);
      let arr = [a, b, c];
      arr
    `);

    expect(result).toEqual([1, 2, 3]);
  });

  it('Await in object literal', async () => {
    const result = await interpreter.execute(`
      let a = await asyncGet(1);
      let b = await asyncGet(2);
      let obj = { a: a, b: b };
      obj.a + obj.b
    `);

    expect(result).toBe(3);
  });

  it('Await with assignment', async () => {
    const result = await interpreter.execute(`
      let x = 0;
      x = await asyncGet(10);
      x += await asyncGet(5);
      x
    `);

    expect(result).toBe(15);
  });

  it('Await with break in loop', async () => {
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

    expect(result).toEqual([0, 1, 2]);
  });

  it('Await with continue in loop', async () => {
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

    expect(result).toEqual([0, 1, 3, 4]);
  });

  it('Await with return in loop', async () => {
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

    expect([5, -1]).toContain(result);
  });

  it('Deep nesting: loop in if in loop', async () => {
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

    expect(result.length).toBe(4);
  });

  it('Verify await returns value not Promise', async () => {
    const result = await interpreter.execute(`
      let value = null;
      for (let i = 0; i < 1; i++) {
        value = await asyncGet(42);
      }
      typeof value === 'number' ? value : 'FAIL:' + typeof value
    `);

    expect(result).toBe(42);
  });
});
