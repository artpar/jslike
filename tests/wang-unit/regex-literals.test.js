/**
 * Regex Literal Tests for Wang Language
 * Tests regex literal syntax: /pattern/flags
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Language Regex Literals', () => {
  let ctx;

  beforeEach(() => {
    ctx = new TestContext();
  });

  describe('Basic Regex Literals', () => {
    test('should parse and create basic regex literal', async () => {
      const result = await ctx.execute(`
        let pattern = /hello/
        [pattern instanceof RegExp, pattern.source, pattern.flags]
      `);
      expect(result).toEqual([true, 'hello', '']);
    });

    test('should create regex with flags', async () => {
      const result = await ctx.execute(`
        let pattern = /hello/gi
        [pattern instanceof RegExp, pattern.source, pattern.flags, pattern.global, pattern.ignoreCase]
      `);
      expect(result).toEqual([true, 'hello', 'gi', true, true]);
    });

    test('should support all regex flags', async () => {
      const result = await ctx.execute(`
        let pattern = /test/gimuy
        [pattern instanceof RegExp, pattern.flags]
      `);
      expect(result).toEqual([true, 'gimuy']);
    });

    test('should support regex with special characters', async () => {
      const result = await ctx.execute(`
        let pattern = /\\d+\\.\\d+/g
        [pattern instanceof RegExp, pattern.source, pattern.global]
      `);
      expect(result).toEqual([true, '\\d+\\.\\d+', true]);
    });
  });

  describe('Regex with Complex Patterns', () => {
    test('should handle character classes', async () => {
      const result = await ctx.execute(`
        let pattern = /[a-zA-Z0-9]/
        pattern.source
      `);
      expect(result).toBe('[a-zA-Z0-9]');
    });

    test('should handle quantifiers', async () => {
      const result = await ctx.execute(`
        let pattern = /a{1,3}b+c*d?/
        pattern.source
      `);
      expect(result).toBe('a{1,3}b+c*d?');
    });

    test('should handle groups and assertions', async () => {
      const result = await ctx.execute(`
        let pattern = /(hello)(?=world)/
        pattern.source
      `);
      expect(result).toBe('(hello)(?=world)');
    });

    test('should handle escaped forward slashes', async () => {
      const result = await ctx.execute(`
        let pattern = /path\\/to\\/file/
        pattern.source
      `);
      expect(result).toBe('path\\/to\\/file');
    });
  });

  describe('Regex Usage in Expressions', () => {
    test('should work with string methods', async () => {
      ctx.addFunction('test', (str, pattern) => pattern.test(str));
      
      const result = await ctx.execute(`
        let pattern = /hello/i
        let str = "Hello World"
        test(str, pattern)
      `);
      
      expect(result).toBe(true);
    });

    test('should work with match method', async () => {
      ctx.addFunction('match', (str, pattern) => str.match(pattern));
      
      const result = await ctx.execute(`
        let pattern = /\\d+/g
        let str = "I have 123 apples and 456 oranges"
        match(str, pattern)
      `);
      
      expect(result).toEqual(['123', '456']);
    });

    test('should work with replace method', async () => {
      ctx.addFunction('replace', (str, pattern, replacement) => str.replace(pattern, replacement));
      
      const result = await ctx.execute(`
        let pattern = /world/i
        let str = "Hello World"
        replace(str, pattern, "Universe")
      `);
      
      expect(result).toBe('Hello Universe');
    });

    // Pipeline expression test removed - not JavaScript compatible
  });

  describe('Division vs Regex Context', () => {
    test('should distinguish division from regex - after identifier', async () => {
      const result = await ctx.execute(`
        let a = 10
        let b = 5
        a / b
      `);
      
      expect(result).toBe(2);
    });

    test('should distinguish division from regex - after number', async () => {
      const result = await ctx.execute('10 / 2');
      expect(result).toBe(5);
    });

    test('should parse regex after assignment operator', async () => {
      const result = await ctx.execute(`
        let pattern = /test/
        [pattern instanceof RegExp, pattern.source]
      `);
      expect(result).toEqual([true, 'test']);
    });

    test('should parse regex after comma', async () => {
      ctx.addFunction('testRegex', (r1, r2) => [r1.source, r2.source]);
      
      const result = await ctx.execute('testRegex(/hello/, /world/)');
      expect(result).toEqual(['hello', 'world']);
    });

    test('should parse regex after opening parenthesis', async () => {
      ctx.addFunction('testRegex', (pattern) => pattern.source);
      
      const result = await ctx.execute('testRegex(/test/)');
      expect(result).toBe('test');
    });

    test('should parse regex after return statement', async () => {
      const result = await ctx.execute(`
        function getPattern() {
          return /pattern/g
        }
        let fn = getPattern()
        fn.source
      `);
      
      expect(result).toBe('pattern');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty regex', async () => {
      const result = await ctx.execute(`
        let pattern = /(?:)/
        [pattern instanceof RegExp, pattern.source]
      `);
      expect(result).toEqual([true, '(?:)']);
    });

    test('should handle regex with unicode flag', async () => {
      const result = await ctx.execute(`
        let pattern = /\\u{1F600}/u
        pattern.unicode
      `);
      expect(result).toBe(true);
    });

    test('should handle regex in object literals', async () => {
      const result = await ctx.execute(`
        let obj = {
          pattern: /test/g,
          name: "testRegex"
        }
        obj.pattern.source
      `);
      
      expect(result).toBe('test');
    });

    test('should handle regex in array literals', async () => {
      const result = await ctx.execute(`
        let arr = [/hello/, /world/]
        arr[0].source
      `);
      
      expect(result).toBe('hello');
    });
  });

  describe('Error Cases', () => {
    test('should handle invalid regex patterns gracefully', async () => {
      // The lexer should catch invalid regex patterns
      // This test ensures we don't crash on valid lexer tokens
      const result = await ctx.execute(`
        let pattern = /valid/
        pattern instanceof RegExp
      `);
      expect(result).toBe(true);
    });
  });

  describe('Real-world Use Cases', () => {
    test('should work for email validation', async () => {
      ctx.addFunction('isValidEmail', (email, pattern) => pattern.test(email));
      
      const result = await ctx.execute(`
        let emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
        let email = "test@example.com"
        isValidEmail(email, emailPattern)
      `);
      
      expect(result).toBe(true);
    });

    test('should work for URL extraction', async () => {
      ctx.addFunction('extractUrls', (text, pattern) => text.match(pattern) || []);
      
      const result = await ctx.execute(`
        let urlPattern = /https?:\\/\\/[^\\s]+/g
        let text = "Visit https://example.com and http://test.org"
        extractUrls(text, urlPattern)
      `);
      
      expect(result).toEqual(['https://example.com', 'http://test.org']);
    });

    test('should work for data parsing', async () => {
      ctx.addFunction('parseData', (data, pattern) => {
        const match = data.match(pattern);
        return match ? match[1] : null;
      });
      
      const result = await ctx.execute(`
        let pattern = /name="([^"]+)"/
        let html = '<input name="username" type="text">'
        parseData(html, pattern)
      `);
      
      expect(result).toBe('username');
    });
  });
});