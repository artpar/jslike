import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Standard Library', () => {
  const ctx = new TestContext();

  describe('Array Operations', () => {
    it('should sort_by property', async () => {
      const result = await ctx.execute(`
        let users = [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 },
          { name: "Charlie", age: 35 }
        ]
        sort_by(users, "age")
      `);
      expect(result[0].age).toBe(25);
      expect(result[2].age).toBe(35);
    });

    it('should sort_by function', async () => {
      const result = await ctx.execute(`
        let items = [
          { value: "apple", priority: 3 },
          { value: "banana", priority: 1 },
          { value: "cherry", priority: 2 }
        ]
        sort_by(items, item => item.priority)
      `);
      expect(result[0].value).toBe('banana');
      expect(result[2].value).toBe('apple');
    });

    it('should reverse array', async () => {
      const result = await ctx.execute(`
        reverse([1, 2, 3, 4, 5])
      `);
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });

    it('should get unique values', async () => {
      const result = await ctx.execute(`
        unique([1, 2, 2, 3, 3, 3, 4])
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should get unique_by property', async () => {
      const result = await ctx.execute(`
        let items = [
          { id: 1, name: "A" },
          { id: 2, name: "B" },
          { id: 1, name: "C" },
          { id: 3, name: "D" }
        ]
        unique_by(items, "id")
      `);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('A');
      expect(result[2].name).toBe('D');
    });

    it('should group_by property', async () => {
      const result = await ctx.execute(`
        let people = [
          { name: "Alice", dept: "eng" },
          { name: "Bob", dept: "sales" },
          { name: "Charlie", dept: "eng" },
          { name: "Dave", dept: "sales" }
        ]
        group_by(people, "dept")
      `);
      expect(result.eng).toHaveLength(2);
      expect(result.sales).toHaveLength(2);
    });

    it('should chunk array', async () => {
      const result = await ctx.execute(`
        chunk([1, 2, 3, 4, 5, 6, 7], 3)
      `);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should flatten array', async () => {
      const result = await ctx.execute(`
        flatten([[1, 2], [3, [4, 5]], 6])
      `);
      expect(result).toEqual([1, 2, 3, [4, 5], 6]);
    });

    it('should flatten with depth', async () => {
      const result = await ctx.execute(`
        flatten([[1, 2], [3, [4, [5]]]], 2)
      `);
      expect(result).toEqual([1, 2, 3, 4, [5]]);
    });

    it('should get first/last elements', async () => {
      const result = await ctx.execute(`
        let arr = [1, 2, 3, 4, 5]
        {
          first: first(arr),
          first3: first(arr, 3),
          last: last(arr),
          last2: last(arr, 2)
        }
      `);
      expect(result.first).toBe(1);
      expect(result.first3).toEqual([1, 2, 3]);
      expect(result.last).toBe(5);
      expect(result.last2).toEqual([4, 5]);
    });

    it('should take and drop', async () => {
      const result = await ctx.execute(`
        let arr = [1, 2, 3, 4, 5]
        {
          take3: take(arr, 3),
          drop2: drop(arr, 2)
        }
      `);
      expect(result.take3).toEqual([1, 2, 3]);
      expect(result.drop2).toEqual([3, 4, 5]);
    });

    it('should zip arrays', async () => {
      const result = await ctx.execute(`
        zip([1, 2, 3], ["a", "b", "c"], [true, false, true])
      `);
      expect(result).toEqual([
        [1, 'a', true],
        [2, 'b', false],
        [3, 'c', true],
      ]);
    });

    it('should partition array', async () => {
      const result = await ctx.execute(`
        partition([1, 2, 3, 4, 5, 6], x => x % 2 === 0)
      `);
      expect(result[0]).toEqual([2, 4, 6]); // even
      expect(result[1]).toEqual([1, 3, 5]); // odd
    });
  });

  describe('Object Operations', () => {
    it('should get keys, values, entries', async () => {
      const result = await ctx.execute(`
        let obj = { a: 1, b: 2, c: 3 }
        {
          keys: keys(obj),
          values: values(obj),
          entries: entries(obj)
        }
      `);
      expect(result.keys).toEqual(['a', 'b', 'c']);
      expect(result.values).toEqual([1, 2, 3]);
      expect(result.entries).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });

    it('should pick and omit keys', async () => {
      const result = await ctx.execute(`
        let obj = { a: 1, b: 2, c: 3, d: 4 }
        {
          picked: pick(obj, ["a", "c"]),
          omitted: omit(obj, ["b", "d"])
        }
      `);
      expect(result.picked).toEqual({ a: 1, c: 3 });
      expect(result.omitted).toEqual({ a: 1, c: 3 });
    });

    it('should merge objects', async () => {
      const result = await ctx.execute(`
        merge({ a: 1 }, { b: 2 }, { c: 3, a: 10 })
      `);
      expect(result).toEqual({ a: 10, b: 2, c: 3 });
    });

    it('should get and set deep paths', async () => {
      const result = await ctx.execute(`
        let obj = { user: { profile: { name: "Alice" } } }
        let name = get(obj, "user.profile.name")
        let missing = get(obj, "user.profile.age", 25)
        let updated = set(obj, "user.profile.age", 30)
        {
          name,
          missing,
          updated: get(updated, "user.profile.age")
        }
      `);
      expect(result.name).toBe('Alice');
      expect(result.missing).toBe(25);
      expect(result.updated).toBe(30);
    });

    it('should deep clone objects', async () => {
      const result = await ctx.execute(`
        let original = { a: 1, b: { c: 2, d: [3, 4] } }
        let cloned = clone(original)
        cloned.b.c = 999
        cloned.b.d.push(5)
        {
          original: original.b.c,
          cloned: cloned.b.c
        }
      `);
      expect(result.original).toBe(2);
      expect(result.cloned).toBe(999);
    });
  });

  describe('String Operations', () => {
    it('should split and join', async () => {
      const result = await ctx.execute(`
        let parts = split("a,b,c", ",")
        let joined = join(parts, " | ")
        { parts, joined }
      `);
      expect(result.parts).toEqual(['a', 'b', 'c']);
      expect(result.joined).toBe('a | b | c');
    });

    it('should trim strings', async () => {
      const result = await ctx.execute(`
        let s = "  hello world  "
        {
          trim: trim(s),
          start: trim_start(s),
          end: trim_end(s)
        }
      `);
      expect(result.trim).toBe('hello world');
      expect(result.start).toBe('hello world  ');
      expect(result.end).toBe('  hello world');
    });

    it('should transform case', async () => {
      const result = await ctx.execute(`
        {
          upper: upper("hello"),
          lower: lower("WORLD"),
          capitalize: capitalize("alice SMITH")
        }
      `);
      expect(result.upper).toBe('HELLO');
      expect(result.lower).toBe('world');
      expect(result.capitalize).toBe('Alice smith');
    });

    it('should check string boundaries', async () => {
      const result = await ctx.execute(`
        let str = "hello world"
        {
          starts: starts_with(str, "hello"),
          ends: ends_with(str, "world"),
          includes: includes(str, "o wo")
        }
      `);
      expect(result.starts).toBe(true);
      expect(result.ends).toBe(true);
      expect(result.includes).toBe(true);
    });

    it('should pad and truncate', async () => {
      const result = await ctx.execute(`
        {
          padStart: pad_start("5", 3, "0"),
          padEnd: pad_end("hello", 10, "."),
          truncate: truncate("this is a very long string", 10)
        }
      `);
      expect(result.padStart).toBe('005');
      expect(result.padEnd).toBe('hello.....');
      expect(result.truncate).toBe('this is...');
    });

    it('should replace all occurrences', async () => {
      const result = await ctx.execute(`
        replace_all("hello world hello", "hello", "hi")
      `);
      expect(result).toBe('hi world hi');
    });
  });

  describe('Type Checking', () => {
    it('should check types correctly', async () => {
      const result = await ctx.execute(`
        {
          array: is_array([1, 2, 3]),
          object: is_object({ a: 1 }),
          string: is_string("hello"),
          number: is_number(42),
          boolean: is_boolean(true),
          nullVal: is_null(null),
          notArray: is_array({})
        }
      `);

      expect(result.array).toBe(true);
      expect(result.object).toBe(true);
      expect(result.string).toBe(true);
      expect(result.number).toBe(true);
      expect(result.boolean).toBe(true);
      expect(result.nullVal).toBe(true);
      expect(result.notArray).toBe(false);
    });

    // Note: is_undefined function removed due to interpreter compatibility issues
    // Users can check for undefined using: val === undefined

    it('should check emptiness', async () => {
      const result = await ctx.execute(`
        {
          emptyArray: is_empty([]),
          emptyObject: is_empty({}),
          emptyString: is_empty(""),
          nullVal: is_empty(null),
          notEmpty: is_empty([1])
        }
      `);
      expect(result.emptyArray).toBe(true);
      expect(result.emptyObject).toBe(true);
      expect(result.emptyString).toBe(true);
      expect(result.nullVal).toBe(true);
      expect(result.notEmpty).toBe(false);
    });
  });

  describe('Math Operations', () => {
    it('should calculate min, max, sum, avg', async () => {
      const result = await ctx.execute(`
        let nums = [3, 1, 4, 1, 5, 9, 2, 6]
        {
          min: min(nums),
          max: max(nums),
          sum: sum(nums),
          avg: avg(nums)
        }
      `);
      expect(result.min).toBe(1);
      expect(result.max).toBe(9);
      expect(result.sum).toBe(31);
      expect(result.avg).toBe(3.875);
    });

    it('should calculate median', async () => {
      const result = await ctx.execute(`
        {
          odd: median([3, 1, 2, 5, 4]),
          even: median([1, 2, 3, 4])
        }
      `);
      expect(result.odd).toBe(3);
      expect(result.even).toBe(2.5);
    });

    it('should round numbers', async () => {
      const result = await ctx.execute(`
        {
          round: round(3.14159, 2),
          floor: floor(3.8),
          ceil: ceil(3.2),
          abs: abs(-5),
          clamp: clamp(15, 0, 10)
        }
      `);
      expect(result.round).toBe(3.14);
      expect(result.floor).toBe(3);
      expect(result.ceil).toBe(4);
      expect(result.abs).toBe(5);
      expect(result.clamp).toBe(10);
    });
  });

  describe('Utility Functions', () => {
    it('should generate range', async () => {
      const result = await ctx.execute(`
        {
          simple: range(5),
          startEnd: range(2, 8),
          withStep: range(0, 10, 2),
          negative: range(5, 0, -1)
        }
      `);
      expect(result.simple).toEqual([0, 1, 2, 3, 4]);
      expect(result.startEnd).toEqual([2, 3, 4, 5, 6, 7]);
      expect(result.withStep).toEqual([0, 2, 4, 6, 8]);
      expect(result.negative).toEqual([5, 4, 3, 2, 1]);
    });

    it('should generate uuid', async () => {
      const result = await ctx.execute(`
        let id = uuid()
        {
          id,
          isString: is_string(id),
          hasHyphens: includes(id, "-")
        }
      `);
      expect(result.isString).toBe(true);
      expect(result.hasHyphens).toBe(true);
      expect(result.id).toMatch(/^[0-9a-f-]+$/);
    });

    it('should convert to/from JSON', async () => {
      const result = await ctx.execute(`
        let obj = { a: 1, b: [2, 3] }
        let json = to_json(obj)
        let parsed = from_json(json)
        {
          json,
          parsed,
          equal: parsed.a === obj.a && parsed.b[0] === obj.b[0]
        }
      `);
      expect(result.json).toBe('{"a":1,"b":[2,3]}');
      expect(result.parsed).toEqual({ a: 1, b: [2, 3] });
      expect(result.equal).toBe(true);
    });

    it('should work with sleep/wait', async () => {
      const result = await ctx.execute(`
        async function test() {
          let start = Date.now()
          await sleep(50)
          let end = Date.now()
          return end - start >= 45
        }
        await test()
      `);
      expect(result).toBe(true);
    });
  });

  describe('Functional Operations', () => {
    it('should count items', async () => {
      const result = await ctx.execute(`
        let nums = [1, 2, 3, 4, 5, 6]
        {
          total: count(nums),
          even: count(nums, x => x % 2 === 0)
        }
      `);
      expect(result.total).toBe(6);
      expect(result.even).toBe(3);
    });

    it('should find and find_index', async () => {
      const result = await ctx.execute(`
        let items = [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 3, name: "Charlie" }
        ]
        {
          found: find(items, item => item.name === "Bob"),
          index: find_index(items, item => item.name === "Bob")
        }
      `);
      expect(result.found.id).toBe(2);
      expect(result.index).toBe(1);
    });

    it('should check every and some', async () => {
      const result = await ctx.execute(`
        let nums = [2, 4, 6, 8]
        {
          allEven: every(nums, x => x % 2 === 0),
          someOdd: some(nums, x => x % 2 === 1),
          someGreater: some(nums, x => x > 5)
        }
      `);
      expect(result.allEven).toBe(true);
      expect(result.someOdd).toBe(false);
      expect(result.someGreater).toBe(true);
    });
  });

  // Pipeline Integration tests removed - not JavaScript compatible
});
