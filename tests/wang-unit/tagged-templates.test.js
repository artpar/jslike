import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Tagged Template Literals', () => {
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
          stringify: (v) => JSON.stringify(v)
        },
        Math: Math,
        Object: Object
      }
    });
  });

  describe('Basic Tagged Templates', () => {
    it('should handle simple tag function with no expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return strings[0];
        }
        tag\`Hello, World!\`
      `);
      expect(result).toBe('Hello, World!');
    });

    it('should handle tag with single expression', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value + strings[1];
        }
        let name = "World"
        tag\`Hello, \${name}!\`
      `);
      expect(result).toBe('Hello, World!');
    });

    it('should handle tag with multiple expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          let result = '';
          for (let i = 0; i < values.length; i++) {
            result += strings[i] + values[i];
          }
          result += strings[strings.length - 1];
          return result;
        }
        tag\`a\${1}b\${2}c\${3}d\`
      `);
      expect(result).toBe('a1b2c3d');
    });

    it('should pass correct number of strings and values', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          return strings.length + values.length;
        }
        tag\`a\${1}b\${2}c\`
      `);
      expect(result).toBe(5); // 3 strings + 2 values
    });
  });

  describe('Strings Array Properties', () => {
    it('should have strings.raw property', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return strings.raw !== undefined;
        }
        tag\`test\`
      `);
      expect(result).toBe(true);
    });

    it('should have correct raw values', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return strings.raw[0];
        }
        tag\`Hello\\nWorld\`
      `);
      expect(result).toBe('Hello\\nWorld');
    });

    it('should have correct cooked values', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return strings[0];
        }
        tag\`Hello\\nWorld\`
      `);
      expect(result).toBe('Hello\nWorld');
    });

    it('should have frozen strings array', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return Object.isFrozen(strings);
        }
        tag\`test\`
      `);
      expect(result).toBe(true);
    });

    it('should have frozen raw array', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return Object.isFrozen(strings.raw);
        }
        tag\`test\`
      `);
      expect(result).toBe(true);
    });

    it('should have non-enumerable raw property', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          const descriptor = Object.getOwnPropertyDescriptor(strings, 'raw');
          return descriptor.enumerable;
        }
        tag\`test\`
      `);
      expect(result).toBe(false);
    });
  });

  describe('This Context Preservation', () => {
    it('should preserve this context for member expression tag', async () => {
      const result = await interpreter.execute(`
        const obj = {
          name: 'MyObject',
          tag: function(strings, value) {
            return this.name + ': ' + strings[0] + value;
          }
        };
        obj.tag\`Value is \${42}\`
      `);
      expect(result).toBe('MyObject: Value is 42');
    });

    it('should preserve this for computed member expression', async () => {
      const result = await interpreter.execute(`
        const obj = {
          name: 'Test',
          tag: function(strings) {
            return this.name;
          }
        };
        const key = 'tag';
        obj[key]\`test\`
      `);
      expect(result).toBe('Test');
    });

    it('should not bind this for arrow function tags', async () => {
      const result = await interpreter.execute(`
        const obj = {
          name: 'MyObject',
          tag: (strings) => strings[0]
        };
        obj.tag\`hello\`
      `);
      expect(result).toBe('hello');
    });

    it('should preserve this for nested member expressions', async () => {
      const result = await interpreter.execute(`
        const outer = {
          inner: {
            value: 'nested',
            tag: function(strings) {
              return this.value;
            }
          }
        };
        outer.inner.tag\`test\`
      `);
      expect(result).toBe('nested');
    });
  });

  describe('Complex Tag Functions', () => {
    it('should handle tag returning object', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          return {
            strings: strings,
            values: values
          };
        }
        const res = tag\`a\${1}b\`;
        res.values[0]
      `);
      expect(result).toBe(1);
    });

    it('should handle tag with destructuring', async () => {
      const result = await interpreter.execute(`
        function tag([first, second], value) {
          return first + value + second;
        }
        tag\`Hello \${', '} World\`
      `);
      expect(result).toBe('Hello ,  World'); // Note: space before World is from template
    });

    it('should handle higher-order tag function', async () => {
      const result = await interpreter.execute(`
        function createTag(prefix) {
          return function(strings, ...values) {
            return prefix + strings[0] + values[0];
          };
        }
        const myTag = createTag('PREFIX: ');
        myTag\`Message: \${'test'}\`
      `);
      expect(result).toBe('PREFIX: Message: test');
    });

    it('should handle tag with complex logic', async () => {
      const result = await interpreter.execute(`
        function sql(strings, ...values) {
          let query = '';
          for (let i = 0; i < values.length; i++) {
            query += strings[i];
            query += '?' + (i + 1);
          }
          query += strings[strings.length - 1];
          return query;
        }
        sql\`SELECT * FROM users WHERE id = \${123} AND name = \${'john'}\`
      `);
      expect(result).toBe('SELECT * FROM users WHERE id = ?1 AND name = ?2');
    });
  });

  describe('User-Defined Tag Functions', () => {
    it('should work with function declaration', async () => {
      const result = await interpreter.execute(`
        function myTag(strings, value) {
          return strings[0] + value;
        }
        myTag\`Result: \${42}\`
      `);
      expect(result).toBe('Result: 42');
    });

    it('should work with arrow function', async () => {
      const result = await interpreter.execute(`
        const myTag = (strings, ...values) => strings[0] + values.join(',');
        myTag\`Values: \${1}\${2}\${3}\`
      `);
      expect(result).toBe('Values: 1,2,3');
    });

    it('should work with function expression', async () => {
      const result = await interpreter.execute(`
        const myTag = function(strings) {
          return strings[0].toUpperCase();
        };
        myTag\`hello\`
      `);
      expect(result).toBe('HELLO');
    });

    it('should work with method in object literal', async () => {
      const result = await interpreter.execute(`
        const obj = {
          process(strings, value) {
            return 'Processed: ' + value;
          }
        };
        obj.process\`Value \${100}\`
      `);
      expect(result).toBe('Processed: 100');
    });
  });

  describe('Async Tagged Templates', () => {
    it('should handle async tag function', async () => {
      const result = await interpreter.execute(`
        async function asyncTag(strings, value) {
          return strings[0] + value;
        }
        asyncTag\`Result: \${42}\`
      `);
      expect(result).toBe('Result: 42');
    });

    it('should handle await in expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }
        async function getData() {
          return 'async data';
        }
        tag\`Data: \${await getData()}\`
      `);
      expect(result).toBe('Data: async data');
    });

    it('should handle async tag with await in expressions', async () => {
      const result = await interpreter.execute(`
        async function asyncTag(strings, value) {
          return strings[0] + value;
        }
        async function getValue() {
          return 'value';
        }
        asyncTag\`Result: \${await getValue()}\`
      `);
      expect(result).toBe('Result: value');
    });

    it('should handle multiple awaits in expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          return values.join('-');
        }
        async function get(n) {
          return n;
        }
        tag\`\${await get(1)}\${await get(2)}\${await get(3)}\`
      `);
      expect(result).toBe('1-2-3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty template', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return strings.length;
        }
        tag\`\`
      `);
      expect(result).toBe(1);
    });

    it('should handle template with only expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, ...values) {
          return strings.length === values.length + 1;
        }
        tag\`\${1}\${2}\${3}\`
      `);
      expect(result).toBe(true);
    });

    it('should handle special characters in template', async () => {
      const result = await interpreter.execute(`
        function tag(strings) {
          return strings[0];
        }
        tag\`Hello\\tWorld\\n!\`
      `);
      expect(result).toBe('Hello\tWorld\n!');
    });

    it('should handle nested templates in expressions', async () => {
      const result = await interpreter.execute(`
        function outer(strings, value) {
          return 'outer:' + strings[0] + value;
        }
        function inner(strings, value) {
          return 'inner:' + strings[0] + value;
        }
        outer\`result \${inner\`value \${42}\`}\`
      `);
      expect(result).toBe('outer:result inner:value 42');
    });

    it('should handle undefined in expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }
        let x;
        tag\`Value: \${x}\`
      `);
      expect(result).toBe('Value: undefined');
    });

    it('should handle null in expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }
        tag\`Value: \${null}\`
      `);
      expect(result).toBe('Value: null');
    });

    it('should handle complex expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }
        tag\`Result: \${1 + 2 * 3}\`
      `);
      expect(result).toBe('Result: 7');
    });
  });

  describe('Error Handling', () => {
    it('should throw TypeError for non-function tag', async () => {
      await expect(interpreter.execute(`
        const notAFunction = 42;
        notAFunction\`test\`
      `)).rejects.toThrow(TypeError);
    });

    it('should throw error for undefined tag', async () => {
      await expect(interpreter.execute(`
        undefinedTag\`test\`
      `)).rejects.toThrow();
    });

    it('should throw error for null tag', async () => {
      await expect(interpreter.execute(`
        const nullTag = null;
        nullTag\`test\`
      `)).rejects.toThrow(TypeError);
    });

    it('should propagate errors thrown by tag function', async () => {
      await expect(interpreter.execute(`
        function errorTag(strings) {
          throw new Error('Tag error');
        }
        errorTag\`test\`
      `)).rejects.toThrow('Tag error');
    });
  });

  describe('Real-World Use Cases', () => {
    it('should handle styled-components style usage', async () => {
      const result = await interpreter.execute(`
        function css(strings, ...values) {
          let result = '';
          for (let i = 0; i < values.length; i++) {
            result += strings[i] + values[i];
          }
          result += strings[strings.length - 1];
          return result;
        }
        const color = 'blue';
        const size = '14px';
        css\`
          color: \${color};
          font-size: \${size};
        \`
      `);
      expect(result).toContain('color: blue');
      expect(result).toContain('font-size: 14px');
    });

    it('should handle i18n style usage', async () => {
      const result = await interpreter.execute(`
        function t(strings, ...values) {
          // Simplified i18n function
          return strings[0] + values[0] + strings[1];
        }
        const name = 'Alice';
        t\`Hello, \${name}!\`
      `);
      expect(result).toBe('Hello, Alice!');
    });

    it('should handle HTML template usage', async () => {
      const result = await interpreter.execute(`
        function html(strings, ...values) {
          let result = '';
          for (let i = 0; i < values.length; i++) {
            result += strings[i] + values[i];
          }
          result += strings[strings.length - 1];
          return result;
        }
        const title = 'My Page';
        const content = 'Hello World';
        html\`<div><h1>\${title}</h1><p>\${content}</p></div>\`
      `);
      expect(result).toBe('<div><h1>My Page</h1><p>Hello World</p></div>');
    });
  });
});
