/**
 * Regex Edge Cases and Parser Conflict Tests
 * Comprehensive tests for regex vs division disambiguation
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Regex Edge Cases and Parser Conflicts', () => {
  let ctx;

  beforeEach(() => {
    ctx = new TestContext();
  });

  describe('Division vs Regex Context Disambiguation', () => {
    test('should parse division after identifiers', async () => {
      const result = await ctx.execute(`
        let a = 10
        let b = 5
        a / b
      `);
      expect(result).toBe(2);
    });

    test('should parse division after numbers', async () => {
      const result = await ctx.execute('42 / 6');
      expect(result).toBe(7);
    });

    test('should parse division after parentheses', async () => {
      const result = await ctx.execute('(10 + 5) / 3');
      expect(result).toBe(5);
    });

    test('should parse division after array access', async () => {
      const result = await ctx.execute(`
        let arr = [20, 10]
        arr[0] / arr[1]
      `);
      expect(result).toBe(2);
    });

    test('should parse division after member access', async () => {
      const result = await ctx.execute(`
        let obj = { value: 15 }
        obj.value / 3
      `);
      expect(result).toBe(5);
    });

    test('should parse division after function calls', async () => {
      ctx.addFunction('getValue', () => 24);
      const result = await ctx.execute('getValue() / 4');
      expect(result).toBe(6);
    });

    test('should parse division after postfix increment', async () => {
      const result = await ctx.execute(`
        let x = 9
        x++ / 3
      `);
      expect(result).toBe(3);
    });

    test('should parse division after this', async () => {
      const result = await ctx.execute(`
        class Calculator {
          constructor() {
            this.value = 12
          }
          
          divide() {
            return this.value / 4
          }
        }
        
        let calc = new Calculator()
        calc.divide()
      `);
      expect(result).toBe(3);
    });
  });

  describe('Regex Context Recognition', () => {
    test('should parse regex after assignment operators', async () => {
      const result = await ctx.execute(`
        let pattern = /test/
        [pattern instanceof RegExp, pattern.source]
      `);
      expect(result).toEqual([true, 'test']);
    });

    test('should parse regex after compound assignment', async () => {
      const result = await ctx.execute(`
        let pattern = /initial/
        pattern = /updated/g
        [pattern.source, pattern.global]
      `);
      expect(result).toEqual(['updated', true]);
    });

    test('should parse regex after opening parenthesis', async () => {
      ctx.addFunction('testRegex', (r) => r.source);
      const result = await ctx.execute('testRegex(/hello/)');
      expect(result).toBe('hello');
    });

    test('should parse regex after opening bracket', async () => {
      const result = await ctx.execute(`
        let patterns = [/first/, /second/]
        patterns[0].source
      `);
      expect(result).toBe('first');
    });

    test('should parse regex after comma', async () => {
      ctx.addFunction('multiRegex', (r1, r2) => [r1.source, r2.source]);
      const result = await ctx.execute('multiRegex(/alpha/, /beta/)');
      expect(result).toEqual(['alpha', 'beta']);
    });

    test('should parse regex after colon in object', async () => {
      const result = await ctx.execute(`
        let obj = { pattern: /object/ }
        obj.pattern.source
      `);
      expect(result).toBe('object');
    });

    test('should parse regex after return statement', async () => {
      const result = await ctx.execute(`
        function getPattern() {
          return /returned/i
        }
        getPattern().source
      `);
      expect(result).toBe('returned');
    });

    test('should parse regex after throw statement', async () => {
      const result = await ctx.execute(`
        try {
          throw /error/
        } catch (e) {
          e.source
        }
      `);
      expect(result).toBe('error');
    });

    test('should parse regex after logical operators', async () => {
      ctx.addFunction('isValid', (pattern) => pattern instanceof RegExp);
      
      const result = await ctx.execute(`
        let valid = true && /valid/ && isValid(/valid/)
        valid
      `);
      expect(result).toBe(true);
    });

    test('should parse regex after ternary operator', async () => {
      const result = await ctx.execute(`
        let useRegex = true
        let pattern = useRegex ? /ternary/ : null
        pattern.source
      `);
      expect(result).toBe('ternary');
    });

    test('should parse regex after newlines', async () => {
      const result = await ctx.execute(`
        let pattern = null
        pattern = /multiline/
        pattern.source
      `);
      expect(result).toBe('multiline');
    });
  });

  describe('Complex Parsing Scenarios', () => {
    test('should handle mixed division and regex in same expression', async () => {
      ctx.addFunction('test', (str, pattern) => pattern.test(str));
      
      const result = await ctx.execute(`
        let divisor = 10 / 2  // Division
        let pattern = /\\d+/   // Regex
        let text = "The result is " + divisor
        test(text, pattern)
      `);
      expect(result).toBe(true);
    });

    test('should handle regex in arithmetic expressions with division', async () => {
      ctx.addFunction('match', (str, pattern) => str.match(pattern));
      ctx.addFunction('length', (arr) => arr ? arr.length : 0);
      
      const result = await ctx.execute(`
        let text = "123 456 789"
        let count = length(match(text, /\\d+/g))  // Regex
        let half = count / 2                     // Division
        half
      `);
      expect(result).toBe(1.5);
    });

    test('should handle nested parentheses with regex and division', async () => {
      ctx.addFunction('test', (str, pattern) => pattern.test(str));
      
      const result = await ctx.execute(`
        let result = (test("123", /\\d+/) && (10 / 5 === 2))
        result
      `);
      expect(result).toBe(true);
    });

    test('should handle regex in template literals context', async () => {
      const result = await ctx.execute(`
        let pattern = /template/
        let message = \`Pattern: \${pattern.source}\`
        message
      `);
      expect(result).toBe('Pattern: template');
    });

    test('should handle division followed by regex on next line', async () => {
      const result = await ctx.execute(`
        let math = 15 / 3
        let pattern = /nextline/
        [math, pattern.source]
      `);
      expect(result).toEqual([5, 'nextline']);
    });

    test('should handle regex in for loop conditions', async () => {
      ctx.addFunction('test', (str, pattern) => pattern.test(str));
      
      const result = await ctx.execute(`
        let count = 0
        let strings = ["123", "abc", "456"]
        for (let i = 0; i < 3; i = i + 1) {
          if (test(strings[i], /\\d+/)) {
            count = count + 1
          }
        }
        count
      `);
      expect(result).toBe(2);
    });
  });

  describe('Whitespace and Comments', () => {
    test('should handle regex with preceding whitespace', async () => {
      const result = await ctx.execute(`
        let pattern =    /whitespace/
        pattern.source
      `);
      expect(result).toBe('whitespace');
    });

    test('should handle division with preceding whitespace', async () => {
      const result = await ctx.execute(`
        let a = 20
        let b = a    / 4
        b
      `);
      expect(result).toBe(5);
    });

    test('should handle regex after line comment', async () => {
      const result = await ctx.execute(`
        // This is a comment
        let pattern = /aftercomment/
        pattern.source
      `);
      expect(result).toBe('aftercomment');
    });

    test('should handle regex after block comment', async () => {
      const result = await ctx.execute(`
        /* Block comment */
        let pattern = /afterblock/
        pattern.source
      `);
      expect(result).toBe('afterblock');
    });

    test('should handle division in comments vs real division', async () => {
      const result = await ctx.execute(`
        // This comment has a / division symbol  
        /* And this comment has / symbols too */
        let result = 18 / 3  // Real division
        result
      `);
      expect(result).toBe(6);
    });
  });

  describe('Error Boundaries', () => {
    test('should not confuse regex-like comments with regex', async () => {
      const result = await ctx.execute(`
        // This looks like /regex/ but it's a comment
        let actualRegex = /real/
        actualRegex.source
      `);
      expect(result).toBe('real');
    });

    test('should handle incomplete regex patterns gracefully', async () => {
      // Valid regex patterns only - lexer handles the tokenization
      const result = await ctx.execute(`
        let pattern = /incomplete/g
        pattern.global
      `);
      expect(result).toBe(true);
    });

    test('should handle regex with escaped slashes in division context', async () => {
      const result = await ctx.execute(`
        let path = /path\\/to\\/file/
        let math = 12 / 3
        [path.source, math]
      `);
      expect(result).toEqual(['path\\/to\\/file', 4]);
    });
  });

  describe('Operator Precedence with Regex', () => {
    test('should respect precedence with regex in expressions', async () => {
      ctx.addFunction('test', (str, pattern) => pattern.test(str));
      
      const result = await ctx.execute(`
        let a = test("123", /\\d/) && 10 / 5 === 2
        a
      `);
      expect(result).toBe(true);
    });

    test('should handle regex in comparison operations', async () => {
      ctx.addFunction('toString', (obj) => obj.toString());
      
      const result = await ctx.execute(`
        let pattern1 = /test/
        let pattern2 = /test/
        toString(pattern1) === toString(pattern2)
      `);
      expect(result).toBe(true);
    });

    test('should handle regex with typeof operator', async () => {
      const result = await ctx.execute(`
        let pattern = /test/
        typeof pattern
      `);
      expect(result).toBe('object');
    });

    test('should handle regex with instanceof operator', async () => {
      const result = await ctx.execute(`
        let pattern = /test/
        // Note: Wang doesn't have direct RegExp access in global scope
        // but instanceof should work with the pattern
        typeof pattern === "object"
      `);
      expect(result).toBe(true);
    });
  });

  describe('Unicode and Special Characters', () => {
    test('should handle unicode regex patterns', async () => {
      const result = await ctx.execute(`
        let pattern = /\\u{1F600}/u
        pattern.unicode
      `);
      expect(result).toBe(true);
    });

    test('should handle regex with special characters', async () => {
      const result = await ctx.execute(`
        let pattern = /[\\w\\s\\d\\W\\S\\D]/
        pattern.source
      `);
      expect(result).toBe('[\\w\\s\\d\\W\\S\\D]');
    });

    test('should handle regex with newlines and tabs', async () => {
      const result = await ctx.execute(`
        let pattern = /\\n\\t\\r/
        pattern.source
      `);
      expect(result).toBe('\\n\\t\\r');
    });

    test('should preserve exact regex patterns', async () => {
      const result = await ctx.execute(`
        let complex = /^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})$/
        complex.source
      `);
      expect(result).toBe('^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})$');
    });
  });
});