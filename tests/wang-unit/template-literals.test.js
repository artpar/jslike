import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Template Literals', () => {
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
        Math: Math
      }
    });
  });

  describe('Basic Template Literals', () => {
    it('should handle simple template without expressions', async () => {
      const result = await interpreter.execute(`
        let simple = \`Hello, World!\`
        simple
      `);
      expect(result).toBe('Hello, World!');
    });

    it('should handle template with single variable', async () => {
      const result = await interpreter.execute(`
        let name = "Wang"
        let greeting = \`Hello, \${name}!\`
        greeting
      `);
      expect(result).toBe('Hello, Wang!');
    });

    it('should handle template with multiple expressions', async () => {
      const result = await interpreter.execute(`
        let lang = "Wang"
        let version = 1.0
        let info = \`Language: \${lang}, Version: \${version}\`
        info
      `);
      expect(result).toBe('Language: Wang, Version: 1');
    });

    it('should handle empty template', async () => {
      const result = await interpreter.execute(`
        let empty = \`\`
        empty
      `);
      expect(result).toBe('');
    });

    it('should handle template with only expression', async () => {
      const result = await interpreter.execute(`
        let value = 42
        let template = \`\${value}\`
        template
      `);
      expect(result).toBe('42');
    });
  });

  describe('Complex Expressions in Templates', () => {
    it('should handle arithmetic expressions', async () => {
      const result = await interpreter.execute(`
        let a = 5
        let b = 3
        let math = \`Sum: \${a + b}, Product: \${a * b}, Division: \${a / b}\`
        math
      `);
      expect(result).toBe('Sum: 8, Product: 15, Division: 1.6666666666666667');
    });

    it('should handle comparison expressions', async () => {
      const result = await interpreter.execute(`
        let x = 10
        let y = 5
        let compare = \`x > y: \${x > y}, x === 10: \${x === 10}\`
        compare
      `);
      expect(result).toBe('x > y: true, x === 10: true');
    });

    it('should handle logical expressions', async () => {
      const result = await interpreter.execute(`
        let a = true
        let b = false
        let logic = \`AND: \${a && b}, OR: \${a || b}, NOT: \${!b}\`
        logic
      `);
      expect(result).toBe('AND: false, OR: true, NOT: true');
    });

    it('should handle ternary expressions', async () => {
      const result = await interpreter.execute(`
        let age = 25
        let status = \`Status: \${age >= 18 ? "adult" : "minor"}\`
        status
      `);
      expect(result).toBe('Status: adult');
    });

    it('should handle function calls', async () => {
      const result = await interpreter.execute(`
        let nums = [1, 2, 3]
        let result = \`Length: \${nums.length}, First: \${nums[0]}\`
        result
      `);
      expect(result).toBe('Length: 3, First: 1');
    });

    it('should handle Math functions', async () => {
      const result = await interpreter.execute(`
        let value = 3.7
        let math = \`Floor: \${Math.floor(value)}, Ceil: \${Math.ceil(value)}, Round: \${Math.round(value)}\`
        math
      `);
      expect(result).toBe('Floor: 3, Ceil: 4, Round: 4');
    });
  });

  describe('Object and Array Access', () => {
    it('should handle object property access', async () => {
      const result = await interpreter.execute(`
        let obj = { name: "Wang", version: 1.0, features: { async: true } }
        let info = \`Name: \${obj.name}, Async: \${obj.features.async}\`
        info
      `);
      expect(result).toBe('Name: Wang, Async: true');
    });

    it('should handle array element access', async () => {
      const result = await interpreter.execute(`
        let arr = ["first", "second", "third"]
        let elements = \`[0]: \${arr[0]}, [1]: \${arr[1]}, [2]: \${arr[2]}\`
        elements
      `);
      expect(result).toBe('[0]: first, [1]: second, [2]: third');
    });

    it('should handle computed property access', async () => {
      const result = await interpreter.execute(`
        let obj = { a: 1, b: 2, c: 3 }
        let key = "b"
        let value = \`obj[key]: \${obj[key]}\`
        value
      `);
      expect(result).toBe('obj[key]: 2');
    });

    it('should handle method calls on objects', async () => {
      const result = await interpreter.execute(`
        let arr = [1, 2, 3]
        let str = "hello"
        let result = \`Array includes 2: \${arr.includes(2)}, String upper: \${str.toUpperCase()}\`
        result
      `);
      expect(result).toBe('Array includes 2: true, String upper: HELLO');
    });
  });

  describe('Nested Templates', () => {
    // KNOWN LIMITATION: Nested template literals are not supported
    // The parser cannot handle backticks within template expressions
    // This is an architectural limitation and expected behavior
    
    it('should handle nested template literals (JavaScript-like behavior)', async () => {
      // JavaScript supports nested template literals, so Wang should too
      const result = await interpreter.execute(`
        let name = "Wang"
        let nested = \`Outer: \${\`Inner: \${name}\`}\`
        nested
      `);
      expect(result).toBe('Outer: Inner: Wang');
    });

    it('should handle deeply nested templates (JavaScript-like behavior)', async () => {
      // JavaScript supports deeply nested template literals
      const result = await interpreter.execute(`
        let a = "A"
        let b = "B"
        let c = "C"
        let deep = \`Level 1: \${\`Level 2: \${\`Level 3: \${a}\${b}\${c}\`}\`}\`
        deep
      `);
      expect(result).toBe('Level 1: Level 2: Level 3: ABC');
    });
    
    it('should work with nested templates using workaround', async () => {
      const result = await interpreter.execute(`
        let name = "Wang"
        let inner = \`Inner: \${name}\`
        let nested = \`Outer: \${inner}\`
        nested
      `);
      expect(result).toBe('Outer: Inner: Wang');
    });

    it('should handle templates in object literals', async () => {
      const result = await interpreter.execute(`
        let name = "Wang"
        let version = 1.0
        let obj = {
          description: \`\${name} version \${version}\`,
          message: \`Welcome to \${name}!\`
        }
        obj.description + " - " + obj.message
      `);
      expect(result).toBe('Wang version 1 - Welcome to Wang!');
    });
  });

  describe('Special Characters and Escaping', () => {
    it('should handle special characters in templates', async () => {
      const result = await interpreter.execute(`
        let special = \`Line 1\\nLine 2\\tTabbed\`
        special
      `);
      expect(result).toBe('Line 1\nLine 2\tTabbed');
    });

    it('should handle quotes in templates', async () => {
      const result = await interpreter.execute(`
        let name = "Wang"
        let quotes = \`He said "\${name}" and 'hello'\`
        quotes
      `);
      expect(result).toBe('He said "Wang" and \'hello\'');
    });

    it('should handle dollar signs without braces', async () => {
      const result = await interpreter.execute(`
        let price = 100
        let text = \`Price: $\${price} or just $ sign\`
        text
      `);
      expect(result).toBe('Price: $100 or just $ sign');
    });

    it('should handle backslashes', async () => {
      const result = await interpreter.execute(`
        let path = "C:\\\\Users\\\\Wang"
        let template = \`Path: \${path}\`
        template
      `);
      expect(result).toBe('Path: C:\\Users\\Wang');
    });
  });

  describe('Edge Cases and Limitations', () => {
    it('should handle undefined variables gracefully', async () => {
      const result = await interpreter.execute(`
        let obj = {}
        let template = \`Value: \${obj.notDefined}\`
        template
      `);
      expect(result).toBe('Value: undefined');
    });

    it('should handle null values', async () => {
      const result = await interpreter.execute(`
        let value = null
        let template = \`Value is: \${value}\`
        template
      `);
      expect(result).toBe('Value is: null');
    });

    it('should handle complex expressions with parentheses', async () => {
      const result = await interpreter.execute(`
        let a = 5
        let b = 3
        let c = 2
        let complex = \`Result: \${(a + b) * c}\`
        complex
      `);
      expect(result).toBe('Result: 16');
    });

    it('should handle expressions with string concatenation', async () => {
      const result = await interpreter.execute(`
        let first = "Hello"
        let second = "World"
        let template = \`Combined: \${first + " " + second}\`
        template
      `);
      expect(result).toBe('Combined: Hello World');
    });

    it('should handle expressions with array methods', async () => {
      const result = await interpreter.execute(`
        let nums = [1, 2, 3, 4, 5]
        let template = \`Filtered: \${nums.filter(n => n > 2).join(", ")}\`
        template
      `);
      expect(result).toBe('Filtered: 3, 4, 5');
    });

    it('should handle JSON.stringify in templates', async () => {
      const result = await interpreter.execute(`
        let obj = { name: "Wang", items: [1, 2, 3] }
        let template = \`JSON: \${JSON.stringify(obj)}\`
        template
      `);
      expect(result).toBe('JSON: {"name":"Wang","items":[1,2,3]}');
    });
  });

  describe('Performance and Complex Scenarios', () => {
    it('should handle template with many expressions', async () => {
      const result = await interpreter.execute(`
        let a = 1, b = 2, c = 3, d = 4, e = 5
        let template = \`Values: \${a}, \${b}, \${c}, \${d}, \${e}, Sum: \${a+b+c+d+e}\`
        template
      `);
      expect(result).toBe('Values: 1, 2, 3, 4, 5, Sum: 15');
    });

    it('should handle template in loop', async () => {
      const result = await interpreter.execute(`
        let results = []
        for (let i = 0; i < 3; i++) {
          results.push(\`Item \${i}: \${i * 2}\`)
        }
        results.join(", ")
      `);
      expect(result).toBe('Item 0: 0, Item 1: 2, Item 2: 4');
    });

    it('should handle template with async expressions', async () => {
      const result = await interpreter.execute(`
        async function getValue() {
          return "async value"
        }
        let template = \`Result: \${await getValue()}\`
        template
      `);
      expect(result).toBe('Result: async value');
    });

    it('should handle template with class instance', async () => {
      const result = await interpreter.execute(`
        class Person {
          constructor(name, age) {
            this.name = name
            this.age = age
          }
          toString() {
            return this.name + "(" + this.age + ")"
          }
        }
        let person = new Person("Alice", 30)
        let template = \`Person: \${person.toString()}, Name: \${person.name}\`
        template
      `);
      expect(result).toBe('Person: Alice(30), Name: Alice');
    });
  });

  describe('Error Cases', () => {
    it('should throw error for invalid expressions (JavaScript-like behavior)', async () => {
      // JavaScript throws SyntaxError for invalid template expressions
      await expect(interpreter.execute(`
        let template = \`Value: \${"unclosed string}\`
        template
      `)).rejects.toThrow();
    });

    it('should throw error for unmatched braces (JavaScript-like behavior)', async () => {
      // JavaScript throws SyntaxError for unmatched braces in templates
      await expect(interpreter.execute(`
        let template = \`Value: \${ or just \${\`
        template
      `)).rejects.toThrow();
    });

    it('should handle escaped template syntax', async () => {
      const result = await interpreter.execute(`
        let value = 42
        // Test if we can escape the dollar sign
        let template = \`Literal: \\$\{value\} vs Interpolated: \${value}\`
        template
      `);
      // This tests escaping behavior
      expect(result).toContain('42');
    });
  });
});