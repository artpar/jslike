/**
 * E2E tests for compound assignment operators
 * Tests execution, not just parsing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Compound Assignment Operators E2E', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({ moduleResolver: resolver });
  });

  describe('Basic compound assignment operators', () => {
    it('should handle += operator', async () => {
      const result = await interpreter.execute(`
        let x = 10
        x += 5
        x
      `);
      expect(result).toBe(15);
    });

    it('should handle -= operator', async () => {
      const result = await interpreter.execute(`
        let x = 20
        x -= 8
        x
      `);
      expect(result).toBe(12);
    });

    it('should handle *= operator', async () => {
      const result = await interpreter.execute(`
        let x = 6
        x *= 4
        x
      `);
      expect(result).toBe(24);
    });

    it('should handle /= operator', async () => {
      const result = await interpreter.execute(`
        let x = 20
        x /= 4
        x
      `);
      expect(result).toBe(5);
    });
  });

  describe('Compound assignment with expressions', () => {
    it('should work with complex expressions on RHS', async () => {
      const result = await interpreter.execute(`
        let x = 10
        let y = 5
        x += y * 2
        x
      `);
      expect(result).toBe(20);
    });

    it('should work with function calls on RHS', async () => {
      const result = await interpreter.execute(`
        function double(n) {
          return n * 2
        }
        let x = 10
        x += double(5)
        x
      `);
      expect(result).toBe(20);
    });
  });

  describe('Multiple compound assignments', () => {
    it('should chain multiple compound assignments correctly', async () => {
      const result = await interpreter.execute(`
        let x = 10
        x += 5
        x *= 2
        x -= 10
        x /= 2
        x
      `);
      expect(result).toBe(10);
    });

    it('should work with different variables', async () => {
      const result = await interpreter.execute(`
        let a = 10
        let b = 20
        let c = 5
        a += b
        b -= c
        c *= 2;
        [a, b, c]
      `);
      expect(result).toEqual([30, 15, 10]);
    });
  });

  describe('Compound assignment with objects', () => {
    it('should work with object properties', async () => {
      const result = await interpreter.execute(`
        let obj = { value: 10 }
        obj.value += 15
        obj.value
      `);
      expect(result).toBe(25);
    });

    it('should work with nested object properties', async () => {
      const result = await interpreter.execute(`
        let data = {
          stats: {
            count: 100,
            total: 500
          }
        }
        data.stats.count += 50
        data.stats.total *= 2
        data.stats
      `);
      expect(result).toEqual({ count: 150, total: 1000 });
    });

    it('should work with computed property access', async () => {
      const result = await interpreter.execute(`
        let obj = { x: 10, y: 20 }
        let prop = "x"
        obj[prop] += 5
        prop = "y"
        obj[prop] -= 3
        obj
      `);
      expect(result).toEqual({ x: 15, y: 17 });
    });
  });

  describe('Compound assignment with arrays', () => {
    it('should work with array elements', async () => {
      const result = await interpreter.execute(`
        let arr = [10, 20, 30]
        arr[0] += 5
        arr[1] *= 2
        arr[2] -= 10
        arr
      `);
      expect(result).toEqual([15, 40, 20]);
    });

    it('should work with computed array indices', async () => {
      const result = await interpreter.execute(`
        let arr = [1, 2, 3, 4, 5]
        let i = 2
        arr[i] *= 10
        arr[i + 1] += 100
        arr
      `);
      expect(result).toEqual([1, 2, 30, 104, 5]);
    });
  });

  describe('Scope and const protection', () => {
    it('should update the correct scoped variable', async () => {
      const result = await interpreter.execute(`
        let x = 10
        let results = []
        results.push(x)
        
        {
          let x = 20
          x += 5
          results.push(x)
        }
        
        x += 15
        results.push(x)
        results
      `);
      expect(result).toEqual([10, 25, 25]);
    });

    it('should throw error when trying to modify const with compound assignment', async () => {
      await expect(
        interpreter.execute(`
          const x = 10
          x += 5
        `),
      ).rejects.toThrow(/Cannot reassign const variable/);
    });

    it('should throw error for const object properties using compound assignment', async () => {
      await expect(
        interpreter.execute(`
          const obj = { value: 10 }
          const x = 5
          x *= 2
        `),
      ).rejects.toThrow(/Cannot reassign const variable/);
    });
  });

  describe('Type coercion and edge cases', () => {
    it('should handle string concatenation with +=', async () => {
      const result = await interpreter.execute(`
        let str = "Hello"
        str += " World"
        str
      `);
      expect(result).toBe('Hello World');
    });

    it('should handle undefined/null gracefully', async () => {
      const result = await interpreter.execute(`
        let x
        x += 10
        x
      `);
      expect(result).toBe(10); // undefined coerced to 0
    });

    it('should handle division by zero', async () => {
      const result = await interpreter.execute(`
        let x = 10
        x /= 0
        x
      `);
      expect(result).toBe(Infinity);
    });

    it('should work with floating point arithmetic', async () => {
      const result = await interpreter.execute(`
        let x = 10.5
        x += 2.3
        x *= 2
        x
      `);
      expect(result).toBe(25.6);
    });
  });

  describe('Integration with other operators', () => {
    it('should work alongside increment/decrement operators', async () => {
      const result = await interpreter.execute(`
        let x = 10
        x++
        x += 5
        ++x
        x
      `);
      expect(result).toBe(17);
    });

    it('should work in conditional expressions', async () => {
      const result = await interpreter.execute(`
        let x = 10
        let y = 5
        let result = x > y ? (x += 5) : (y *= 2)
        result
      `);
      expect(result).toBe(15);
    });

    it('should work in loops', async () => {
      const result = await interpreter.execute(`
        let sum = 0
        for (let i = 1; i <= 5; i++) {
          sum += i
        }
        sum
      `);
      expect(result).toBe(15);
    });
  });

  describe('Function scope and closures', () => {
    it('should work within functions', async () => {
      const result = await interpreter.execute(`
        function accumulate(start) {
          let total = start
          return function(n) {
            total += n
            return total
          }
        }
        
        let acc = accumulate(10)
        let r1 = acc(5)
        let r2 = acc(3);
        [r1, r2]
      `);
      expect(result).toEqual([15, 18]);
    });

    it('should work with async functions', async () => {
      const result = await interpreter.execute(`
        async function process(x) {
          x *= 2
          await Promise.resolve()
          x += 10
          return x
        }
        
        await process(5)
      `);
      expect(result).toBe(20);
    });
  });

  describe('Return values', () => {
    it('compound assignment should return the new value', async () => {
      const result = await interpreter.execute(`
        let x = 10
        let y = (x += 5);
        [x, y]
      `);
      expect(result).toEqual([15, 15]);
    });

    it('should work as expression in larger expressions', async () => {
      const result = await interpreter.execute(`
        let x = 10
        let result = 100 + (x *= 2)
        result
      `);
      expect(result).toBe(120);
    });
  });
});
