import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';

describe('Native String Methods', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should support string.split() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello,world,test"
      let parts = text.split(",")
      return parts
    `);
    expect(result).toEqual(['hello', 'world', 'test']);
  });

  it('should support string.includes() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.includes("world")
    `);
    expect(result).toBe(true);
  });

  it('should support string.indexOf() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.indexOf("world")
    `);
    expect(result).toBe(6);
  });

  it('should support string.substring() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.substring(0, 5)
    `);
    expect(result).toBe('hello');
  });

  it('should support string.substr() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.substr(6, 5)
    `);
    expect(result).toBe('world');
  });

  it('should support string.slice() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.slice(0, 5)
    `);
    expect(result).toBe('hello');
  });

  it('should support string.trim() method', async () => {
    const result = await interpreter.execute(`
      let text = "  hello world  "
      return text.trim()
    `);
    expect(result).toBe('hello world');
  });

  it('should support string.trimStart() and trimEnd() methods', async () => {
    const result = await interpreter.execute(`
      let text = "  hello world  "
      return {
        start: text.trimStart(),
        end: text.trimEnd()
      }
    `);
    expect(result.start).toBe('hello world  ');
    expect(result.end).toBe('  hello world');
  });

  it('should support string.replace() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.replace("world", "Wang")
    `);
    expect(result).toBe('hello Wang');
  });

  it('should support string.replaceAll() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello hello hello"
      return text.replaceAll("hello", "hi")
    `);
    expect(result).toBe('hi hi hi');
  });

  it('should support string.toLowerCase() and toUpperCase() methods', async () => {
    const result = await interpreter.execute(`
      let text = "Hello World"
      return {
        lower: text.toLowerCase(),
        upper: text.toUpperCase()
      }
    `);
    expect(result.lower).toBe('hello world');
    expect(result.upper).toBe('HELLO WORLD');
  });

  it('should support string.charAt() and charCodeAt() methods', async () => {
    const result = await interpreter.execute(`
      let text = "hello"
      return {
        char: text.charAt(1),
        code: text.charCodeAt(1)
      }
    `);
    expect(result.char).toBe('e');
    expect(result.code).toBe(101);
  });

  it('should support string.startsWith() and endsWith() methods', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return {
        starts: text.startsWith("hello"),
        ends: text.endsWith("world")
      }
    `);
    expect(result.starts).toBe(true);
    expect(result.ends).toBe(true);
  });

  it('should support string.repeat() method', async () => {
    const result = await interpreter.execute(`
      let text = "abc"
      return text.repeat(3)
    `);
    expect(result).toBe('abcabcabc');
  });

  it('should support string.padStart() and padEnd() methods', async () => {
    const result = await interpreter.execute(`
      let text = "5"
      return {
        start: text.padStart(3, "0"),
        end: text.padEnd(3, "0")
      }
    `);
    expect(result.start).toBe('005');
    expect(result.end).toBe('500');
  });

  it('should support string.match() method', async () => {
    const result = await interpreter.execute(`
      let text = "The rain in Spain"
      let matches = text.match(/ain/g)
      return matches
    `);
    expect(result).toEqual(['ain', 'ain']);
  });

  it('should support string.search() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.search(/world/)
    `);
    expect(result).toBe(6);
  });

  it('should support string.concat() method', async () => {
    const result = await interpreter.execute(`
      let text1 = "hello"
      let text2 = " world"
      return text1.concat(text2)
    `);
    expect(result).toBe('hello world');
  });

  it('should support string.lastIndexOf() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world hello"
      return text.lastIndexOf("hello")
    `);
    expect(result).toBe(12);
  });

  it('should support chaining string methods', async () => {
    const result = await interpreter.execute(`
      let text = "  HELLO WORLD  "
      return text.trim().toLowerCase().replace(" ", "-")
    `);
    expect(result).toBe('hello-world');
  });

  it('should work with template literals and string methods', async () => {
    const result = await interpreter.execute(`
      let name = "wang"
      let greeting = \`Hello, \${name.toUpperCase()}!\`
      return greeting
    `);
    expect(result).toBe('Hello, WANG!');
  });

  it('should handle multi-line strings with methods', async () => {
    const result = await interpreter.execute(`
      let text = "line1\\nline2\\nline3"
      let lines = text.split("\\n")
      return lines.length
    `);
    expect(result).toBe(3);
  });
});

