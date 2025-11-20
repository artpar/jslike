import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';
import { InMemoryModuleResolver } from '../../src/resolvers/memory.js';

describe('Binary Operators - in and instanceof', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        log: (...args) => args,
      },
    });
  });

  describe('in operator', () => {
    it('should check if property exists in object', async () => {
      const result = await interpreter.execute(`
        let obj = { name: "test", age: 25 };
        return {
          hasName: "name" in obj,
          hasAge: "age" in obj,
          hasEmail: "email" in obj
        };
      `);
      
      expect(result.hasName).toBe(true);
      expect(result.hasAge).toBe(true);
      expect(result.hasEmail).toBe(false);
    });

    it('should work with array indices', async () => {
      const result = await interpreter.execute(`
        let arr = [1, 2, 3];
        return {
          has0: 0 in arr,
          has1: 1 in arr,
          has5: 5 in arr,
          hasLength: "length" in arr
        };
      `);
      
      expect(result.has0).toBe(true);
      expect(result.has1).toBe(true);
      expect(result.has5).toBe(false);
      expect(result.hasLength).toBe(true);
    });

    it('should handle sparse arrays correctly', async () => {
      const result = await interpreter.execute(`
        let arr = new Array(3);
        arr[0] = 1;
        arr[2] = 3;
        // arr[1] is undefined but exists, so true for 'in' operator
        return {
          has0: 0 in arr,
          has1: 1 in arr,
          has2: 2 in arr,
          has5: 5 in arr
        };
      `);
      
      expect(result.has0).toBe(true);
      expect(result.has1).toBe(false); // not set, so doesn't exist
      expect(result.has2).toBe(true);
      expect(result.has5).toBe(false);
    });

    it('should check inherited properties', async () => {
      const result = await interpreter.execute(`
        class Parent {
          parentMethod() { return "parent"; }
        }
        
        class Child extends Parent {
          childMethod() { return "child"; }
        }
        
        let child = new Child();
        return {
          hasChildMethod: "childMethod" in child,
          hasParentMethod: "parentMethod" in child,
          hasNonExistent: "nonExistent" in child
        };
      `);
      
      expect(result.hasChildMethod).toBe(true);
      expect(result.hasParentMethod).toBe(true);
      expect(result.hasNonExistent).toBe(false);
    });

    it('should throw TypeError for null/undefined', async () => {
      await expect(interpreter.execute(`
        let obj = null;
        return "name" in obj;
      `)).rejects.toThrow('Cannot use "in" operator to search for property in null or undefined');

      await expect(interpreter.execute(`
        let obj = undefined;
        return "name" in obj;
      `)).rejects.toThrow('Cannot use "in" operator to search for property in null or undefined');
    });

    it('should convert left operand to string', async () => {
      const result = await interpreter.execute(`
        let obj = { 42: "answer", true: "boolean" };
        return {
          hasNumber: 42 in obj,
          hasBoolean: true in obj,
          hasString: "42" in obj
        };
      `);
      
      expect(result.hasNumber).toBe(true);
      expect(result.hasBoolean).toBe(true);
      expect(result.hasString).toBe(true);
    });

    it('should work with complex expressions', async () => {
      const result = await interpreter.execute(`
        let obj = { a: 1, b: 2 };
        let key = "a";
        return {
          dynamicKey: key in obj,
          computed: ("b" + "") in obj,
          expression: (key === "a" ? "a" : "b") in obj
        };
      `);
      
      expect(result.dynamicKey).toBe(true);
      expect(result.computed).toBe(true);
      expect(result.expression).toBe(true);
    });
  });

  describe('instanceof operator', () => {
    it('should check object type with built-in constructors', async () => {
      const result = await interpreter.execute(`
        let arr = [1, 2, 3];
        let obj = { name: "test" };
        
        return {
          arrayCheck: arr instanceof Array,
          objectCheck: obj instanceof Object
        };
      `);
      
      expect(result.arrayCheck).toBe(true);
      expect(result.objectCheck).toBe(true);
    });

    it('should work with custom classes', async () => {
      const result = await interpreter.execute(`
        class Animal {
          constructor(name) {
            this.name = name;
          }
        }
        
        class Dog extends Animal {
          constructor(name, breed) {
            super(name);
            this.breed = breed;
          }
        }
        
        let dog = new Dog("Rex", "Labrador");
        let animal = new Animal("Generic");
        
        return {
          dogIsDog: dog instanceof Dog,
          dogIsAnimal: dog instanceof Animal,
          animalIsDog: animal instanceof Dog,
          animalIsAnimal: animal instanceof Animal
        };
      `);
      
      expect(result.dogIsDog).toBe(true);
      expect(result.dogIsAnimal).toBe(true);
      expect(result.animalIsDog).toBe(false);
      expect(result.animalIsAnimal).toBe(true);
    });

    it('should handle primitive values correctly', async () => {
      const result = await interpreter.execute(`
        return {
          stringCheck: "hello" instanceof String,
          numberCheck: 42 instanceof Number,
          booleanCheck: true instanceof Boolean,
          nullCheck: null instanceof Object,
          undefinedCheck: undefined instanceof Object
        };
      `);
      
      expect(result.stringCheck).toBe(false);
      expect(result.numberCheck).toBe(false);
      expect(result.booleanCheck).toBe(false);
      expect(result.nullCheck).toBe(false);
      expect(result.undefinedCheck).toBe(false);
    });

    it('should throw TypeError for non-constructor right operand', async () => {
      await expect(interpreter.execute(`
        let obj = {};
        return obj instanceof "not a constructor";
      `)).rejects.toThrow('Right-hand side of instanceof is not a constructor');

      await expect(interpreter.execute(`
        let obj = {};
        return obj instanceof null;
      `)).rejects.toThrow('Right-hand side of instanceof is not a constructor');

      await expect(interpreter.execute(`
        let obj = {};
        return obj instanceof 42;
      `)).rejects.toThrow('Right-hand side of instanceof is not a constructor');
    });

    it('should work with function constructors', async () => {
      const result = await interpreter.execute(`
        function Person(name) {
          this.name = name;
        }
        
        // Note: Wang-Lang constructor behavior may differ from native JS
        let obj = {};
        
        return {
          functionCheck: Person instanceof Function,
          objectCheck: obj instanceof Person,
          funcType: typeof Person
        };
      `);
      
      expect(result.functionCheck).toBe(true);
      expect(result.objectCheck).toBe(false);
      expect(result.funcType).toBe('function');
    });

    it('should handle complex inheritance chains', async () => {
      const result = await interpreter.execute(`
        class GrandParent {
          grandParentMethod() { return "grandparent"; }
        }
        
        class Parent extends GrandParent {
          parentMethod() { return "parent"; }
        }
        
        class Child extends Parent {
          childMethod() { return "child"; }
        }
        
        let child = new Child();
        
        return {
          isChild: child instanceof Child,
          isParent: child instanceof Parent,
          isGrandParent: child instanceof GrandParent,
          isObject: child instanceof Object
        };
      `);
      
      expect(result.isChild).toBe(true);
      expect(result.isParent).toBe(true);
      expect(result.isGrandParent).toBe(true);
      expect(result.isObject).toBe(true);
    });

    it('should work in conditional expressions', async () => {
      const result = await interpreter.execute(`
        class Vehicle {}
        class Car extends Vehicle {}
        
        let car = new Car();
        let obj = {};
        
        function getType(item) {
          if (item instanceof Car) {
            return "car";
          } else if (item instanceof Vehicle) {
            return "vehicle";
          } else {
            return "unknown";
          }
        }
        
        return {
          carType: getType(car),
          objType: getType(obj)
        };
      `);
      
      expect(result.carType).toBe("car");
      expect(result.objType).toBe("unknown");
    });
  });

  describe('Combined operator usage', () => {
    it('should work together in complex expressions', async () => {
      const result = await interpreter.execute(`
        class TestClass {
          constructor() {
            this.prop = "value";
          }
        }
        
        let obj = new TestClass();
        let arr = [1, 2, 3];
        
        return {
          hasProperty: "prop" in obj && obj instanceof TestClass,
          isArrayWithLength: arr instanceof Array && "length" in arr,
          complexCheck: ("prop" in obj) && (obj instanceof TestClass) && (arr instanceof Array)
        };
      `);
      
      expect(result.hasProperty).toBe(true);
      expect(result.isArrayWithLength).toBe(true);
      expect(result.complexCheck).toBe(true);
    });

    it('should work in forEach callbacks', async () => {
      const result = await interpreter.execute(`
        class Item {
          constructor(value) {
            this.value = value;
          }
        }
        
        let items = [
          new Item(1),
          { value: 2 },
          new Item(3),
          { notValue: 4 }
        ];
        
        let results = [];
        items.forEach((item) => {
          if (item instanceof Item && "value" in item) {
            results.push({ type: "Item", value: item.value });
          } else if ("value" in item) {
            results.push({ type: "Object", value: item.value });
          } else {
            results.push({ type: "Unknown", value: null });
          }
        });
        
        return results;
      `);
      
      expect(result).toEqual([
        { type: "Item", value: 1 },
        { type: "Object", value: 2 },
        { type: "Item", value: 3 },
        { type: "Unknown", value: null }
      ]);
    });
  });
});