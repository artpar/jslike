import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Ternary Operator (Single-line only)', () => {
  const ctx = new TestContext();

  describe('Basic ternary', () => {
    it('should handle simple ternary', async () => {
      const result = await ctx.execute(`
        true ? "yes" : "no"
      `);
      expect(result).toBe('yes');
    });

    it('should handle false condition', async () => {
      const result = await ctx.execute(`
        false ? "yes" : "no"
      `);
      expect(result).toBe('no');
    });

    it('should handle variable conditions', async () => {
      const result = await ctx.execute(`
        let age = 25
        age >= 18 ? "adult" : "minor"
      `);
      expect(result).toBe('adult');
    });

    it('should handle ternary in assignment', async () => {
      const result = await ctx.execute(`
        let x = 10
        let status = x > 5 ? "high" : "low"
        status
      `);
      expect(result).toBe('high');
    });
  });

  describe('Nested ternary', () => {
    it('should handle nested ternary on single line', async () => {
      const result = await ctx.execute(`
        let score = 85
        score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D"
      `);
      expect(result).toBe('B');
    });
  });

  describe('With expressions', () => {
    it('should handle function calls in ternary', async () => {
      const result = await ctx.execute(`
        let double = x => x * 2
        let triple = x => x * 3
        let useDouble = true
        let value = 5
        useDouble ? double(value) : triple(value)
      `);
      expect(result).toBe(10);
    });

    it('should handle object properties in ternary', async () => {
      const result = await ctx.execute(`
        let obj = { a: 10, b: 20 }
        let useA = false
        useA ? obj.a : obj.b
      `);
      expect(result).toBe(20);
    });

    it('should handle arithmetic in ternary', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = 3
        x > y ? x - y : y - x
      `);
      expect(result).toBe(2);
    });
  });

  describe('Short-circuit evaluation', () => {
    it('should not evaluate unused branch', async () => {
      const result = await ctx.execute(`
        let counter = 0
        let increment = () => ++counter
        true ? 42 : increment()
        counter
      `);
      expect(result).toBe(0); // increment() was never called
    });

    it('should only evaluate taken branch', async () => {
      const result = await ctx.execute(`
        let counter = 0
        let increment = () => ++counter
        false ? increment() : 42
        counter
      `);
      expect(result).toBe(0); // increment() was never called
    });
  });

  describe('In various contexts', () => {
    it('should work in return statements', async () => {
      const result = await ctx.execute(`
        function checkSign(n) {
          return n > 0 ? "positive" : n < 0 ? "negative" : "zero"
        }
        checkSign(-5)
      `);
      expect(result).toBe('negative');
    });

    it('should work in array literals', async () => {
      const result = await ctx.execute(`
        let flag = true
        let arr = [flag ? 1 : 0, !flag ? 2 : 3]
        arr
      `);
      expect(result).toEqual([1, 3]);
    });

    it('should work in object literals', async () => {
      const result = await ctx.execute(`
        let isVip = false
        let user = {
          name: "Alice",
          discount: isVip ? 0.2 : 0.1
        }
        user.discount
      `);
      expect(result).toBe(0.1);
    });
  });

  describe('With increment/decrement', () => {
    it('should work with postfix increment', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = true ? x++ : 0
        { x, y }
      `);
      expect(result).toEqual({ x: 6, y: 5 });
    });

    it('should work with prefix increment', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = false ? 0 : ++x
        { x, y }
      `);
      expect(result).toEqual({ x: 6, y: 6 });
    });
  });
});