describe('Native Array Methods', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should support array.filter() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let evens = numbers.filter(n => n % 2 === 0)
      return evens
    `);
    expect(result).toEqual([2, 4]);
  });

  it('should support array.map() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let doubled = numbers.map(n => n * 2)
      return doubled
    `);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should support array.reduce() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4]
      let sum = numbers.reduce((acc, n) => acc + n, 0)
      return sum
    `);
    expect(result).toBe(10);
  });

  it('should support array.find() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let found = numbers.find(n => n > 3)
      return found
    `);
    expect(result).toBe(4);
  });

  it('should support array.findIndex() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let index = numbers.findIndex(n => n > 3)
      return index
    `);
    expect(result).toBe(3);
  });

  it('should support array.some() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let hasEven = numbers.some(n => n % 2 === 0)
      return hasEven
    `);
    expect(result).toBe(true);
  });

  it('should support array.every() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [2, 4, 6, 8]
      let allEven = numbers.every(n => n % 2 === 0)
      return allEven
    `);
    expect(result).toBe(true);
  });

  it('should support array.forEach() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let sum = 0
      await numbers.forEach(n => { sum = sum + n })
      return sum
    `);
    expect(result).toBe(6);
  });

  it('should handle errors in forEach callbacks', async () => {
    await expect(interpreter.execute(`
      let arr = [1, 2, 3];
      await arr.forEach((item) => {
        if (item === 2) throw new Error("Test error");
      });
    `)).rejects.toThrow("Test error");
  });

  it('should properly scope variables in forEach callbacks', async () => {
    const result = await interpreter.execute(`
      let results = [];
      let items = [{id: 1}, {id: 2}, {id: 3}];
      await items.forEach((item, index) => {
        results.push({ itemId: item.id, idx: index });
      });
      return results;
    `);
    expect(result).toEqual([
      { itemId: 1, idx: 0 },
      { itemId: 2, idx: 1 },
      { itemId: 3, idx: 2 }
    ]);
  });

  it('should handle async operations in forEach callbacks', async () => {
    const result = await interpreter.execute(`
      let results = [];
      let items = [1, 2, 3];
      await items.forEach(async (item) => {
        // Simulate async operation
        await Promise.resolve();
        results.push(item * 2);
      });
      return results;
    `);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should handle nested forEach operations', async () => {
    const result = await interpreter.execute(`
      let results = [];
      let matrix = [[1, 2], [3, 4], [5, 6]];
      await matrix.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          results.push({ row: rowIndex, col: colIndex, value: value });
        });
      });
      return results;
    `);
    expect(result).toEqual([
      { row: 0, col: 0, value: 1 },
      { row: 0, col: 1, value: 2 },
      { row: 1, col: 0, value: 3 },
      { row: 1, col: 1, value: 4 },
      { row: 2, col: 0, value: 5 },
      { row: 2, col: 1, value: 6 }
    ]);
  });

  it('should work with DOM-like element processing', async () => {
    // Set up mock DOM elements for testing
    interpreter.setVariable('document', {
      querySelectorAll: () => [
        { 
          querySelector: (selector) => {
            if (selector.includes('file-name')) {
              return { innerText: 'file1.js', href: 'http://example.com/1' };
            }
            return null;
          }
        },
        { 
          querySelector: (selector) => {
            if (selector.includes('file-name')) {
              return { innerText: 'file2.js', href: 'http://example.com/2' };
            }
            return null;
          }
        }
      ]
    });
    
    const result = await interpreter.execute(`
      const gistItems = [];
      const itemElements = document.querySelectorAll('.gist-snippet');
      
      await itemElements.forEach(item => {
        const fileInfo = item.querySelector('.gist-file-name-container a');
        gistItems.push({
          filename: fileInfo ? fileInfo.innerText.trim() : null,
          url: fileInfo ? fileInfo.href : null
        });
      });
      
      return { gists: gistItems };
    `);
    
    expect(result.gists).toHaveLength(2);
    expect(result.gists[0].filename).toBe('file1.js');
    expect(result.gists[0].url).toBe('http://example.com/1');
    expect(result.gists[1].filename).toBe('file2.js');
    expect(result.gists[1].url).toBe('http://example.com/2');
  });

  // forEach Edge Cases Tests
  it('should validate callback functions and throw TypeError for non-functions', async () => {
    await expect(interpreter.execute(`
      let arr = [1, 2, 3];
      arr.forEach("not a function");
    `)).rejects.toThrow("is not a function");

    await expect(interpreter.execute(`
      let arr = [1, 2, 3];
      arr.forEach(undefined);
    `)).rejects.toThrow("undefined is not a function");
  });

  it('should not process items added during forEach iteration', async () => {
    const result = await interpreter.execute(`
      let arr = [1, 2, 3, 4, 5];
      let results = [];
      arr.forEach((item, index) => {
        results.push(item);
        if (index === 1) {
          arr.push(6); // Should not be processed
        }
      });
      return { results, finalArray: arr };
    `);
    
    expect(result.results).toEqual([1, 2, 3, 4, 5]); // Only original items processed
    expect(result.finalArray).toEqual([1, 2, 3, 4, 5, 6]); // But array was modified
  });

  it('should handle large arrays efficiently', async () => {
    const start = Date.now();
    const result = await interpreter.execute(`
      let arr = new Array(1000).fill(0).map((_, i) => i);
      let sum = 0;
      arr.forEach(item => {
        sum += item;
      });
      return sum;
    `);
    const end = Date.now();
    
    expect(result).toBe(499500); // Sum of 0 to 999
    expect(end - start).toBeLessThan(1000); // Should complete quickly
  });

  it('should handle circular references in forEach', async () => {
    const result = await interpreter.execute(`
      let obj1 = { name: "obj1" };
      let obj2 = { name: "obj2" };
      obj1.ref = obj2;
      obj2.ref = obj1; // Circular reference
      
      let arr = [obj1, obj2];
      let results = [];
      arr.forEach((item) => {
        results.push(item.name);
      });
      return results;
    `);
    
    expect(result).toEqual(['obj1', 'obj2']);
  });

  it('should handle memory-intensive operations in forEach', async () => {
    const result = await interpreter.execute(`
      let arr = [1, 2, 3];
      let results = [];
      arr.forEach((item) => {
        // Create object with many properties
        let obj = {};
        for (let i = 0; i < 100; i++) {
          obj["prop" + i] = "value" + i;
        }
        results.push(Object.keys(obj).length);
      });
      return results;
    `);
    
    expect(result).toEqual([100, 100, 100]);
  });

  it('should support array.sort() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [3, 1, 4, 1, 5, 9, 2, 6]
      let sorted = numbers.sort((a, b) => a - b)
      return sorted
    `);
    expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  it('should support array.reverse() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let reversed = numbers.reverse()
      return reversed
    `);
    expect(result).toEqual([5, 4, 3, 2, 1]);
  });

  it('should support array.slice() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let slice = numbers.slice(1, 4)
      return slice
    `);
    expect(result).toEqual([2, 3, 4]);
  });

  it('should support array.splice() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      // JavaScript splice mutates the array and returns removed elements
      let removed = numbers.splice(2, 1, 99)
      return { removed, numbers }
    `);
    expect(result.removed).toEqual([3]);
    expect(result.numbers).toEqual([1, 2, 99, 4, 5]);
  });

  it('should support array.concat() method', async () => {
    const result = await interpreter.execute(`
      let arr1 = [1, 2]
      let arr2 = [3, 4]
      let combined = arr1.concat(arr2)
      return combined
    `);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should support array.join() method', async () => {
    const result = await interpreter.execute(`
      let words = ["hello", "world"]
      let sentence = words.join(" ")
      return sentence
    `);
    expect(result).toBe('hello world');
  });

  it('should support array.includes() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      return numbers.includes(3)
    `);
    expect(result).toBe(true);
  });

  it('should support array.indexOf() and lastIndexOf() methods', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 2, 1]
      return {
        first: numbers.indexOf(2),
        last: numbers.lastIndexOf(2)
      }
    `);
    expect(result.first).toBe(1);
    expect(result.last).toBe(3);
  });

  it('should support array.push() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      // JavaScript push mutates the array and returns the new length
      let length = numbers.push(4, 5)
      return numbers
    `);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should support array.pop() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let last = numbers.pop()
      return last
    `);
    expect(result).toBe(3);
  });

  it('should support array.shift() and unshift() methods', async () => {
    const result = await interpreter.execute(`
      let numbers = [2, 3, 4]
      let first = numbers.shift() // removes and returns the first element
      let newLength = numbers.unshift(1, first) // adds items to front and returns new length
      return { first, newLength, numbers }
    `);
    expect(result.first).toBe(2);
    expect(result.newLength).toBe(4);
    expect(result.numbers).toEqual([1, 2, 3, 4]);
  });

  it('should support array.flat() method', async () => {
    const result = await interpreter.execute(`
      let nested = [1, [2, 3], [4, [5, 6]]]
      let flat = nested.flat()
      return flat
    `);
    expect(result).toEqual([1, 2, 3, 4, [5, 6]]);
  });

  it('should support array.flatMap() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let expanded = numbers.flatMap(n => [n, n * 2])
      return expanded
    `);
    expect(result).toEqual([1, 2, 2, 4, 3, 6]);
  });

  it('should support chaining array methods', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5, 6]
      let result = numbers
        .filter(n => n > 2)
        .map(n => n * 2)
        .reduce((sum, n) => sum + n, 0)
      return result
    `);
    expect(result).toBe(36); // (3*2 + 4*2 + 5*2 + 6*2) = 6 + 8 + 10 + 12 = 36
  });

  // Pipeline test removed - not JavaScript compatible

  it('should handle async operations in array methods', async () => {
    const result = await interpreter.execute(`
      // Simple async mapping test without delays
      let numbers = [1, 2, 3]
      let promises = numbers.map(async n => {
        return n * 2
      })
      let results = await Promise.all(promises)
      return results
    `);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should work with complex data structures', async () => {
    const result = await interpreter.execute(`
      let users = [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 35 }
      ]
      
      let names = users
        .filter(u => u.age > 25)
        .map(u => u.name)
      
      return names
    `);
    expect(result).toEqual(['Bob', 'Charlie']);
  });
});

