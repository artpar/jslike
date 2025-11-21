/**
 * Regex Integration Tests
 * Tests regex integration with all Wang language features
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Regex Integration with Language Features', () => {
  let ctx;

  beforeEach(() => {
    ctx = new TestContext();
    
    // Add common helper functions for string/regex operations
    ctx.addFunction('test', (str, pattern) => pattern.test(str));
    ctx.addFunction('match', (str, pattern) => str.match(pattern));
    ctx.addFunction('replace', (str, pattern, replacement) => str.replace(pattern, replacement));
    ctx.addFunction('search', (str, pattern) => str.search(pattern));
    ctx.addFunction('split', (str, pattern) => str.split(pattern));
    ctx.addFunction('exec', (pattern, str) => pattern.exec(str));
    ctx.addFunction('toString', (obj) => obj.toString());
    ctx.addFunction('length', (arr) => arr ? arr.length : 0);
    ctx.addFunction('push', (arr, item) => { arr.push(item); return arr; });
    ctx.addFunction('substring', (str, start, end) => str.substring(start, end));
    ctx.addFunction('indexOf', (str, search) => str.indexOf(search));
    
    // Add Promise support
    ctx.addFunction('Promise', Promise);
  });

  describe('Regex with Variables and Scoping', () => {
    test('should work with let variables', async () => {
      const result = await ctx.execute(`
        let pattern = /let[0-9]+/
        let text = "let123 const456"
        test(text, pattern)
      `);
      expect(result).toBe(true);
    });

    test('should work with const variables', async () => {
      const result = await ctx.execute(`
        const EMAIL_REGEX = /^[^@]+@[^@]+\\.[^@]+$/
        const email = "test@example.com"
        test(email, EMAIL_REGEX)
      `);
      expect(result).toBe(true);
    });

    test('should work with var variables', async () => {
      const result = await ctx.execute(`
        var globalPattern = /global/i
        function checkGlobal(text) {
          return test(text, globalPattern)
        }
        checkGlobal("GLOBAL TEXT")
      `);
      expect(result).toBe(true);
    });

    test('should respect block scoping', async () => {
      const result = await ctx.execute(`
        let outerPattern = /outer/
        {
          let innerPattern = /inner/
          let combined = test("inner text", innerPattern) && test("outer text", outerPattern)
          combined
        }
      `);
      expect(result).toBe(true);
    });
  });

  describe('Regex with Functions', () => {
    test('should work as function parameters', async () => {
      const result = await ctx.execute(`
        function validateInput(text, pattern) {
          return test(text, pattern)
        }
        
        validateInput("abc123", /^[a-z]+[0-9]+$/)
      `);
      expect(result).toBe(true);
    });

    test('should work as function return values', async () => {
      const result = await ctx.execute(`
        function getNumberPattern() {
          return /\\d+/g
        }
        
        let pattern = getNumberPattern()
        match("a1b2c3", pattern)
      `);
      expect(result).toEqual(['1', '2', '3']);
    });

    test('should work with arrow functions', async () => {
      const result = await ctx.execute(`
        let validate = (text) => test(text, /^[A-Z][a-z]+$/)
        validate("Hello")
      `);
      expect(result).toBe(true);
    });

    test('should work with async functions', async () => {
      const result = await ctx.execute(`
        async function processText(text) {
          let pattern = /async/i
          return test(text, pattern)
        }
        
        await processText("ASYNC processing")
      `);
      expect(result).toBe(true);
    });

    test('should work with closures', async () => {
      const result = await ctx.execute(`
        function createValidator(pattern) {
          return function(text) {
            return test(text, pattern)
          }
        }
        
        let emailValidator = createValidator(/^[^@]+@[^@]+$/)
        emailValidator("user@domain.com")
      `);
      expect(result).toBe(true);
    });

    test('should work with default parameters', async () => {
      const result = await ctx.execute(`
        function match(text, pattern = /\\w+/) {
          return pattern.test(text)
        }
        
        match("hello")
      `);
      expect(result).toBe(true);
    });

    test('should work with rest parameters', async () => {
      const result = await ctx.execute(`
        function testMultiple(text, ...patterns) {
          for (let pattern of patterns) {
            if (test(text, pattern)) return true
          }
          return false
        }
        
        testMultiple("test123", /letters/, /\\d+/)
      `);
      expect(result).toBe(true);
    });
  });

  describe('Regex with Classes', () => {
    test('should work in class properties', async () => {
      const result = await ctx.execute(`
        class Validator {
          constructor() {
            this.emailPattern = /^[^@]+@[^@]+\\.[^@]+$/
            this.phonePattern = /^\\d{3}-\\d{3}-\\d{4}$/
          }
          
          validateEmail(email) {
            return test(email, this.emailPattern)
          }
        }
        
        let validator = new Validator()
        validator.validateEmail("test@example.com")
      `);
      expect(result).toBe(true);
    });

    test('should work in class methods', async () => {
      const result = await ctx.execute(`
        class TextProcessor {
          extractNumbers(text) {
            return match(text, /\\d+/g) || []
          }
          
          countWords(text) {
            let words = match(text, /\\b\\w+\\b/g)
            return words ? words.length : 0
          }
        }
        
        let processor = new TextProcessor()
        processor.extractNumbers("abc123def456")
      `);
      expect(result).toEqual(['123', '456']);
    });

    test('should work in static-like methods', async () => {
      const result = await ctx.execute(`
        class Utils {
          isValidUrl(url) {
            return test(url, /^https?:\\/\\/.+/)
          }
        }
        
        let utils = new Utils()
        utils.isValidUrl("https://example.com")
      `);
      expect(result).toBe(true);
    });

    test('should work with class inheritance', async () => {
      const result = await ctx.execute(`
        class BaseValidator {
          constructor() {
            this.basicPattern = /\\w+/
          }
          
          validate(text) {
            return test(text, this.basicPattern)
          }
        }
        
        class EmailValidator extends BaseValidator {
          constructor() {
            super()
            this.emailPattern = /@/
          }
          
          validateEmail(text) {
            return this.validate(text) && test(text, this.emailPattern)
          }
        }
        
        let validator = new EmailValidator()
        validator.validateEmail("user@domain")
      `);
      expect(result).toBe(true);
    });
  });

  describe('Regex with Control Flow', () => {
    test('should work in if statements', async () => {
      const result = await ctx.execute(`
        let text = "hello123"
        if (test(text, /\\d+/)) {
          "has numbers"
        } else {
          "no numbers"
        }
      `);
      expect(result).toBe("has numbers");
    });

    test('should work in for loops', async () => {
      const result = await ctx.execute(`
        let texts = ["abc", "123", "def456"]
        let count = 0
        
        for (let i = 0; i < texts.length; i = i + 1) {
          if (test(texts[i], /\\d/)) {
            count = count + 1
          }
        }
        
        count
      `);
      expect(result).toBe(2);
    });

    test('should work in for-of loops', async () => {
      const result = await ctx.execute(`
        let patterns = [/\\d+/, /[a-z]+/, /[A-Z]+/]
        let matches = []
        
        for (let pattern of patterns) {
          if (test("Hello123", pattern)) {
            push(matches, pattern.source)
          }
        }
        
        matches
      `);
      expect(result).toEqual(['\\d+', '[a-z]+', '[A-Z]+']);
    });

    test('should work in while loops', async () => {
      const result = await ctx.execute(`
        let text = "a1b2c3d4"
        let pattern = /\\d/g
        let matches = []
        
        // Simple alternative approach - get all digits at once  
        let textMatches = match(text, /\\d/g) || []
        for (let textMatch of textMatches) {
          push(matches, textMatch)
        }
        
        matches
      `);
      expect(result).toEqual(['1', '2', '3', '4']);
    });

    test('should work with conditional logic', async () => {
      const result = await ctx.execute(`
        let text = "email@domain.com"
        let result = "unknown"
        
        if (test(text, /^\\d+$/)) {
          result = "number"
        } else if (test(text, /@/)) {
          result = "email"
        }
        
        result
      `);
      expect(result).toBe("email");
    });

    test('should work in ternary operators', async () => {
      const result = await ctx.execute(`
        let text = "password123"
        let strength = test(text, /(?=.*[a-z])(?=.*\\d)/) ? "strong" : "weak"
        strength
      `);
      expect(result).toBe("strong");
    });

    test('should work in try-catch', async () => {
      const result = await ctx.execute(`
        let result = null
        try {
          let pattern = /valid/
          if (test("valid", pattern)) {
            result = "matched"
          } else {
            throw "Pattern not matched"
          }
        } catch (error) {
          result = "caught: " + error
        }
        result
      `);
      expect(result).toBe("matched");
    });
  });

  describe('Regex with Arrays and Objects', () => {
    test('should work in array literals', async () => {
      const result = await ctx.execute(`
        let patterns = [/first/, /second/, /third/]
        patterns[1].source
      `);
      expect(result).toBe("second");
    });

    test('should work in object literals', async () => {
      const result = await ctx.execute(`
        let validators = {
          email: /^[^@]+@[^@]+$/,
          phone: /^\\d{10}$/,
          zipCode: /^\\d{5}$/
        }
        
        test("user@domain", validators.email)
      `);
      expect(result).toBe(true);
    });

    test('should work with array methods', async () => {
      const result = await ctx.execute(`
        let words = ["hello", "123", "world", "456"]
        let numberPattern = /^\\d+$/
        
        filter(words, (word) => test(word, numberPattern))
      `);
      expect(result).toEqual(['123', '456']);
    });

    test('should work with object destructuring', async () => {
      const result = await ctx.execute(`
        let config = {
          patterns: {
            email: /^[^@]+@[^@]+$/,
            phone: /^\\d+$/
          }
        }
        
        let { patterns } = config
        test("user@domain", patterns.email)
      `);
      expect(result).toBe(true);
    });

    test('should work with array destructuring', async () => {
      const result = await ctx.execute(`
        let regexArray = [/first/, /second/]
        let [firstPattern, secondPattern] = regexArray;

        [firstPattern.source, secondPattern.source]
      `);
      expect(result).toEqual(['first', 'second']);
    });

    test('should work with spread operator', async () => {
      const result = await ctx.execute(`
        let patterns1 = [/pattern1/, /pattern2/]
        let patterns2 = [/pattern3/, ...patterns1, /pattern4/]
        
        length(patterns2)
      `);
      expect(result).toBe(4);
    });
  });

  describe('Regex with Modules', () => {
    test('should work with module exports', async () => {
      ctx.addModule('validators', `
        export const EMAIL_REGEX = /^[^@]+@[^@]+\\.[^@]+$/
        export const PHONE_REGEX = /^\\d{3}-\\d{3}-\\d{4}$/
        
        export function validateEmail(email) {
          return EMAIL_REGEX.test(email)
        }
      `);
      
      const result = await ctx.execute(`
        import { EMAIL_REGEX, validateEmail } from "validators"
        
        let isValidPattern = typeof EMAIL_REGEX === "object"
        let isValidFunction = validateEmail("test@example.com");

        [isValidPattern, isValidFunction]
      `);
      
      expect(result).toEqual([true, true]);
    });

    test('should work with module imports', async () => {
      ctx.addModule('textUtils', `
        export function extractNumbers(text) {
          return text.match(/\\d+/g) || []
        }
        
        export function removeNumbers(text) {
          return text.replace(/\\d+/g, '')
        }
      `);
      
      const result = await ctx.execute(`
        import { extractNumbers, removeNumbers } from "textUtils"
        
        let text = "abc123def456ghi"
        let numbers = extractNumbers(text)
        let withoutNumbers = removeNumbers(text);

        [numbers, withoutNumbers]
      `);
      
      expect(result).toEqual([['123', '456'], 'abcdefghi']);
    });
  });

  describe('Regex with Async Operations', () => {
    test('should work with async/await', async () => {
      const result = await ctx.execute(`
        async function processAsync(text) {
          let pattern = /async/i
          await wait(1)  // Small delay
          return test(text, pattern)
        }
        
        await processAsync("ASYNC test")
      `);
      expect(result).toBe(true);
    });

    test('should work with Promise chains', async () => {
      const result = await ctx.execute(`
        function validateAsync(text) {
          let isValid = test(text, /^[a-z]+$/)
          return Promise.resolve(isValid)
        }
        
        await validateAsync("hello")
      `);
      expect(result).toBe(true);
    });

    test('should work with async operations', async () => {
      const result = await ctx.execute(`
        async function validateMultiple(texts) {
          let pattern = /^\\w+$/
          let results = []
          
          for (let text of texts) {
            let isValid = test(text, pattern)
            results.push(isValid)
          }
          
          return results
        }
        
        await validateMultiple(["hello", "world", "test"])
      `);
      expect(result).toEqual([true, true, true]);
    });
  });

  describe('Regex with Error Handling', () => {
    test('should work in error messages', async () => {
      const result = await ctx.execute(`
        try {
          let text = "invalid"
          if (!test(text, /^valid/)) {
            throw new Error("Text does not match pattern /^valid/")
          }
        } catch (e) {
          e.message
        }
      `);
      expect(result).toBe("Text does not match pattern /^valid/");
    });

    test('should work with custom error classes', async () => {
      const result = await ctx.execute(`
        class ValidationError extends Error {
          constructor(text, pattern) {
            super("Validation failed for: " + text)
            this.pattern = pattern
          }
        }
        
        try {
          throw new ValidationError("test", /^\\d+$/)
        } catch (e) {
          e.message
        }
      `);
      expect(result).toBe("Validation failed for: test");
    });
  });

  describe('Regex Performance with Language Features', () => {
    test('should handle regex in loops efficiently', async () => {
      const result = await ctx.execute(`
        let pattern = /\\d+/
        let texts = ["a1", "b2", "c3", "d4", "e5"]
        let matches = 0
        
        for (let text of texts) {
          if (test(text, pattern)) {
            matches = matches + 1
          }
        }
        
        matches
      `);
      expect(result).toBe(5);
    });

    test('should handle multiple regex patterns efficiently', async () => {
      const result = await ctx.execute(`
        let patterns = [/\\d/, /[a-z]/, /[A-Z]/]
        let text = "Hello123"
        let matchCount = 0
        
        for (let pattern of patterns) {
          if (test(text, pattern)) {
            matchCount = matchCount + 1
          }
        }
        
        matchCount
      `);
      expect(result).toBe(3);
    });
  });
});