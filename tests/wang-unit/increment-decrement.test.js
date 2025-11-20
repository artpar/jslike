import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Increment/Decrement Operators', () => {
  const ctx = new TestContext();

  describe('Postfix Increment (x++)', () => {
    it('should increment after returning value', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = x++
        { x, y }
      `);
      expect(result).toEqual({ x: 6, y: 5 });
    });

    it('should work in expressions', async () => {
      const result = await ctx.execute(`
        let x = 10
        let result = x++ + 5
        { x, result }
      `);
      expect(result).toEqual({ x: 11, result: 15 });
    });

    it('should work in loops', async () => {
      const result = await ctx.execute(`
        let i = 0
        let sum = 0
        while (i < 3) {
          sum = sum + i++
        }
        { i, sum }
      `);
      expect(result).toEqual({ i: 3, sum: 3 }); // 0 + 1 + 2
    });
  });

  describe('Postfix Decrement (x--)', () => {
    it('should decrement after returning value', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = x--
        { x, y }
      `);
      expect(result).toEqual({ x: 4, y: 5 });
    });

    it('should work in expressions', async () => {
      const result = await ctx.execute(`
        let x = 10
        let result = x-- - 5
        { x, result }
      `);
      expect(result).toEqual({ x: 9, result: 5 });
    });
  });

  describe('Prefix Increment (++x)', () => {
    it('should increment before returning value', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = ++x
        { x, y }
      `);
      expect(result).toEqual({ x: 6, y: 6 });
    });

    it('should work in expressions', async () => {
      const result = await ctx.execute(`
        let x = 10
        let result = ++x + 5
        { x, result }
      `);
      expect(result).toEqual({ x: 11, result: 16 });
    });

    it('should work in loops', async () => {
      const result = await ctx.execute(`
        let i = 0
        let sum = 0
        while (i < 3) {
          sum = sum + ++i
        }
        { i, sum }
      `);
      expect(result).toEqual({ i: 3, sum: 6 }); // 1 + 2 + 3
    });
  });

  describe('Prefix Decrement (--x)', () => {
    it('should decrement before returning value', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = --x
        { x, y }
      `);
      expect(result).toEqual({ x: 4, y: 4 });
    });

    it('should work in expressions', async () => {
      const result = await ctx.execute(`
        let x = 10
        let result = --x - 5
        { x, result }
      `);
      expect(result).toEqual({ x: 9, result: 4 });
    });
  });

  describe('Combined Operations', () => {
    it('should handle multiple increments', async () => {
      const result = await ctx.execute(`
        let x = 0
        x++
        x++
        ++x
        x
      `);
      expect(result).toBe(3);
    });

    it('should work with array access', async () => {
      const result = await ctx.execute(`
        let arr = [10, 20, 30]
        let i = 0
        let values = []
        values.push(arr[i++])
        values.push(arr[i++])
        values.push(arr[i++])
        { values, i }
      `);
      expect(result).toEqual({
        values: [10, 20, 30],
        i: 3,
      });
    });

    it('should work with function calls', async () => {
      const result = await ctx.execute(`
        let counter = 0
        function getAndIncrement() {
          return counter++
        }
        let a = getAndIncrement()
        let b = getAndIncrement()
        let c = getAndIncrement()
        { a, b, c, counter }
      `);
      expect(result).toEqual({ a: 0, b: 1, c: 2, counter: 3 });
    });
  });

  describe('For Loop with Increment', () => {
    it('should work in C-style for loop', async () => {
      const result = await ctx.execute(`
        let sum = 0
        for (let i = 0; i < 5; i++) {
          sum = sum + i
        }
        sum
      `);
      expect(result).toBe(10); // 0 + 1 + 2 + 3 + 4
    });

    it('should work with decrement in for loop', async () => {
      const result = await ctx.execute(`
        let sum = 0
        for (let i = 5; i > 0; i--) {
          sum = sum + i
        }
        sum
      `);
      expect(result).toBe(15); // 5 + 4 + 3 + 2 + 1
    });
  });

  describe('Error Cases', () => {
    it('should not allow increment on const', async () => {
      await expect(
        ctx.execute(`
        const x = 5
        x++
      `),
      ).rejects.toThrow('Cannot reassign const variable');
    });

    it('should not allow decrement on const', async () => {
      await expect(
        ctx.execute(`
        const x = 5
        x--
      `),
      ).rejects.toThrow('Cannot reassign const variable');
    });

    it('should not allow prefix increment on const', async () => {
      await expect(
        ctx.execute(`
        const x = 5
        ++x
      `),
      ).rejects.toThrow('Cannot reassign const variable');
    });
  });

  describe('Edge Cases', () => {
    it('should handle increment with ternary', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = true ? x++ : 0
        { x, y }
      `);
      expect(result).toEqual({ x: 6, y: 5 });
    });

    it('should handle decrement in function call', async () => {
      const result = await ctx.execute(`
        let count = 3
        let process = x => {
          count--
          return x * 2
        }
        let value = process(5)
        { value, count }
      `);
      expect(result).toEqual({ value: 10, count: 2 });
    });
  });
});
