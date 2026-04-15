import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';

describe('Optional Chaining in CallExpression', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  // ── Issue #6 exact reproduction ──────────────────────────────────────

  describe('issue #6 reproduction', () => {
    it('el.innerText?.trim() where innerText is undefined', async () => {
      const result = await interpreter.execute(`
        const el = { innerText: undefined };
        el.innerText?.trim();
      `);
      expect(result).toBeUndefined();
    });

    it('el.innerText?.trim() where innerText is null', async () => {
      const result = await interpreter.execute(`
        const el = { innerText: null };
        el.innerText?.trim();
      `);
      expect(result).toBeUndefined();
    });

    it('el.innerText?.trim() where innerText has a value', async () => {
      const result = await interpreter.execute(`
        const el = { innerText: "  hello  " };
        el.innerText?.trim();
      `);
      expect(result).toBe('hello');
    });
  });

  // ── x?.method() — optional member in callee ─────────────────────────

  describe('x?.method() — optional member access on callee object', () => {
    it('returns undefined when x is null', async () => {
      const result = await interpreter.execute(`
        const x = null;
        x?.toString();
      `);
      expect(result).toBeUndefined();
    });

    it('returns undefined when x is undefined', async () => {
      const result = await interpreter.execute(`
        const x = undefined;
        x?.toString();
      `);
      expect(result).toBeUndefined();
    });

    it('calls method when x is valid', async () => {
      const result = await interpreter.execute(`
        const x = 42;
        x?.toString();
      `);
      expect(result).toBe('42');
    });

    it('returns undefined for missing property on null', async () => {
      const result = await interpreter.execute(`
        const x = null;
        x?.nonExistentMethod();
      `);
      expect(result).toBeUndefined();
    });
  });

  // ── x?.method?.() — optional member + optional call ──────────────────

  describe('x?.method?.() — double optional', () => {
    it('returns undefined when x is null', async () => {
      const result = await interpreter.execute(`
        const x = null;
        x?.foo?.();
      `);
      expect(result).toBeUndefined();
    });

    it('returns undefined when method does not exist', async () => {
      const result = await interpreter.execute(`
        const obj = {};
        obj?.nonExistent?.();
      `);
      expect(result).toBeUndefined();
    });

    it('calls method when both exist', async () => {
      const result = await interpreter.execute(`
        const obj = { greet() { return "hi"; } };
        obj?.greet?.();
      `);
      expect(result).toBe('hi');
    });
  });

  // ── x.foo?.() — optional call (node.optional=true) ───────────────────

  describe('x.foo?.() — optional call operator', () => {
    it('throws when foo is a non-function truthy value (matches JS spec)', async () => {
      await expect(interpreter.execute(`
        const obj = { foo: 42 };
        obj.foo?.();
      `)).rejects.toThrow();
    });

    it('returns undefined when foo is null', async () => {
      const result = await interpreter.execute(`
        const obj = { foo: null };
        obj.foo?.();
      `);
      expect(result).toBeUndefined();
    });

    it('returns undefined when foo is undefined', async () => {
      const result = await interpreter.execute(`
        const obj = { foo: undefined };
        obj.foo?.();
      `);
      expect(result).toBeUndefined();
    });

    it('calls foo when it is a function', async () => {
      const result = await interpreter.execute(`
        const obj = { foo() { return "called"; } };
        obj.foo?.();
      `);
      expect(result).toBe('called');
    });
  });

  // ── x?.() — direct optional call on identifier ───────────────────────

  describe('x?.() — direct optional call', () => {
    it('returns undefined when x is null', async () => {
      const result = await interpreter.execute(`
        const x = null;
        x?.();
      `);
      expect(result).toBeUndefined();
    });

    it('returns undefined when x is undefined', async () => {
      const result = await interpreter.execute(`
        const x = undefined;
        x?.();
      `);
      expect(result).toBeUndefined();
    });

    it('calls x when it is a function', async () => {
      const result = await interpreter.execute(`
        const x = () => 99;
        x?.();
      `);
      expect(result).toBe(99);
    });
  });

  // ── Chained optional calls ───────────────────────────────────────────

  describe('chained optional calls', () => {
    it('a?.b?.toString() where b is null', async () => {
      const result = await interpreter.execute(`
        const a = { b: null };
        a?.b?.toString();
      `);
      expect(result).toBeUndefined();
    });

    it('a?.b?.toString() where a is null', async () => {
      const result = await interpreter.execute(`
        const a = null;
        a?.b?.toString();
      `);
      expect(result).toBeUndefined();
    });

    it('a?.b?.toString() where both exist', async () => {
      const result = await interpreter.execute(`
        const a = { b: 42 };
        a?.b?.toString();
      `);
      expect(result).toBe('42');
    });

    it('obj.a.b?.toFixed(2) where b is null', async () => {
      const result = await interpreter.execute(`
        const obj = { a: { b: null } };
        obj.a.b?.toFixed(2);
      `);
      expect(result).toBeUndefined();
    });

    it('obj.a.b?.toFixed(2) where b is valid', async () => {
      const result = await interpreter.execute(`
        const obj = { a: { b: 3.14159 } };
        obj.a.b?.toFixed(2);
      `);
      expect(result).toBe('3.14');
    });
  });

  // ── Computed property access ─────────────────────────────────────────

  describe('computed property with optional chaining', () => {
    it('null?.[key]() returns undefined', async () => {
      const result = await interpreter.execute(`
        const x = null;
        const key = "toString";
        x?.[key]();
      `);
      expect(result).toBeUndefined();
    });

    it('obj?.[key]() calls method when valid', async () => {
      const result = await interpreter.execute(`
        const obj = "hello";
        const key = "toUpperCase";
        obj?.[key]();
      `);
      expect(result).toBe('HELLO');
    });
  });

  // ── Method arguments ─────────────────────────────────────────────────

  describe('optional chaining with method arguments', () => {
    it('does not evaluate arguments when short-circuiting', async () => {
      const result = await interpreter.execute(`
        let sideEffect = false;
        const x = null;
        x?.foo(sideEffect = true);
        sideEffect;
      `);
      // In JS spec, arguments are not evaluated when ?. short-circuits
      expect(result).toBe(false);
    });

    it('passes arguments correctly when method exists', async () => {
      const result = await interpreter.execute(`
        const arr = [3, 1, 2];
        arr?.join("-");
      `);
      expect(result).toBe('3-1-2');
    });

    it('passes multiple arguments when method exists', async () => {
      const result = await interpreter.execute(`
        const s = "hello world";
        s?.slice(0, 5);
      `);
      expect(result).toBe('hello');
    });
  });

  // ── Assignment and usage in expressions ──────────────────────────────

  describe('optional chaining call results in expressions', () => {
    it('assigns undefined to variable when short-circuited', async () => {
      const result = await interpreter.execute(`
        const x = null;
        const y = x?.toString();
        y;
      `);
      expect(result).toBeUndefined();
    });

    it('works with nullish coalescing', async () => {
      const result = await interpreter.execute(`
        const x = null;
        const y = x?.toString() ?? "fallback";
        y;
      `);
      expect(result).toBe('fallback');
    });

    it('works with logical OR', async () => {
      const result = await interpreter.execute(`
        const x = null;
        const y = x?.toString() || "default";
        y;
      `);
      expect(result).toBe('default');
    });

    it('works in ternary condition', async () => {
      const result = await interpreter.execute(`
        const x = null;
        x?.toString() ? "yes" : "no";
      `);
      expect(result).toBe('no');
    });

    it('works in if condition', async () => {
      const result = await interpreter.execute(`
        const x = null;
        let r = "not called";
        if (x?.toString()) {
          r = "called";
        }
        r;
      `);
      expect(result).toBe('not called');
    });
  });

  // ── User-defined functions ───────────────────────────────────────────

  describe('optional chaining with user-defined methods', () => {
    it('calls user-defined method via optional chaining', async () => {
      const result = await interpreter.execute(`
        const obj = {
          greet(name) { return "hello " + name; }
        };
        obj?.greet("world");
      `);
      expect(result).toBe('hello world');
    });

    it('returns undefined when object is null with user-defined method', async () => {
      const result = await interpreter.execute(`
        const obj = null;
        obj?.greet("world");
      `);
      expect(result).toBeUndefined();
    });
  });

  // ── Error cases that SHOULD still throw ──────────────────────────────

  describe('non-optional access should still throw', () => {
    it('x.method() throws when x is null (no optional chaining)', async () => {
      await expect(interpreter.execute(`
        const x = null;
        x.toString();
      `)).rejects.toThrow();
    });

    it('x.foo.bar() throws when foo is undefined (no optional chaining)', async () => {
      await expect(interpreter.execute(`
        const obj = { foo: undefined };
        obj.foo.bar();
      `)).rejects.toThrow();
    });
  });

  // ── Chaining call results ────────────────────────────────────────────

  describe('chaining on call results', () => {
    it('obj?.method().prop returns value when chain is valid', async () => {
      const result = await interpreter.execute(`
        const obj = {
          getData() { return { value: 42 }; }
        };
        obj?.getData().value;
      `);
      expect(result).toBe(42);
    });

    it('handles method returning null in chain', async () => {
      const result = await interpreter.execute(`
        const obj = {
          getData() { return null; }
        };
        obj?.getData()?.value;
      `);
      expect(result).toBeUndefined();
    });
  });

  // ── Array method optional chaining ───────────────────────────────────

  describe('array methods with optional chaining', () => {
    it('null?.map() returns undefined', async () => {
      const result = await interpreter.execute(`
        const arr = null;
        arr?.map(x => x * 2);
      `);
      expect(result).toBeUndefined();
    });

    it('null?.filter() returns undefined', async () => {
      const result = await interpreter.execute(`
        const arr = null;
        arr?.filter(x => x > 1);
      `);
      expect(result).toBeUndefined();
    });

    it('null?.forEach() returns undefined and does not iterate', async () => {
      const result = await interpreter.execute(`
        const arr = null;
        let count = 0;
        arr?.forEach(x => { count++; });
        count;
      `);
      expect(result).toBe(0);
    });

    it('[1,2,3]?.map() works normally', async () => {
      const result = await interpreter.execute(`
        const arr = [1, 2, 3];
        arr?.map(x => x * 2);
      `);
      expect(result).toEqual([2, 4, 6]);
    });
  });

  // ── Iteration pattern from issue ─────────────────────────────────────

  describe('real-world iteration pattern from issue', () => {
    it('iterating objects where some props are undefined', async () => {
      const result = await interpreter.execute(`
        const elements = [
          { innerText: "  hello  " },
          { innerText: undefined },
          { innerText: null },
          { innerText: "  world  " },
        ];
        const texts = [];
        for (const el of elements) {
          const text = el.innerText?.trim();
          texts.push(text);
        }
        texts;
      `);
      expect(result).toEqual(['hello', undefined, undefined, 'world']);
    });
  });
});
