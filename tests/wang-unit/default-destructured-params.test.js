import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Default Destructured Parameters', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        querySelectorAll: () => [{ textContent: ' Hi ' }],
      },
    });
    interpreter.setVariable('Promise', Promise);
  });

  it('should bind identifiers from defaulted object parameters in async callbacks', async () => {
    const result = await interpreter.execute(`
      const __arg = { suffix: "!", multiplier: 2 };
      const __el = querySelectorAll(".item")[0];
      const __fn = (async (el, { suffix = "", multiplier = 1 } = {}) => {
        const local = el.textContent.trim();
        await Promise.resolve();
        return local.repeat(multiplier) + suffix;
      });

      return await __fn(__el, __arg);
    `);

    expect(result).toBe('HiHi!');
  });

  it('should use object parameter default before nested property defaults', async () => {
    const result = await interpreter.execute(`
      function format({ prefix = ">", value = "empty", suffix = "<" } = {}) {
        return prefix + value + suffix;
      }

      return [
        format(),
        format({ value: "ok" }),
        format({ prefix: "[", suffix: "]" })
      ];
    `);

    expect(result).toEqual(['>empty<', '>ok<', '[empty]']);
  });

  it('should bind identifiers from defaulted array parameters', async () => {
    const result = await interpreter.execute(`
      const collect = ([first = 1, second = 2] = []) => {
        return [first, second];
      };

      return [
        collect(),
        collect([5]),
        collect([5, 6])
      ];
    `);

    expect(result).toEqual([[1, 2], [5, 2], [5, 6]]);
  });

  it('should handle nested defaulted object and array parameters', async () => {
    const result = await interpreter.execute(`
      function read({ item: { label = "missing" } = {}, counts: [first = 1] = [] } = {}) {
        return label + ":" + first;
      }

      return [
        read(),
        read({ item: { label: "found" } }),
        read({ counts: [9] }),
        read({ item: { label: "both" }, counts: [3] })
      ];
    `);

    expect(result).toEqual(['missing:1', 'found:1', 'missing:9', 'both:3']);
  });

  it('should bind defaulted destructured parameters for class methods', async () => {
    const result = await interpreter.execute(`
      class Formatter {
        format({ suffix = "!", multiplier = 1 } = {}) {
          return "Hi".repeat(multiplier) + suffix;
        }
      }

      const formatter = new Formatter();
      return [
        formatter.format(),
        formatter.format({ multiplier: 2 }),
        formatter.format({ suffix: "?" })
      ];
    `);

    expect(result).toEqual(['Hi!', 'HiHi!', 'Hi?']);
  });

  it('should bind defaulted destructured parameters for constructors', async () => {
    const result = await interpreter.execute(`
      class Widget {
        constructor({ name = "button", attrs: { role = "control" } = {} } = {}) {
          this.name = name;
          this.role = role;
        }
      }

      const a = new Widget();
      const b = new Widget({ name: "link", attrs: { role: "nav" } });
      return [
        a.name,
        a.role,
        b.name,
        b.role
      ];
    `);

    expect(result).toEqual(['button', 'control', 'link', 'nav']);
  });

  it('should keep rest parameter binding unchanged', async () => {
    const result = await interpreter.execute(`
      function collect(first, ...rest) {
        return [first, rest.length, rest[0], rest[1]];
      }

      return collect("a", "b", "c");
    `);

    expect(result).toEqual(['a', 2, 'b', 'c']);
  });
});
