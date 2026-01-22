import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Tagged Templates - Integration with Other Features', () => {
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
        Number: Number,
        React: {
          createElement: (type, props, ...children) => ({ type, props, children })
        }
      }
    });
  });

  describe('Integration with JSX', () => {
    it('should work with tagged templates inside JSX', async () => {
      const result = await interpreter.execute(`
        function css(strings, value) {
          return strings[0] + value;
        }

        const style = css\`color: \${'red'}\`;

        function Component() {
          return <div style={style}>Hello</div>;
        }

        Component()
      `);
      expect(result.type).toBe('div');
      expect(result.props.style).toBe('color: red');
    });

    it('should work with JSX inside tagged template expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, element) {
          return element;
        }

        tag\`Result: \${<div>JSX Content</div>}\`
      `);
      expect(result.type).toBe('div');
      expect(result.children[0]).toBe('JSX Content');
    });
  });

  describe('Integration with Classes', () => {
    it('should work with class methods as tags', async () => {
      const result = await interpreter.execute(`
        class Formatter {
          constructor(prefix) {
            this.prefix = prefix;
          }

          format(strings, value) {
            return this.prefix + strings[0] + value;
          }
        }

        const f = new Formatter('>>> ');
        f.format\`Value: \${42}\`
      `);
      expect(result).toBe('>>> Value: 42');
    });

    it('should work with static methods as tags', async () => {
      const result = await interpreter.execute(`
        class Utils {
          static tag(strings, value) {
            return 'Static: ' + value;
          }
        }

        Utils.tag\`Value \${123}\`
      `);
      expect(result).toBe('Static: 123');
    });

    it('should work with property returning tag functions', async () => {
      const result = await interpreter.execute(`
        class TagProvider {
          constructor() {
            this.myTag = (strings, value) => {
              return 'Property: ' + value;
            };
          }
        }

        const provider = new TagProvider();
        provider.myTag\`Value \${42}\`
      `);
      expect(result).toBe('Property: 42');
    });
  });

  describe('Integration with Async/Await', () => {
    it('should work in async function', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }

        async function main() {
          return tag\`Result: \${42}\`;
        }

        main()
      `);
      expect(result).toBe('Result: 42');
    });

    it('should work with async tag and await', async () => {
      const result = await interpreter.execute(`
        async function asyncTag(strings, value) {
          return strings[0] + value;
        }

        async function main() {
          return await asyncTag\`Result: \${42}\`;
        }

        main()
      `);
      expect(result).toBe('Result: 42');
    });

    it('should work with Promise.all and multiple tagged templates', async () => {
      const result = await interpreter.execute(`
        async function tag(strings, value) {
          return value;
        }

        async function main() {
          const results = await Promise.all([
            tag\`\${1}\`,
            tag\`\${2}\`,
            tag\`\${3}\`
          ]);
          return results.reduce((a, b) => a + b, 0);
        }

        main()
      `);
      expect(result).toBe(6);
    });
  });

  describe('Integration with Destructuring', () => {
    it('should work with destructured tag functions', async () => {
      const result = await interpreter.execute(`
        const obj = {
          tag: (strings, value) => strings[0] + value
        };

        const { tag } = obj;
        tag\`Value: \${42}\`
      `);
      expect(result).toBe('Value: 42');
    });

    it('should work with array destructuring', async () => {
      const result = await interpreter.execute(`
        const tags = [
          (strings, value) => 'First: ' + value,
          (strings, value) => 'Second: ' + value
        ];

        const [, secondTag] = tags;
        secondTag\`Value \${99}\`
      `);
      expect(result).toBe('Second: 99');
    });
  });

  describe('Integration with Spread/Rest', () => {
    it('should work with array spread in tag function', async () => {
      const result = await interpreter.execute(`
        function tag(strings, arr) {
          return [...arr].reduce((a, b) => a + b, 0);
        }

        const arr = [1, 2, 3];
        tag\`\${arr}\`
      `);
      expect(result).toBe(6);
    });

    it('should work with rest parameters in tag function', async () => {
      const result = await interpreter.execute(`
        function tag(strings, first, ...rest) {
          return first + rest.reduce((a, b) => a + b, 0);
        }

        tag\`\${1}\${2}\${3}\${4}\`
      `);
      expect(result).toBe(10); // 1 + (2+3+4)
    });
  });

  describe('Integration with Modules', () => {
    it('should work with exported tag functions', async () => {
      resolver.addModule('tagLib', `
        export function customTag(strings, value) {
          return 'Custom: ' + value;
        }
      `);

      const result = await interpreter.execute(`
        import { customTag } from 'tagLib';
        customTag\`Value \${42}\`
      `);
      expect(result).toBe('Custom: 42');
    });

    it('should work with named export tag', async () => {
      resolver.addModule('namedTag', `
        export const myTag = function(strings, value) {
          return 'Named: ' + value;
        }
      `);

      const result = await interpreter.execute(`
        import { myTag } from 'namedTag';
        myTag\`Value \${123}\`
      `);
      expect(result).toBe('Named: 123');
    });
  });

  describe('Integration with Control Flow', () => {
    it('should work inside if statements', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return value;
        }

        let result;
        if (true) {
          result = tag\`\${42}\`;
        }
        result
      `);
      expect(result).toBe(42);
    });

    it('should work inside loops', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return value * 2;
        }

        const results = [];
        for (let i = 0; i < 3; i++) {
          results.push(tag\`\${i}\`);
        }
        results
      `);
      expect(result).toEqual([0, 2, 4]);
    });

    it('should work with switch statements', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return value;
        }

        let x = 2;
        let result;
        switch (x) {
          case 1:
            result = tag\`\${10}\`;
            break;
          case 2:
            result = tag\`\${20}\`;
            break;
          default:
            result = tag\`\${30}\`;
        }
        result
      `);
      expect(result).toBe(20);
    });

    it('should work with while loops', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return value;
        }

        let i = 0;
        let sum = 0;
        while (i < 3) {
          sum += tag\`\${i}\`;
          i++;
        }
        sum
      `);
      expect(result).toBe(3); // 0 + 1 + 2
    });
  });

  describe('Integration with Closures', () => {
    it('should work with closures capturing variables', async () => {
      const result = await interpreter.execute(`
        function createTag(prefix) {
          return function(strings, value) {
            return prefix + strings[0] + value;
          };
        }

        const tag = createTag('PREFIX: ');
        tag\`Value \${42}\`
      `);
      expect(result).toBe('PREFIX: Value 42');
    });

    it('should work with nested closures', async () => {
      const result = await interpreter.execute(`
        function outer(a) {
          return function middle(b) {
            return function tag(strings, value) {
              return a + b + value;
            };
          };
        }

        const tag = outer(10)(20);
        tag\`\${5}\`
      `);
      expect(result).toBe(35);
    });
  });

  describe('Integration with Conditional Access', () => {
    it('should work with conditional tag access', async () => {
      const result = await interpreter.execute(`
        const obj = {
          tag: (strings, value) => strings[0] + value
        };

        const tag = obj && obj.tag;
        tag ? tag\`Value: \${42}\` : 'no tag'
      `);
      expect(result).toBe('Value: 42');
    });

    it('should handle null object gracefully', async () => {
      const result = await interpreter.execute(`
        const obj = null;
        const tag = obj && obj.tag;
        tag ? tag\`Value: \${42}\` : 'no tag'
      `);
      expect(result).toBe('no tag');
    });
  });

  describe('Integration with Ternary Operators', () => {
    it('should work in ternary expressions', async () => {
      const result = await interpreter.execute(`
        function tag1(strings, value) {
          return 'tag1: ' + value;
        }
        function tag2(strings, value) {
          return 'tag2: ' + value;
        }

        const useTag1 = true;
        (useTag1 ? tag1 : tag2)\`Value \${42}\`
      `);
      expect(result).toBe('tag1: 42');
    });

    it('should work as ternary condition', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return value > 10;
        }

        tag\`\${20}\` ? 'yes' : 'no'
      `);
      expect(result).toBe('yes');
    });
  });

  describe('Integration with Regular Expressions', () => {
    it('should work with regex in expressions', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return strings[0] + value;
        }

        const pattern = /test/i;
        tag\`Pattern: \${pattern}\`
      `);
      expect(result).toBe('Pattern: /test/i');
    });

    it('should work with regex test in tag function', async () => {
      const result = await interpreter.execute(`
        function tag(strings, value) {
          return /^\\d+$/.test(value);
        }

        tag\`\${'123'}\`
      `);
      expect(result).toBe(true);
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should work for SQL query builder', async () => {
      const result = await interpreter.execute(`
        function sql(strings, ...values) {
          let query = '';
          for (let i = 0; i < values.length; i++) {
            query += strings[i] + '?';
          }
          query += strings[strings.length - 1];
          return { query, values };
        }

        const userId = 123;
        const status = 'active';

        sql\`SELECT * FROM users WHERE id = \${userId} AND status = \${status}\`
      `);
      expect(result.query).toBe('SELECT * FROM users WHERE id = ? AND status = ?');
      expect(result.values).toEqual([123, 'active']);
    });

    it('should work for styled components pattern', async () => {
      const result = await interpreter.execute(`
        function styled(strings, ...values) {
          let css = '';
          for (let i = 0; i < values.length; i++) {
            css += strings[i] + values[i];
          }
          css += strings[strings.length - 1];
          return css.trim();
        }

        const primaryColor = 'blue';
        const fontSize = '16px';

        styled\`
          color: \${primaryColor};
          font-size: \${fontSize};
          padding: 10px;
        \`
      `);
      expect(result).toContain('color: blue');
      expect(result).toContain('font-size: 16px');
    });

    it('should work for GraphQL queries', async () => {
      const result = await interpreter.execute(`
        function gql(strings, ...values) {
          let query = '';
          for (let i = 0; i < strings.length; i++) {
            query += strings[i];
            if (i < values.length) {
              query += values[i];
            }
          }
          return query.trim();
        }

        const userId = 'user123';

        gql\`
          query {
            user(id: "\${userId}") {
              name
              email
            }
          }
        \`
      `);
      expect(result).toContain('user(id: "user123")');
    });
  });
});