describe('Backward Compatibility', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should still support function-style string operations', async () => {
    const result = await interpreter.execute(`
      let text = "hello,world"
      let parts = split(text, ",")
      return parts
    `);
    expect(result).toEqual(['hello', 'world']);
  });

  it('should still support function-style array operations', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let evens = filter(numbers, n => n % 2 === 0)
      return evens
    `);
    expect(result).toEqual([2, 4]);
  });

  it('should allow mixing function and method styles', async () => {
    const result = await interpreter.execute(`
      let text = "hello,world"
      let parts = text.split(",")
      let upper = toUpperCase(parts[0])
      return upper
    `);
    expect(result).toBe('HELLO');
  });

  it('should handle undefined methods gracefully', async () => {
    const result = await interpreter.execute(`
      let text = "hello"
      let notAMethod = text.nonExistentMethod
      return notAMethod === undefined
    `);
    expect(result).toBe(true);
  });

  it('should preserve array and string length property', async () => {
    const result = await interpreter.execute(`
      let text = "hello"
      let arr = [1, 2, 3]
      return {
        textLength: text.length,
        arrayLength: arr.length
      }
    `);
    expect(result.textLength).toBe(5);
    expect(result.arrayLength).toBe(3);
  });
});

describe('Edge Cases', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should handle empty strings correctly', async () => {
    const result = await interpreter.execute(`
      let text = ""
      return {
        split: text.split(","),
        includes: text.includes(""),
        length: text.length
      }
    `);
    expect(result.split).toEqual(['']);
    expect(result.includes).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should handle empty arrays correctly', async () => {
    const result = await interpreter.execute(`
      let arr = []
      return {
        filtered: arr.filter(x => true),
        mapped: arr.map(x => x),
        length: arr.length
      }
    `);
    expect(result.filtered).toEqual([]);
    expect(result.mapped).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should handle null/undefined correctly with optional chaining', async () => {
    const result = await interpreter.execute(`
      let nullStr = null
      let undefinedArr = undefined
      // Optional chaining on null/undefined returns undefined
      let splitResult = nullStr?.split
      let mapResult = undefinedArr?.map
      return {
        nullSplit: splitResult,
        undefinedMap: mapResult
      }
    `);
    expect(result.nullSplit).toBe(undefined);
    expect(result.undefinedMap).toBe(undefined);
  });

  it('should handle computed property access for methods', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      let methodName = "toUpperCase"
      let upper = text[methodName]()
      return upper
    `);
    expect(result).toBe('HELLO WORLD');
  });

  it('should handle methods in object literals', async () => {
    const result = await interpreter.execute(`
      let obj = {
        text: "hello",
        getUpper: function() { 
          // 'this' should refer to the object
          return this.text.toUpperCase() 
        }
      }
      return obj.getUpper()
    `);
    expect(result).toBe('HELLO');
  });
});