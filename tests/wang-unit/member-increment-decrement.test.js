import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Member Expression Increment/Decrement', () => {
  const ctx = new TestContext();

  describe('Object properties', () => {
    it('should handle postfix increment on object property', async () => {
      const result = await ctx.execute(`
        let obj = { count: 5 }
        let before = obj.count++
        let after = obj.count
        { before, after }
      `);
      expect(result).toEqual({ before: 5, after: 6 });
    });

    it('should handle prefix increment on object property', async () => {
      const result = await ctx.execute(`
        let obj = { count: 5 }
        let value = ++obj.count
        { value, count: obj.count }
      `);
      expect(result).toEqual({ value: 6, count: 6 });
    });

    it('should handle postfix decrement on object property', async () => {
      const result = await ctx.execute(`
        let obj = { value: 10 }
        let before = obj.value--
        let after = obj.value
        { before, after }
      `);
      expect(result).toEqual({ before: 10, after: 9 });
    });

    it('should handle prefix decrement on object property', async () => {
      const result = await ctx.execute(`
        let obj = { value: 10 }
        let newVal = --obj.value
        { newVal, value: obj.value }
      `);
      expect(result).toEqual({ newVal: 9, value: 9 });
    });
  });

  describe('Array elements', () => {
    it('should handle increment on array element', async () => {
      const result = await ctx.execute(`
        let arr = [1, 2, 3]
        let before = arr[1]++
        let after = arr[1]
        { before, after, array: arr }
      `);
      expect(result).toEqual({ before: 2, after: 3, array: [1, 3, 3] });
    });

    it('should handle decrement on array element with computed index', async () => {
      const result = await ctx.execute(`
        let arr = [10, 20, 30]
        let index = 2
        let value = --arr[index]
        { value, array: arr }
      `);
      expect(result).toEqual({ value: 29, array: [10, 20, 29] });
    });
  });

  describe('Nested properties', () => {
    it('should handle increment on deeply nested properties', async () => {
      const result = await ctx.execute(`
        let obj = {
          level1: {
            level2: {
              level3: {
                value: 100
              }
            }
          }
        }
        obj.level1.level2.level3.value++
        obj.level1.level2.level3.value
      `);
      expect(result).toBe(101);
    });

    it('should handle mixed array and object nesting', async () => {
      const result = await ctx.execute(`
        let data = {
          users: [
            { name: "Alice", score: 10 },
            { name: "Bob", score: 20 }
          ]
        }
        data.users[0].score++
        data.users[1].score--
        {
          alice: data.users[0].score,
          bob: data.users[1].score
        }
      `);
      expect(result).toEqual({ alice: 11, bob: 19 });
    });
  });

  describe('Class instances', () => {
    it('should handle this.property++ in class methods', async () => {
      const result = await ctx.execute(`
        class Counter {
          constructor(start) {
            this.value = start
          }
          
          increment() {
            return this.value++
          }
          
          decrement() {
            return --this.value
          }
          
          getValue() {
            return this.value
          }
        }
        
        let counter = new Counter(10)
        let inc1 = counter.increment()  // returns 10, value becomes 11
        let inc2 = counter.increment()  // returns 11, value becomes 12
        let dec1 = counter.decrement()  // returns 11, value becomes 11
        let final = counter.getValue()
        
        { inc1, inc2, dec1, final }
      `);
      expect(result).toEqual({ inc1: 10, inc2: 11, dec1: 11, final: 11 });
    });

    // Wang doesn't support getter/setter syntax yet
    // it('should handle increment in getters/setters', async () => {
    //   const result = await ctx.execute(`
    //     class Counter {
    //       constructor() {
    //         this._count = 0
    //       }
    //
    //       get count() {
    //         return this._count
    //       }
    //
    //       set count(val) {
    //         this._count = val
    //       }
    //
    //       incrementInternal() {
    //         return ++this._count
    //       }
    //     }
    //
    //     let counter = new Counter()
    //     counter.count = 5
    //     let val1 = counter.incrementInternal()
    //     let val2 = counter.count
    //
    //     { val1, val2 }
    //   `);
    //   expect(result).toEqual({ val1: 6, val2: 6 });
    // });
  });

  describe('Edge cases', () => {
    it('should initialize undefined properties to 0', async () => {
      const result = await ctx.execute(`
        let obj = {}
        obj.count++
        obj.count
      `);
      expect(result).toBe(1);
    });

    it('should handle increment on null-ish values', async () => {
      const result = await ctx.execute(`
        let obj = { a: null, b: undefined }
        obj.a++
        obj.b++
        { a: obj.a, b: obj.b }
      `);
      expect(result).toEqual({ a: 1, b: 1 });
    });

    it('should throw error when object is null', async () => {
      await expect(
        ctx.execute(`
        let obj = null
        obj.count++
      `),
      ).rejects.toThrow(/Cannot read propert/);
    });

    it('should throw error when object is undefined', async () => {
      await expect(
        ctx.execute(`
        let obj
        obj.value--
      `),
      ).rejects.toThrow(/Cannot read propert/);
    });
  });

  describe('Complex scenarios', () => {
    it('should work in complex expressions', async () => {
      const result = await ctx.execute(`
        let obj = { x: 5, y: 10 }
        let result = (obj.x++ * 2) + (--obj.y * 3)
        { result, x: obj.x, y: obj.y }
      `);
      expect(result).toEqual({ result: 37, x: 6, y: 9 }); // (5 * 2) + (9 * 3) = 37
    });

    it('should work with method chaining', async () => {
      const result = await ctx.execute(`
        class Builder {
          constructor() {
            this.value = 0
          }
          
          add(n) {
            this.value = this.value + n
            return this
          }
          
          increment() {
            this.value++
            return this
          }
          
          decrement() {
            --this.value
            return this
          }
          
          build() {
            return this.value
          }
        }
        
        let builder = new Builder()
        builder.add(10).increment().increment().decrement().build()
      `);
      expect(result).toBe(11);
    });

    it('should handle multiple increments in single statement', async () => {
      const result = await ctx.execute(`
        let obj = { a: 1, b: 2, c: 3 }
        let sum = obj.a++ + obj.b++ + obj.c++
        { sum, obj }
      `);
      expect(result).toEqual({
        sum: 6, // 1 + 2 + 3
        obj: { a: 2, b: 3, c: 4 },
      });
    });
  });
});
