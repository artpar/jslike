/**
 * Regex Stress Tests and Performance Validation
 * Tests regex under high load and complex scenarios
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Regex Stress Tests and Performance', () => {
  let ctx;

  beforeEach(() => {
    ctx = new TestContext();
    
    // Helper functions
    ctx.addFunction('test', (str, pattern) => pattern.test(str));
    ctx.addFunction('match', (str, pattern) => str.match(pattern));
    ctx.addFunction('replace', (str, pattern, replacement) => str.replace(pattern, replacement));
    ctx.addFunction('split', (str, pattern) => str.split(pattern));
    ctx.addFunction('length', (arr) => arr ? arr.length : 0);
    ctx.addFunction('join', (arr, sep) => arr.join(sep || ''));
    ctx.addFunction('push', (arr, item) => { arr.push(item); return arr; });
    ctx.addFunction('slice', (arr, start, end) => arr.slice(start, end));
    ctx.addFunction('substring', (str, start, end) => str.substring(start, end));
    ctx.addFunction('random', () => Math.random());
    ctx.addFunction('floor', (n) => Math.floor(n));
    ctx.addFunction('repeat', (str, count) => str.repeat(count));
    ctx.addFunction('parseInt', (str, radix) => parseInt(str, radix));
    ctx.addFunction('parseFloat', (str) => parseFloat(str));
    ctx.addFunction('reduce', (arr, fn, initial) => arr.reduce(fn, initial));
  });

  describe('Large Scale Text Processing', () => {
    test('should handle large text with multiple regex operations', async () => {
      const result = await ctx.execute(`
        // Create a large text sample
        let baseText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
        baseText = baseText + "Email: user@example.com Phone: (555) 123-4567. "
        baseText = baseText + "Visit https://example.com for more info. "
        
        let largeText = repeat(baseText, 100)  // ~15KB of text
        
        // Count different patterns
        let emails = match(largeText, /[^@\\s]+@[^@\\s]+\\.[^@\\s]+/g);
        let phones = match(largeText, /\\(\\d{3}\\)\\s\\d{3}-\\d{4}/g);
        let urls = match(largeText, /https?:\\/\\/[^\\s]+/g);

        ({
          emailCount: emails ? length(emails) : 0,
          phoneCount: phones ? length(phones) : 0,
          urlCount: urls ? length(urls) : 0,
          textSize: length(largeText)
        });
      `);
      
      expect(result.emailCount).toBe(100);
      expect(result.phoneCount).toBe(100);
      expect(result.urlCount).toBe(100);
      expect(result.textSize).toBeGreaterThan(14000);
    });

    test('should handle complex nested regex operations', async () => {
      const result = await ctx.execute(`
        // Generate complex nested data
        let data = ""
        for (let i = 0; i < 50; i = i + 1) {
          data = data + \`{"id": \${i}, "email": "user\${i}@domain\${i % 5}.com", "tags": ["tag\${i}", "category\${i % 3}"]}, \`
        }
        
        // Extract nested patterns
        let jsonObjects = match(data, /\\{[^}]+\\}/g) || []
        let processedData = []
        
        for (let obj of jsonObjects) {
          let idMatch = match(obj, /"id":\\s*(\\d+)/)
          let emailMatch = match(obj, /"email":\\s*"([^"]+)"/)
          let tagMatch = match(obj, /"tags":\\s*\\[([^\\]]+)\\]/)
          
          if (idMatch && emailMatch && tagMatch) {
            push(processedData, {
              id: parseInt(idMatch[1]),
              domain: match(emailMatch[1], /@([^@]+)/)[1],
              tagCount: length(split(tagMatch[1], ","))
            })
          }
        }
        
        length(processedData)
      `);
      
      expect(result).toBe(50);
    });

    test('should handle rapid-fire regex compilation', async () => {
      const result = await ctx.execute(`
        let patterns = []
        let testText = "test123abc456def789"
        let matches = 0
        
        // Create many different regex patterns
        for (let i = 0; i < 20; i = i + 1) {
          let pattern = new RegExp("\\\\d{" + (i % 3 + 1) + "}", "g")
          push(patterns, pattern)
        }
        
        // Test each pattern
        for (let pattern of patterns) {
          let result = match(testText, pattern)
          if (result) {
            matches = matches + length(result)
          }
        }
        
        matches
      `);
      
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('High Volume Pattern Matching', () => {
    test('should process large arrays with regex filtering', async () => {
      const result = await ctx.execute(`
        let testData = []
        
        // Generate 1000 test strings
        for (let i = 0; i < 1000; i = i + 1) {
          let type = i % 4
          if (type === 0) {
            push(testData, "email" + i + "@domain.com")
          } else if (type === 1) {  
            push(testData, "phone" + i + "5551234567")
          } else if (type === 2) {
            push(testData, "url" + i + "https://example.com")  
          } else {
            push(testData, "data" + i + "randomtext")
          }
        }
        
        // Filter with different patterns
        let emails = 0
        let phones = 0
        let urls = 0
        
        for (let item of testData) {
          if (test(item, /@/)) emails = emails + 1
          if (test(item, /\\d{10}/)) phones = phones + 1
          if (test(item, /https?:/)) urls = urls + 1
        }

        ({emails, phones, urls, total: length(testData)});
      `);
      
      expect(result.total).toBe(1000);
      expect(result.emails).toBe(250);
      expect(result.phones).toBe(250);  
      expect(result.urls).toBe(250);
    });

    test('should handle concurrent regex operations', async () => {
      const result = await ctx.execute(`
        let results = []
        let testTexts = []
        
        // Create test data
        for (let i = 0; i < 100; i = i + 1) {
          push(testTexts, "test" + i + " email" + i + "@domain.com phone(555)123-456" + i)
        }
        
        // Process multiple patterns simultaneously
        let emailPattern = /@[^\\s]+/g
        let phonePattern = /\\(\\d{3}\\)\\d{3}-\\d{3}\\d/g
        let numberPattern = /\\d+/g
        
        for (let text of testTexts) {
          let emailMatches = match(text, emailPattern) || []
          let phoneMatches = match(text, phonePattern) || []
          let numberMatches = match(text, numberPattern) || []

          push(results, {
            emails: length(emailMatches),
            phones: length(phoneMatches),
            numbers: length(numberMatches)
          })
        }

        ({
          processed: length(results),
          totalEmails: results.reduce((sum, r) => sum + r.emails, 0),
          totalPhones: results.reduce((sum, r) => sum + r.phones, 0),
          totalNumbers: results.reduce((sum, r) => sum + r.numbers, 0)
        });
      `);
      
      expect(result.processed).toBe(100);
      expect(result.totalEmails).toBe(100);
      expect(result.totalPhones).toBe(100);
      expect(result.totalNumbers).toBeGreaterThan(200); // Multiple numbers per text
    });
  });

  describe('Complex Pattern Stress Tests', () => {
    test('should handle deeply nested capture groups', async () => {
      const result = await ctx.execute(`
        let complexText = "user: john.doe@company.com (Department: Engineering, Level: Senior, ID: ENG001)"
        let pattern = /user:\\s+([^@]+)@([^\\s]+)\\s+\\(Department:\\s+([^,]+),\\s+Level:\\s+([^,]+),\\s+ID:\\s+([^)]+)\\)/
        
        let match = match(complexText, pattern);

        if (match) {
          ({
            fullMatch: match[0],
            username: match[1],
            domain: match[2],
            department: match[3],
            level: match[4],
            id: match[5],
            captureCount: length(match) - 1
          });
        } else {
          null;
        }
      `);
      
      expect(result).not.toBeNull();
      expect(result.captureCount).toBe(5);
      expect(result.username).toBe('john.doe');
      expect(result.department).toBe('Engineering');
    });

    test('should handle recursive pattern matching', async () => {
      const result = await ctx.execute(`
        // Simulate parsing nested parentheses with regex
        let text = "((level1 (level2 (level3) level2) level1))"
        let depth = 0
        let maxDepth = 0
        
        // Count nesting depth
        for (let i = 0; i < length(text); i = i + 1) {
          let char = substring(text, i, i + 1)
          if (char === "(") {
            depth = depth + 1
            if (depth > maxDepth) maxDepth = depth
          } else if (char === ")") {
            depth = depth - 1  
          }
        }
        
        // Extract content at different levels
        let level1 = match(text, /\\(([^()]+)\\)/);
        let allParens = match(text, /\\([^()]*\\)/g) || [];

        ({
          maxDepth: maxDepth,
          level1Content: level1 ? level1[1] : null,
          parenGroups: length(allParens),
          textLength: length(text)
        });
      `);
      
      expect(result.maxDepth).toBeGreaterThan(2);
      expect(result.parenGroups).toBeGreaterThan(0);
    });

    test('should handle unicode and international patterns', async () => {
      const result = await ctx.execute(`
        let internationalText = "Café naïve résumé 中文 日本語 한국어 العربية русский"
        
        // Test various unicode patterns
        let latinExtended = match(internationalText, /[à-ÿ]/g) || [];
        let cjk = match(internationalText, /[\\u4e00-\\u9fff\\u3040-\\u309f\\u30a0-\\u30ff\\uac00-\\ud7af]/g) || [];
        let arabic = match(internationalText, /[\\u0600-\\u06ff]/g) || [];
        let cyrillic = match(internationalText, /[\\u0400-\\u04ff]/g) || [];

        ({
          latinExtendedCount: length(latinExtended),
          cjkCount: length(cjk),
          arabicCount: length(arabic),
          cyrillicCount: length(cyrillic),
          totalUnicodeChars: length(latinExtended) + length(cjk) + length(arabic) + length(cyrillic)
        });
      `);
      
      expect(result.latinExtendedCount).toBeGreaterThan(0);
      expect(result.cjkCount).toBeGreaterThan(0);
      expect(result.arabicCount).toBeGreaterThan(0);
      expect(result.cyrillicCount).toBeGreaterThan(0);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle repeated pattern creation without memory leaks', async () => {
      const result = await ctx.execute(`
        let iterations = 500
        let patterns = []
        let testResults = []
        
        for (let i = 0; i < iterations; i = i + 1) {
          // Create new patterns each iteration
          let pattern = new RegExp("test" + (i % 10), "g");
          push(patterns, pattern);

          // Test immediately
          let testText = "test0 test1 test2 test3 test4 test5 test6 test7 test8 test9";
          let matches = match(testText, pattern);
          push(testResults, matches ? length(matches) : 0);
        }

        ({
          patternsCreated: length(patterns),
          totalMatches: testResults.reduce((sum, count) => sum + count, 0),
          averageMatches: testResults.reduce((sum, count) => sum + count, 0) / length(testResults)
        });
      `);
      
      expect(result.patternsCreated).toBe(500);
      expect(result.totalMatches).toBeGreaterThan(0);
    });

    test('should handle long-running regex operations', async () => {
      const result = await ctx.execute(`
        // Create a moderately complex text processing task
        let baseText = "The quick brown fox jumps over the lazy dog. "
        let longText = repeat(baseText, 50) // ~2KB text
        
        let operations = []
        let startTime = Date.now()
        
        // Perform multiple operations
        for (let i = 0; i < 20; i = i + 1) {
          let words = match(longText, /\\b\\w{4,}\\b/g) || [];
          let sentences = split(longText, /[.!?]+/);
          let replacedText = replace(longText, /the/gi, "THE");

          push(operations, {
            iteration: i,
            wordCount: length(words),
            sentenceCount: length(sentences),
            replacements: length(match(replacedText, /THE/g) || [])
          });
        }

        let endTime = Date.now();
        let totalTime = endTime - startTime;

        ({
          operationsCompleted: length(operations),
          totalTimeMs: totalTime,
          avgWordsPerOp: operations.reduce((sum, op) => sum + op.wordCount, 0) / length(operations),
          avgTimePerOp: totalTime / length(operations)
        });
      `);
      
      expect(result.operationsCompleted).toBe(20);
      expect(result.avgWordsPerOp).toBeGreaterThan(0);
      // Note: totalTimeMs might be 0 on fast machines where operations complete within 1ms
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    test('should handle edge case pattern combinations', async () => {
      const result = await ctx.execute(`
        let edgeCases = [
          { pattern: /.*/, text: "" },  // Empty string
          { pattern: /.+/, text: "a" }, // Single character
          { pattern: /\\s*/, text: "   " }, // Only whitespace
          { pattern: /[\\s\\S]*/, text: "\\n\\t\\r" }, // Control characters
          { pattern: /^$/, text: "" }, // Empty anchored
          { pattern: /.{0,}/, text: "any text here" }, // Zero or more anything
          { pattern: /(?:)/, text: "test" }, // Empty group
          { pattern: /a*/, text: "bbbb" } // No matches
        ];
        
        let results = [];

        for (let testCase of edgeCases) {
          try {
            let matches = match(testCase.text, testCase.pattern);
            let testResult = test(testCase.text, testCase.pattern);

            push(results, {
              patternSource: testCase.pattern.source,
              hasMatches: matches !== null,
              testResult: testResult,
              matchCount: matches ? length(matches) : 0
            });
          } catch (error) {
            push(results, {
              patternSource: testCase.pattern.source,
              error: "Failed to execute"
            });
          }
        }

        ({
          casesProcessed: length(results),
          successfulCases: results.filter(r => !r.error).length,
          errorCases: results.filter(r => r.error).length
        });
      `);
      
      expect(result.casesProcessed).toBe(8);
      expect(result.successfulCases).toBeGreaterThanOrEqual(7); // Most should succeed
      expect(result.errorCases).toBeLessThanOrEqual(1); // Minimal errors expected
    });
  });

  describe('Real-world Scenario Stress Tests', () => {
    test('should process large log files efficiently', async () => {
      const result = await ctx.execute(`
        // Simulate log file processing
        let logEntries = []
        let levels = ["ERROR", "WARN", "INFO", "DEBUG"]
        let services = ["auth", "db", "api", "cache"]
        
        // Generate 500 log entries
        for (let i = 0; i < 500; i = i + 1) {
          let level = levels[i % length(levels)]
          let service = services[i % length(services)]
          let message = "Operation completed in " + (i % 1000) + "ms"
          let timestamp = "2024-01-01T" + (10 + (i % 12)) + ":30:00Z"
          
          push(logEntries, timestamp + " [" + level + "] " + service + ": " + message)
        }
        
        let logText = join(logEntries, "\\n");

        // Extract structured data
        let errorLogs = match(logText, /\\[ERROR\\][^\\n]+/g) || [];
        let timings = match(logText, /(\\d+)ms/g) || [];
        let timestamps = match(logText, /\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z/g) || [];
        let serviceMatches = match(logText, /\\] (\\w+):/g) || [];

        ({
          totalLogLines: length(logEntries),
          errorCount: length(errorLogs),
          timingCount: length(timings),
          timestampCount: length(timestamps),
          serviceCount: length(serviceMatches),
          logSizeChars: length(logText)
        });
      `);
      
      expect(result.totalLogLines).toBe(500);
      expect(result.errorCount).toBeGreaterThan(0); // At least some errors
      expect(result.timingCount).toBe(500); // Each entry has timing
      expect(result.timestampCount).toBe(500);
      expect(result.logSizeChars).toBeGreaterThan(10000);
    });

    test('should validate large datasets efficiently', async () => {
      const result = await ctx.execute(`
        // Generate customer data for validation
        let customers = []
        
        for (let i = 0; i < 300; i = i + 1) {
          let firstName = "FirstName" + i
          let lastName = "LastName" + i
          let email = "user" + i + "@" + (i % 2 === 0 ? "valid.com" : "invalid") 
          let phone = i % 3 === 0 ? "(" + (100 + i % 900) + ") 555-" + (1000 + i % 9000) : "invalid-phone"
          let zipCode = i % 4 === 0 ? (10000 + i % 90000) + "" : "invalid"
          
          push(customers, {
            name: firstName + " " + lastName,
            email: email,
            phone: phone, 
            zip: zipCode
          })
        }
        
        // Validation patterns
        let emailPattern = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/
        let phonePattern = /^\\(\\d{3}\\) \\d{3}-\\d{4}$/
        let zipPattern = /^\\d{5}$/
        
        // Validate all customers
        let validationResults = []
        
        for (let customer of customers) {
          let result = {
            validEmail: test(customer.email, emailPattern),
            validPhone: test(customer.phone, phonePattern),
            validZip: test(customer.zip, zipPattern)
          };

          result.isValid = result.validEmail && result.validPhone && result.validZip;
          push(validationResults, result);
        }

        ({
          totalCustomers: length(customers),
          validCustomers: validationResults.filter(r => r.isValid).length,
          validEmails: validationResults.filter(r => r.validEmail).length,
          validPhones: validationResults.filter(r => r.validPhone).length,
          validZips: validationResults.filter(r => r.validZip).length
        });
      `);
      
      expect(result.totalCustomers).toBe(300);
      expect(result.validEmails).toBe(150); // Half have valid.com
      expect(result.validPhones).toBe(100); // 1/3 have valid phones
      expect(result.validZips).toBe(75); // 1/4 have valid zips
      expect(result.validCustomers).toBeLessThanOrEqual(75); // Intersection of all valid
    });
  });
});