import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Tagged Templates - Advanced Edge Cases', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        console: { log: () => {} },
        JSON: { stringify: (v) => JSON.stringify(v) },
        Math: Math,
        Object: Object,
        Array: Array,
        String: String,
        Number: Number
      }
    });
  });

  describe('Complex Expressions as Tags', () => {
    it('should handle IIFE as tag', async () => {
      const result = await interpreter.execute(`
        (function(strings, value) {
          return strings[0] + value + strings[1];
        })\`Hello \${', World'}!\`
      `);
      expect(result).toBe('Hello , World!');
    });

    it('should handle arrow IIFE as tag', async () => {
      const result = await interpreter.execute(`
        ((strings, value) => strings[0] + value)\`Result: \${42}\`
      `);
      expect(result).toBe('Result: 42');
    });

    it('should handle function call result as tag', async () => {
      const result = await interpreter.execute(`
        function createTag() {
          return function(strings, value) {
            return 'Tagged: ' + value;
          };
        }
        createTag()\`Value \${123}\`
      `);
      expect(result).toBe('Tagged: 123');
    });

    it('should handle conditional expression tag', async () => {
      const result = await interpreter.execute(`
        function tag1(strings, value) {
          return 'tag1: ' + value;
        }
        function tag2(strings, value) {
          return 'tag2: ' + value;
        }
        let useTag1 = true;
        (useTag1 ? tag1 : tag2)\`Value \${42}\`
      `);
      expect(result).toBe('tag1: 42');
    });

    it('should handle array element as tag', async () => {
      const result = await interpreter.execute(`
        const tags = [
          (strings, value) => 'first: ' + value,
          (strings, value) => 'second: ' + value
        ];
        tags[1]\`Value \${99}\`
      `);
      expect(result).toBe('second: 99');
    });

    it('should handle deeply nested member expression', async () => {
      const result = await interpreter.execute(`
        const a = {
          b: {
            c: {
              d: {
                tag: function(strings, value) {
                  return this.name + ': ' + value;
                },
                name: 'Deep'
              }
            }
          }
        };
        a.b.c.d.tag\`Value \${42}\`
      `);
      expect(result).toBe('Deep: 42');
    });
  });

  describe('Complex Template Structures', () => {
    it('should handle many expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          return values.length;
        }
        tag\`\${1}\${2}\${3}\${4}\${5}\${6}\${7}\${8}\${9}\${10}\`
      `);
      expect(result).toBe(10);
    });

    it('should handle long strings in template', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return strings[0].length;
        }
        tag\`${'x'.repeat(1000)}\`
      `);
      expect(result).toBe(1000);
    });

    it('should handle unicode in templates', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value + strings[1];
        }
        tag\`Hello 👋 \${'World 🌍'}!\`
      `);
      expect(result).toBe('Hello 👋 World 🌍!');
    });

    it('should handle escape sequences correctly', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return {
            cooked: strings[0],
            raw: strings.raw[0]
          };
        }
        const res = tag\`Line1\\nLine2\\tTab\`;
        res.cooked.includes('\\n') && res.raw === 'Line1\\\\nLine2\\\\tTab'
      `);
      expect(result).toBe(true);
    });

    it('should handle quotes in templates', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value + strings[1];
        }
        tag\`He said "Hello" and '\${42}' end\`
      `);
      expect(result).toBe('He said "Hello" and \'42\' end');
    });

    it('should handle backticks in expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }
        const inner = \`nested\`;
        tag\`Value: \${inner}\`
      `);
      expect(result).toBe('Value: nested');
    });
  });

  describe('Interaction with Language Features', () => {
    it('should work with destructuring in tag parameters', async () => {
      const result = await interpreter.execute(`
        function tag([first, ...rest], ...values) {
          return first + rest.join('') + values.join(',');
        }
        tag\`a\${1}b\${2}c\`
      `);
      expect(result).toBe('abc1,2');
    });

    it('should work with spread in tag call', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          return [...values].reduce((a, b) => a + b, 0);
        }
        tag\`\${1}\${2}\${3}\`
      `);
      expect(result).toBe(6);
    });

    it('should work with rest parameters', async () => {
      const result = await interpreter.execute(`
        function tag(strings, first, ...rest) {
          return first + rest.length;
        }
        tag\`\${1}\${2}\${3}\${4}\`
      `);
      expect(result).toBe(4); // 1 + 3
    });

    it('should work with default parameters', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value = 'default') {
          return strings[0] + value;
        }
        tag\`Value: \`
      `);
      expect(result).toBe('Value: default');
    });

    it('should work inside class methods', async () => {
      const result = await interpreter.execute(`
        class Formatter {
          constructor(prefix) {
            this.prefix = prefix;
          }

          tag(strings, value) {
            return this.prefix + strings[0] + value;
          }
        }
        const f = new Formatter('PREFIX: ');
        f.tag\`Value \${42}\`
      `);
      expect(result).toBe('PREFIX: Value 42');
    });

    it('should work with arrow functions preserving outer this', async () => {
      const result = await interpreter.execute(`
        function createObject() {
          const obj = {
            name: 'Outer',
            createTag() {
              return (strings, value) => {
                return strings[0] + value;
              };
            }
          };
          return obj;
        }
        const obj = createObject();
        const tag = obj.createTag();
        tag\`Value \${123}\`
      `);
      expect(result).toBe('Value 123');
    });

    it('should work with try-catch', async () => {
      const result = await interpreter.execute(`
        function errorTag(strings, value) {
          if (value > 10) throw new Error('Too big');
          return strings[0] + value;
        }

        let result;
        try {
          result = errorTag\`Value: \${5}\`;
        } catch (e) {
          result = 'error';
        }
        result
      `);
      expect(result).toBe('Value: 5');
    });

    it('should work inside loops', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return value * 2;
        }

        let sum = 0;
        for (let i = 0; i < 3; i++) {
          sum += tag\`Value \${i}\`;
        }
        sum
      `);
      expect(result).toBe(6); // 0 + 2 + 4
    });

    it('should work with object shorthand', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }

        const x = 42;
        const obj = { tag };
        obj.tag\`Value: \${x}\`
      `);
      expect(result).toBe('Value: 42');
    });
  });

  describe('Async/Await Complex Cases', () => {
    it('should handle promise in tag expression', async () => {
      const result = await interpreter.execute(`
        async function tag(strings, value) {
          const resolved = await value;
          return strings[0] + resolved;
        }

        tag\`Result: \${Promise.resolve(42)}\`
      `);
      expect(result).toBe('Result: 42');
    });

    it('should handle async tag with multiple awaits in expressions', async () => {
      const result = await interpreter.execute(`
        async function tag(strings, ...values) {
          return values.reduce((a, b) => a + b, 0);
        }

        async function getNum(n) {
          return n;
        }

        tag\`\${await getNum(1)}\${await getNum(2)}\${await getNum(3)}\`
      `);
      expect(result).toBe(6);
    });

    it('should handle tag that returns promise', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return new Promise(resolve => {
            resolve(strings[0] + value);
          });
        }

        await tag\`Value: \${42}\`
      `);
      expect(result).toBe('Value: 42');
    });

    it('should handle async IIFE tag', async () => {
      const result = await interpreter.execute(`
        (async function(strings, value) {
          return strings[0] + value;
        })\`Result: \${42}\`
      `);
      expect(result).toBe('Result: 42');
    });
  });

  describe('Error Cases and Edge Conditions', () => {
    it('should throw for string as tag', async () => {
      await expect(interpreter.execute(`
        const notAFunction = "string";
        notAFunction\`test\`
      `)).rejects.toThrow(TypeError);
    });

    it('should throw for number as tag', async () => {
      await expect(interpreter.execute(`
        const notAFunction = 123;
        notAFunction\`test\`
      `)).rejects.toThrow(TypeError);
    });

    it('should throw for object as tag', async () => {
      await expect(interpreter.execute(`
        const notAFunction = { tag: 'value' };
        notAFunction\`test\`
      `)).rejects.toThrow(TypeError);
    });

    it('should throw for array as tag', async () => {
      await expect(interpreter.execute(`
        const notAFunction = [1, 2, 3];
        notAFunction\`test\`
      `)).rejects.toThrow(TypeError);
    });

    it('should handle tag function returning undefined', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          // no return
        }
        tag\`Value: \${42}\`
      `);
      expect(result).toBeUndefined();
    });

    it('should handle tag function returning null', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return null;
        }
        tag\`Value: \${42}\`
      `);
      expect(result).toBeNull();
    });

    it('should handle expressions that throw', async () => {
      await expect(interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }

        function throwError() {
          throw new Error('Expression error');
        }

        tag\`Value: \${throwError()}\`
      `)).rejects.toThrow('Expression error');
    });

    it('should handle accessing undefined property as tag', async () => {
      await expect(interpreter.execute(`
        const obj = {};
        obj.nonexistent\`test\`
      `)).rejects.toThrow(TypeError);
    });

    it('should handle null object member access', async () => {
      await expect(interpreter.execute(`
        const obj = null;
        obj.tag\`test\`
      `)).rejects.toThrow();
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle deeply nested tagged templates', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          if (value !== undefined) {
            return value;
          }
          return strings[0];
        }

        tag\`\${tag\`\${tag\`\${tag\`\${tag\`deep\`}\`}\`}\`}\`
      `);
      expect(result).toBe('deep');
    });

    it('should handle many tagged templates in sequence', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return value;
        }

        const a = tag\`\${1}\`;
        const b = tag\`\${2}\`;
        const c = tag\`\${3}\`;
        const d = tag\`\${4}\`;
        const e = tag\`\${5}\`;

        a + b + c + d + e
      `);
      expect(result).toBe(15);
    });

    it('should handle tagged template with many string parts', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          return strings.length === values.length + 1;
        }

        tag\`a\${1}b\${2}c\${3}d\${4}e\${5}f\${6}g\${7}h\${8}i\${9}j\${10}k\`
      `);
      expect(result).toBe(true);
    });
  });

  describe('Real GitHub Issue Example', () => {
    it('should handle the exact example from issue #1', async () => {
      const result = await interpreter.execute(`
        function html(strings, ...values) {
          let result = '';
          for (let i = 0; i < values.length; i++) {
            result += strings[i] + values[i];
          }
          result += strings[strings.length - 1];
          return result;
        }

        html\`<div>\${"hello"}</div>\`
      `);
      expect(result).toBe('<div>hello</div>');
    });

    it('should work for browser extension UI generation use case', async () => {
      const result = await interpreter.execute(`
        function ui(strings, ...values) {
          let html = '';
          for (let i = 0; i < values.length; i++) {
            html += strings[i];
            // Simulate escaping for safety
            html += String(values[i]);
          }
          html += strings[strings.length - 1];
          return html;
        }

        const title = 'My Extension';
        const content = 'Hello World';
        const onClick = 'handleClick()';

        ui\`
          <div class="popup">
            <h1>\${title}</h1>
            <p>\${content}</p>
            <button onclick="\${onClick}">Click Me</button>
          </div>
        \`
      `);
      expect(result).toContain('<h1>My Extension</h1>');
      expect(result).toContain('<p>Hello World</p>');
      expect(result).toContain('onclick="handleClick()"');
    });
  });

  describe('Immutability Verification', () => {
    it('should prevent modification of strings array', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          try {
            strings[0] = 'modified';
            return false;
          } catch (e) {
            return true;
          }
        }
        tag\`original\`
      `);
      expect(result).toBe(true);
    });

    it('should prevent modification of raw array', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          try {
            strings.raw[0] = 'modified';
            return false;
          } catch (e) {
            return true;
          }
        }
        tag\`original\`
      `);
      expect(result).toBe(true);
    });

    it('should prevent adding properties to strings array', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          try {
            strings.newProp = 'value';
            return false;
          } catch (e) {
            return true;
          }
        }
        tag\`test\`
      `);
      expect(result).toBe(true);
    });

    it('should verify raw property descriptor', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          const desc = Object.getOwnPropertyDescriptor(strings, 'raw');
          return !desc.writable && !desc.enumerable && !desc.configurable;
        }
        tag\`test\`
      `);
      expect(result).toBe(true);
    });
  });
});
