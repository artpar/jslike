import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Reserved Keywords as Properties', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        Array: {
          from: Array.from,
          of: Array.of,
        },
        Promise: {
          resolve: Promise.resolve.bind(Promise),
        },
        Object: {
          is: Object.is,
          from: (obj) => ({ ...obj }),
        },
        console: {
          log: (...args) => args
        }
      }
    });
  });

  describe('Built-in methods with reserved names', () => {
    it('should access Array.from', async () => {
      const result = await interpreter.execute(`
        let arr = Array.from([1, 2, 3])
        return arr
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should access Array.of', async () => {
      const result = await interpreter.execute(`
        let arr = Array.of(1, 2, 3)
        return arr
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should access Promise.resolve', async () => {
      const result = await interpreter.execute(`
        let promise = Promise.resolve(42)
        return promise
      `);
      expect(await result).toBe(42);
    });

    it('should access Object.is', async () => {
      const result = await interpreter.execute(`
        let same = Object.is(1, 1)
        return same
      `);
      expect(result).toBe(true);
    });
  });

  describe('Object properties with reserved keywords', () => {
    it('should allow reserved keywords as object keys', async () => {
      const result = await interpreter.execute(`
        let obj = {
          from: "test",
          import: "value",
          export: 123,
          class: "myClass",
          function: "myFunc",
          if: true,
          else: false,
          return: "result",
          throw: "error",
          try: "attempt",
          catch: "handle",
          finally: "cleanup",
          for: "loop",
          while: "condition",
          do: "action",
          const: "constant",
          let: "variable",
          var: "oldvar",
          new: "instance",
          typeof: "type",
          instanceof: "check",
          in: "membership",
          of: "iteration"
        }
        return obj
      `);
      
      expect(result.from).toBe("test");
      expect(result.import).toBe("value");
      expect(result.export).toBe(123);
      expect(result.class).toBe("myClass");
      expect(result.function).toBe("myFunc");
      expect(result.if).toBe(true);
      expect(result.else).toBe(false);
      expect(result.return).toBe("result");
    });

    it('should access reserved keyword properties with dot notation', async () => {
      const result = await interpreter.execute(`
        let obj = {
          from: "source",
          import: "module",
          class: "definition"
        }
        return obj.from + " " + obj.import + " " + obj.class
      `);
      expect(result).toBe("source module definition");
    });

    it('should support optional chaining with reserved keywords', async () => {
      const result = await interpreter.execute(`
        let obj = { from: { import: { class: 42 } } }
        return obj?.from?.import?.class
      `);
      expect(result).toBe(42);
    });

    it('should support computed member access with reserved keywords', async () => {
      const result = await interpreter.execute(`
        let obj = { from: { import: { class: 42 } } }
        let nested = obj?.from?.["import"]?.class
        return nested
      `);
      expect(result).toBe(42);
    });
  });

  describe('Method chaining with reserved keywords', () => {
    it('should support method chaining across lines', async () => {
      // Re-create interpreter with builder function
      interpreter = new WangInterpreter({
        moduleResolver: resolver,
        functions: {
          ...interpreter.functions,
          builder: () => ({
            from: (val) => ({ value: val, import: () => ({ class: 'result' }) })
          })
        }
      });

      const result = await interpreter.execute(`
        let result = builder()
          .from("test")
          .import()
          .class
        return result
      `);
      expect(result).toBe('result');
    });

    // Pipeline test removed - not JavaScript compatible
  });

  describe('Edge cases', () => {
    it('should handle all reserved keywords as properties', async () => {
      const keywords = [
        'let', 'const', 'var', 'if', 'else', 'for', 'while', 'do',
        'break', 'continue', 'return', 'function', 'class', 'extends',
        'constructor', 'async', 'await', 'import', 'export', 'from', 'as',
        'try', 'catch', 'finally', 'throw', 'true', 'false', 'null',
        'undefined', 'this', 'super', 'new', 'typeof', 'instanceof', 'in', 'of'
      ];

      for (const keyword of keywords) {
        const result = await interpreter.execute(`
          let obj = { ${keyword}: "${keyword}Value" }
          return obj.${keyword}
        `);
        expect(result).toBe(`${keyword}Value`);
      }
    });

    it('should still parse reserved keywords correctly in their normal context', async () => {
      const result = await interpreter.execute(`
        let x = 10
        const y = 20
        if (x < y) {
          for (let i = 0; i < 3; i = i + 1) {
            x = x + 1
          }
        }
        return x
      `);
      expect(result).toBe(13);
    });
  });
});