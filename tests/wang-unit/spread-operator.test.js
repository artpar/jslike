import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Spread Operator', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        console: {
          log: () => {}
        },
        JSON: {
          stringify: (v) => JSON.stringify(v),
          parse: (v) => JSON.parse(v)
        },
        Math: Math,
        Array: Array,
        Object: Object
      }
    });
  });

  describe('Spread in Function Calls', () => {
    it('should spread array into function arguments', async () => {
      const result = await interpreter.execute(`
        function add(a, b, c) {
          return a + b + c
        }
        const nums = [1, 2, 3]
        add(...nums)
      `);
      expect(result).toBe(6);
    });

    it('should spread array.map() result into function arguments', async () => {
      const result = await interpreter.execute(`
        function add(a, b, c) {
          return a + b + c
        }
        const nums = [1, 2, 3]
        add(...nums.map(x => x * 2))
      `);
      expect(result).toBe(12);
    });

    it('should spread array.filter() result into function arguments', async () => {
      const result = await interpreter.execute(`
        function sum(a, b) {
          return a + b
        }
        const nums = [1, 2, 3, 4, 5]
        sum(...nums.filter(x => x > 3))
      `);
      expect(result).toBe(9); // 4 + 5
    });

    it('should spread with Math.max', async () => {
      const result = await interpreter.execute(`
        const nums = [1, 5, 3, 9, 2]
        Math.max(...nums)
      `);
      expect(result).toBe(9);
    });

    it('should spread with Math.min', async () => {
      const result = await interpreter.execute(`
        const nums = [1, 5, 3, 9, 2]
        Math.min(...nums)
      `);
      expect(result).toBe(1);
    });

    it('should handle spread with additional arguments before', async () => {
      const result = await interpreter.execute(`
        function concat(a, b, c, d) {
          return a + b + c + d
        }
        const rest = [2, 3, 4]
        concat(1, ...rest)
      `);
      expect(result).toBe(10);
    });

    it('should handle spread with additional arguments after', async () => {
      const result = await interpreter.execute(`
        function concat(a, b, c, d) {
          return a + b + c + d
        }
        const start = [1, 2, 3]
        concat(...start, 4)
      `);
      expect(result).toBe(10);
    });

    it('should handle spread in the middle of arguments', async () => {
      const result = await interpreter.execute(`
        function concat(a, b, c, d, e) {
          return a + b + c + d + e
        }
        const middle = [2, 3, 4]
        concat(1, ...middle, 5)
      `);
      expect(result).toBe(15);
    });

    it('should handle multiple spreads in one call', async () => {
      const result = await interpreter.execute(`
        function sum(a, b, c, d) {
          return a + b + c + d
        }
        const first = [1, 2]
        const second = [3, 4]
        sum(...first, ...second)
      `);
      expect(result).toBe(10);
    });

    it('should spread empty array (no extra args)', async () => {
      const result = await interpreter.execute(`
        function identity(a) {
          return a
        }
        const empty = []
        identity(42, ...empty)
      `);
      expect(result).toBe(42);
    });

    it('should spread single element array', async () => {
      const result = await interpreter.execute(`
        function identity(a) {
          return a
        }
        const single = [99]
        identity(...single)
      `);
      expect(result).toBe(99);
    });

    it('should work with arrow functions', async () => {
      const result = await interpreter.execute(`
        const add = (a, b, c) => a + b + c
        const nums = [10, 20, 30]
        add(...nums)
      `);
      expect(result).toBe(60);
    });

    it('should work with method calls', async () => {
      const result = await interpreter.execute(`
        const obj = {
          sum: function(a, b, c) {
            return a + b + c
          }
        }
        const nums = [1, 2, 3]
        obj.sum(...nums)
      `);
      expect(result).toBe(6);
    });

    it('should work with chained method calls and spread', async () => {
      const result = await interpreter.execute(`
        const nums = [3, 1, 4, 1, 5]
        const sorted = [...nums].sort((a, b) => a - b)
        sorted.join(',')
      `);
      expect(result).toBe('1,1,3,4,5');
    });

    it('should work with Array.prototype methods using spread', async () => {
      const result = await interpreter.execute(`
        const arr = [1, 2, 3]
        const result = [].concat(...arr.map(x => [x, x * 2]))
        result
      `);
      expect(result).toEqual([1, 2, 2, 4, 3, 6]);
    });

    it('should spread strings as character arrays in function calls', async () => {
      const result = await interpreter.execute(`
        function first(a, b, c) {
          return a + b + c
        }
        first(...'abc')
      `);
      expect(result).toBe('abc');
    });
  });

  describe('Spread in Constructor Calls (new)', () => {
    it('should spread array into constructor arguments', async () => {
      const result = await interpreter.execute(`
        class Point {
          constructor(x, y, z) {
            this.x = x
            this.y = y
            this.z = z
          }
          sum() {
            return this.x + this.y + this.z
          }
        }
        const coords = [1, 2, 3]
        const p = new Point(...coords)
        p.sum()
      `);
      expect(result).toBe(6);
    });

    it('should spread with native Date constructor', async () => {
      const result = await interpreter.execute(`
        const dateArgs = [2023, 5, 15]
        const d = new Date(...dateArgs)
        d.getFullYear()
      `);
      expect(result).toBe(2023);
    });

    it('should spread array.map() into constructor', async () => {
      const result = await interpreter.execute(`
        class Vector {
          constructor(x, y, z) {
            this.coords = [x, y, z]
          }
        }
        const base = [1, 2, 3]
        const v = new Vector(...base.map(n => n * 10))
        v.coords
      `);
      expect(result).toEqual([10, 20, 30]);
    });

    it('should handle spread with additional args before in constructor', async () => {
      const result = await interpreter.execute(`
        class Config {
          constructor(name, a, b, c) {
            this.name = name
            this.values = [a, b, c]
          }
        }
        const vals = [1, 2, 3]
        const c = new Config('test', ...vals)
        c.values
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle spread with additional args after in constructor', async () => {
      const result = await interpreter.execute(`
        class Config {
          constructor(a, b, c, name) {
            this.name = name
            this.values = [a, b, c]
          }
        }
        const vals = [1, 2, 3]
        const c = new Config(...vals, 'test')
        c.name
      `);
      expect(result).toBe('test');
    });

    it('should handle multiple spreads in constructor', async () => {
      const result = await interpreter.execute(`
        class Multi {
          constructor(a, b, c, d) {
            this.sum = a + b + c + d
          }
        }
        const first = [1, 2]
        const second = [3, 4]
        const m = new Multi(...first, ...second)
        m.sum
      `);
      expect(result).toBe(10);
    });

    it('should work with native Array constructor and spread', async () => {
      const result = await interpreter.execute(`
        const items = ['a', 'b', 'c']
        const arr = new Array(...items)
        arr.join('-')
      `);
      expect(result).toBe('a-b-c');
    });
  });

  describe('Spread in Array Literals (existing functionality)', () => {
    it('should spread array into array literal', async () => {
      const result = await interpreter.execute(`
        const arr1 = [1, 2, 3]
        const arr2 = [...arr1, 4, 5, 6]
        arr2
      `);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should spread multiple arrays into array literal', async () => {
      const result = await interpreter.execute(`
        const a = [1, 2]
        const b = [3, 4]
        const c = [5, 6]
        const combined = [...a, ...b, ...c]
        combined
      `);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should spread string into array', async () => {
      const result = await interpreter.execute(`
        const str = 'hello'
        const chars = [...str]
        chars
      `);
      expect(result).toEqual(['h', 'e', 'l', 'l', 'o']);
    });

    it('should spread array.map() result into array literal', async () => {
      const result = await interpreter.execute(`
        const nums = [1, 2, 3]
        const doubled = [...nums.map(x => x * 2)]
        doubled
      `);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should spread array.filter() result into array literal', async () => {
      const result = await interpreter.execute(`
        const nums = [1, 2, 3, 4, 5]
        const evens = [...nums.filter(x => x % 2 === 0)]
        evens
      `);
      expect(result).toEqual([2, 4]);
    });

    it('should clone array using spread', async () => {
      const result = await interpreter.execute(`
        const original = [1, 2, 3]
        const clone = [...original]
        original.push(4)
        clone
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('Spread in Object Literals (existing functionality)', () => {
    it('should spread object into object literal', async () => {
      const result = await interpreter.execute(`
        const obj1 = { a: 1, b: 2 }
        const obj2 = { ...obj1, c: 3 }
        obj2
      `);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should merge multiple objects with spread', async () => {
      const result = await interpreter.execute(`
        const a = { x: 1 }
        const b = { y: 2 }
        const c = { z: 3 }
        const merged = { ...a, ...b, ...c }
        merged
      `);
      expect(result).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('should override properties with later spread', async () => {
      const result = await interpreter.execute(`
        const defaults = { color: 'red', size: 'medium' }
        const custom = { color: 'blue' }
        const final = { ...defaults, ...custom }
        final
      `);
      expect(result).toEqual({ color: 'blue', size: 'medium' });
    });

    it('should clone object using spread', async () => {
      const result = await interpreter.execute(`
        const original = { a: 1, b: 2 }
        const clone = { ...original }
        original.c = 3
        clone
      `);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('Rest Parameters (existing functionality)', () => {
    it('should collect remaining arguments with rest parameter', async () => {
      const result = await interpreter.execute(`
        function sum(...nums) {
          return nums.reduce((a, b) => a + b, 0)
        }
        sum(1, 2, 3, 4, 5)
      `);
      expect(result).toBe(15);
    });

    it('should work with regular parameters and rest', async () => {
      const result = await interpreter.execute(`
        function format(prefix, ...items) {
          return prefix + ': ' + items.join(', ')
        }
        format('Items', 'a', 'b', 'c')
      `);
      expect(result).toBe('Items: a, b, c');
    });

    it('should handle empty rest when no extra args', async () => {
      const result = await interpreter.execute(`
        function test(a, ...rest) {
          return rest.length
        }
        test(1)
      `);
      expect(result).toBe(0);
    });
  });

  describe('Rest in Destructuring (existing functionality)', () => {
    it('should destructure array with rest', async () => {
      const result = await interpreter.execute(`
        const [first, second, ...rest] = [1, 2, 3, 4, 5]
        rest
      `);
      expect(result).toEqual([3, 4, 5]);
    });

    it('should destructure with rest getting remaining elements', async () => {
      const result = await interpreter.execute(`
        const [head, ...tail] = [1, 2, 3, 4, 5]
        tail
      `);
      expect(result).toEqual([2, 3, 4, 5]);
    });

    it('should handle empty rest in destructuring', async () => {
      const result = await interpreter.execute(`
        const [a, b, ...rest] = [1, 2]
        rest
      `);
      expect(result).toEqual([]);
    });
  });

  describe('Combined Spread and Rest Operations', () => {
    it('should spread into function then collect with rest', async () => {
      const result = await interpreter.execute(`
        function collectAll(...args) {
          return args.length
        }
        const nums = [1, 2, 3, 4, 5]
        collectAll(...nums)
      `);
      expect(result).toBe(5);
    });

    it('should spread, transform, and spread again', async () => {
      const result = await interpreter.execute(`
        function sum(...nums) {
          return nums.reduce((a, b) => a + b, 0)
        }
        const original = [1, 2, 3]
        const doubled = [...original.map(x => x * 2)]
        sum(...doubled)
      `);
      expect(result).toBe(12);
    });

    it('should work with complex spread chain', async () => {
      const result = await interpreter.execute(`
        const a = [1, 2]
        const b = [...a, 3]
        const c = [...b.map(x => x * 2)]
        Math.max(...c)
      `);
      expect(result).toBe(6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle spread of empty array in function call', async () => {
      const result = await interpreter.execute(`
        function count(...args) {
          return args.length
        }
        count(...[])
      `);
      expect(result).toBe(0);
    });

    it('should handle spread with undefined values', async () => {
      const result = await interpreter.execute(`
        function getArgs(...args) {
          return args
        }
        getArgs(...[1, undefined, 3])
      `);
      expect(result).toEqual([1, undefined, 3]);
    });

    it('should handle spread with null values', async () => {
      const result = await interpreter.execute(`
        function getArgs(...args) {
          return args
        }
        getArgs(...[1, null, 3])
      `);
      expect(result).toEqual([1, null, 3]);
    });

    it('should handle nested array spread in function call', async () => {
      const result = await interpreter.execute(`
        function getFirst(arr) {
          return arr[0]
        }
        const nested = [[1, 2], [3, 4]]
        getFirst(...nested)
      `);
      expect(result).toEqual([1, 2]);
    });

    it('should handle spread with conditional expression result', async () => {
      const result = await interpreter.execute(`
        function sum(...nums) {
          return nums.reduce((a, b) => a + b, 0)
        }
        const useFirst = true
        const a = [1, 2, 3]
        const b = [4, 5, 6]
        sum(...(useFirst ? a : b))
      `);
      expect(result).toBe(6);
    });

    it('should handle spread in immediately invoked function', async () => {
      const result = await interpreter.execute(`
        const nums = [1, 2, 3]
        ((a, b, c) => a + b + c)(...nums)
      `);
      expect(result).toBe(6);
    });

    it('should handle spread with sparse arrays', async () => {
      const result = await interpreter.execute(`
        function count(...args) {
          return args.length
        }
        const sparse = [1, , 3]
        count(...sparse)
      `);
      expect(result).toBe(3);
    });
  });

  describe('Error Cases', () => {
    it('should throw when spreading non-iterable in function call', async () => {
      await expect(interpreter.execute(`
        function test(a) {
          return a
        }
        test(...123)
      `)).rejects.toThrow();
    });

    it('should throw when spreading non-iterable object in array context', async () => {
      await expect(interpreter.execute(`
        const num = 42
        const arr = [...num]
        arr
      `)).rejects.toThrow();
    });
  });

  describe('Real-World Use Cases', () => {
    it('should work for array concatenation pattern', async () => {
      const result = await interpreter.execute(`
        const arr1 = [1, 2]
        const arr2 = [3, 4]
        const arr3 = [5, 6]
        const all = [...arr1, ...arr2, ...arr3]
        all
      `);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should work for finding max/min of transformed values', async () => {
      const result = await interpreter.execute(`
        const objects = [{ value: 10 }, { value: 5 }, { value: 20 }]
        const max = Math.max(...objects.map(o => o.value))
        const min = Math.min(...objects.map(o => o.value))
        [min, max]
      `);
      expect(result).toEqual([5, 20]);
    });

    it('should work for applying array as function arguments', async () => {
      const result = await interpreter.execute(`
        function createPerson(name, age, city) {
          return { name, age, city }
        }
        const data = ['Alice', 30, 'NYC']
        const person = createPerson(...data)
        person
      `);
      expect(result).toEqual({ name: 'Alice', age: 30, city: 'NYC' });
    });

    it('should work for variadic logging function', async () => {
      const logs = [];
      interpreter = new WangInterpreter({
        moduleResolver: resolver,
        functions: {
          console: {
            log: (...args) => logs.push(args)
          },
          Math: Math
        }
      });

      await interpreter.execute(`
        const items = ['a', 'b', 'c']
        console.log('Items:', ...items)
      `);
      expect(logs[0]).toEqual(['Items:', 'a', 'b', 'c']);
    });

    it('should work for merging config objects', async () => {
      const result = await interpreter.execute(`
        const defaultConfig = {
          timeout: 1000,
          retries: 3,
          debug: false
        }
        const userConfig = {
          debug: true,
          timeout: 5000
        }
        const finalConfig = { ...defaultConfig, ...userConfig }
        finalConfig
      `);
      expect(result).toEqual({
        timeout: 5000,
        retries: 3,
        debug: true
      });
    });

    it('should work for copying and extending arrays', async () => {
      const result = await interpreter.execute(`
        const original = [1, 2, 3]
        const withPrefix = [0, ...original]
        const withSuffix = [...original, 4]
        const withBoth = [0, ...original, 4]
        [withPrefix, withSuffix, withBoth]
      `);
      expect(result).toEqual([
        [0, 1, 2, 3],
        [1, 2, 3, 4],
        [0, 1, 2, 3, 4]
      ]);
    });

    it('should work for removing duplicates with Set spread', async () => {
      const result = await interpreter.execute(`
        const nums = [1, 2, 2, 3, 3, 3, 4]
        const unique = [...new Set(nums)]
        unique
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });
});
