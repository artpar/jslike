import { describe, it, test, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

/**
 * Tests for the new dynamic constructor detection system.
 * This ensures that native constructors like KeyboardEvent, MouseEvent, etc.
 * can be used with the `new` operator, while maintaining compatibility with
 * Wang-defined classes.
 */
describe('Constructor Detection', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({ moduleResolver: resolver });
  });

  describe('Native JavaScript Constructors', () => {
    test('should work with built-in constructors (Date, Error, Array, etc.)', async () => {
      // Test the previously whitelisted constructors
      interpreter.setVariable('Date', Date);
      interpreter.setVariable('Error', Error);
      interpreter.setVariable('Array', Array);
      interpreter.setVariable('Object', Object);
      interpreter.setVariable('RegExp', RegExp);
      interpreter.setVariable('Map', Map);
      interpreter.setVariable('Set', Set);
      interpreter.setVariable('Promise', Promise);

      const result = await interpreter.execute(`
        let results = []
        
        // Test Date constructor
        let date = new Date(2023, 0, 1)
        results.push(date.getFullYear())
        
        // Test Error constructor
        let error = new Error("test error")
        results.push(error.message)
        
        // Test Array constructor
        let arr = new Array(3)
        results.push(arr.length)
        
        // Test Object constructor
        let obj = new Object()
        results.push(typeof obj)
        
        // Test RegExp constructor
        let regex = new RegExp("test")
        results.push(regex.test("testing"))
        
        // Test Map constructor
        let map = new Map()
        map.set("key", "value")
        results.push(map.get("key"))
        
        // Test Set constructor
        let set = new Set([1, 2, 3])
        results.push(set.has(2))
        
        // Test Promise constructor
        let promise = new Promise((resolve) => resolve(42))
        let promiseResult = await promise
        results.push(promiseResult)
        
        results
      `);

      expect(result).toEqual([2023, "test error", 3, "object", true, "value", true, 42]);
    });

    test('should work with browser API constructors (KeyboardEvent, MouseEvent, etc.)', async () => {
      // Mock browser API constructors that simulate the browser's native constructors
      function MockKeyboardEvent(type, options = {}) {
        if (!(this instanceof MockKeyboardEvent)) {
          throw new TypeError("Failed to construct 'KeyboardEvent': Please use the 'new' operator");
        }
        this.type = type;
        this.key = options.key || '';
        this.code = options.code || '';
      }
      MockKeyboardEvent.prototype.constructor = MockKeyboardEvent;
      Object.defineProperty(MockKeyboardEvent, 'prototype', { writable: false });

      function MockMouseEvent(type, options = {}) {
        if (!(this instanceof MockMouseEvent)) {
          throw new TypeError("Failed to construct 'MouseEvent': Please use the 'new' operator");
        }
        this.type = type;
        this.clientX = options.clientX || 0;
        this.clientY = options.clientY || 0;
      }
      MockMouseEvent.prototype.constructor = MockMouseEvent;
      Object.defineProperty(MockMouseEvent, 'prototype', { writable: false });

      function MockCustomEvent(type, options = {}) {
        if (!(this instanceof MockCustomEvent)) {
          throw new TypeError("Failed to construct 'CustomEvent': Please use the 'new' operator");
        }
        this.type = type;
        this.detail = options.detail || null;
      }
      MockCustomEvent.prototype.constructor = MockCustomEvent;
      Object.defineProperty(MockCustomEvent, 'prototype', { writable: false });

      interpreter.setVariable('KeyboardEvent', MockKeyboardEvent);
      interpreter.setVariable('MouseEvent', MockMouseEvent);
      interpreter.setVariable('CustomEvent', MockCustomEvent);

      const result = await interpreter.execute(`
        let results = []
        
        // Test KeyboardEvent constructor
        let keyEvent = new KeyboardEvent("keydown", { key: "Enter", code: "Enter" })
        results.push([keyEvent.type, keyEvent.key, keyEvent.code])
        
        // Test MouseEvent constructor
        let mouseEvent = new MouseEvent("click", { clientX: 100, clientY: 200 })
        results.push([mouseEvent.type, mouseEvent.clientX, mouseEvent.clientY])
        
        // Test CustomEvent constructor
        let customEvent = new CustomEvent("custom", { detail: { value: 42 } })
        results.push([customEvent.type, customEvent.detail.value])
        
        results
      `);

      expect(result).toEqual([
        ["keydown", "Enter", "Enter"],
        ["click", 100, 200],
        ["custom", 42]
      ]);
    });

    test('should detect native constructors by [native code] pattern', async () => {
      // Create a mock native constructor that contains [native code] in toString()
      function MockNativeConstructor() {
        if (!(this instanceof MockNativeConstructor)) {
          throw new TypeError("Failed to construct: Please use the 'new' operator");
        }
        this.value = "native";
      }
      MockNativeConstructor.prototype.constructor = MockNativeConstructor;
      // Override toString to simulate native code pattern
      MockNativeConstructor.toString = () => 'function MockNativeConstructor() { [native code] }';

      interpreter.setVariable('MockNative', MockNativeConstructor);

      const result = await interpreter.execute(`
        let obj = new MockNative()
        obj.value
      `);

      expect(result).toBe("native");
    });
  });

  describe('Wang-defined Classes', () => {
    test('should still work with Wang classes (async constructors)', async () => {
      const result = await interpreter.execute(`
        class Animal {
          constructor(name) {
            this.name = name
          }
          
          speak() {
            return this.name + " makes a sound"
          }
        }
        
        class Dog extends Animal {
          constructor(name, breed) {
            super(name)
            this.breed = breed
          }
          
          speak() {
            return this.name + " barks"
          }
          
          getBreed() {
            return this.breed
          }
        }
        
        let dog = new Dog("Rex", "Labrador");
        [dog.name, dog.breed, dog.speak(), dog.getBreed()]
      `);

      expect(result).toEqual(["Rex", "Labrador", "Rex barks", "Labrador"]);
    });

    test('should properly detect async functions as Wang classes', async () => {
      // Test that async functions are not treated as native constructors
      // Note: In JavaScript, async functions cannot be used as constructors with new
      // This test verifies that calling an async function with new returns a promise
      // that resolves to the returned object
      interpreter.bindFunction('createAsyncConstructor', () => {
        return async function AsyncConstructor(value) {
          return { value, type: 'async' };
        };
      });

      const result = await interpreter.execute(`
        let AsyncCtor = createAsyncConstructor()
        let instance = await new AsyncCtor("test");
        [instance.value, instance.type]
      `);

      expect(result).toEqual(["test", "async"]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle constructors without typical prototype pattern', async () => {
      // Test with a function that doesn't have the typical constructor pattern
      // (can't delete prototype on regular function, so we'll use a different approach)
      const WeirdConstructor = function(value) {
        return { value, type: 'weird' };
      };
      // Modify prototype to not follow typical constructor pattern
      WeirdConstructor.prototype = {};

      interpreter.setVariable('WeirdConstructor', WeirdConstructor);

      const result = await interpreter.execute(`
        let instance = new WeirdConstructor("test");
        [instance.value, instance.type]
      `);

      expect(result).toEqual(["test", "weird"]);
    });

    test('should handle non-function values gracefully', async () => {
      await expect(interpreter.execute(`
        let notAFunction = "not a function"
        new notAFunction()
      `)).rejects.toThrow(/Type mismatch in new expression/);
    });

    test('should handle arrow functions as constructors', async () => {
      interpreter.bindFunction('getArrowFunction', () => {
        return (value) => ({ value, type: 'arrow' });
      });

      const result = await interpreter.execute(`
        let ArrowCtor = getArrowFunction()
        let instance = new ArrowCtor("test");
        [instance.value, instance.type]
      `);

      expect(result).toEqual(["test", "arrow"]);
    });
  });

  describe('Mixed Constructor Types', () => {
    test('should handle mixed native and Wang constructors in same code', async () => {
      interpreter.setVariable('Date', Date);
      interpreter.setVariable('Array', Array);

      const result = await interpreter.execute(`
        class WangClass {
          constructor(value) {
            this.value = value
            this.type = "wang"
          }
        }
        
        let results = []
        
        // Native constructors
        let date = new Date(2023, 0, 1)
        let arr = new Array(3)
        
        // Wang constructor
        let wangInstance = new WangClass("test")
        
        results.push(date.getFullYear())
        results.push(arr.length)
        results.push([wangInstance.value, wangInstance.type])
        
        results
      `);

      expect(result).toEqual([2023, 3, ["test", "wang"]]);
    });
  });
});