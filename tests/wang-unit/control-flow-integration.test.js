import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Control Flow Integration - If/Else with Other Constructs', () => {
  const ctx = new TestContext();

  describe('If/else with try-catch-finally', () => {
    it('should handle if/else inside try block', async () => {
      const result = await ctx.execute(`
        let result = [];
        try {
          let x = 5;
          if (x > 3) result.push("greater");
          else result.push("lesser");
          result.push("try-success");
        } catch (e) {
          result.push("caught");
        }
        result
      `);
      expect(result).toEqual(["greater", "try-success"]);
    });

    it('should handle if/else inside catch block', async () => {
      const result = await ctx.execute(`
        let result = [];
        try {
          throw new Error("test error");
        } catch (e) {
          if (e.message === "test error") result.push("expected-error");
          else result.push("unexpected-error");
        }
        result
      `);
      expect(result).toEqual(["expected-error"]);
    });

    it('should handle if/else inside finally block', async () => {
      const result = await ctx.execute(`
        let result = [];
        let cleanup = true;
        try {
          result.push("try");
        } finally {
          if (cleanup) result.push("cleaned");
          else result.push("not-cleaned");
        }
        result
      `);
      expect(result).toEqual(["try", "cleaned"]);
    });

    it('should handle if/else spanning try-catch', async () => {
      const result = await ctx.execute(`
        let shouldThrow = false;
        let result;
        
        if (shouldThrow) {
          try {
            throw new Error("test");
          } catch (e) {
            result = "error-path";
          }
        } else {
          try {
            result = "normal-path";
          } catch (e) {
            result = "unexpected-error";
          }
        }
        result
      `);
      expect(result).toBe("normal-path");
    });
  });

  describe('If/else with function definitions and calls', () => {
    it('should handle if/else inside function declarations', async () => {
      const result = await ctx.execute(`
        function classify(x) {
          if (x > 0) return "positive";
          else if (x < 0) return "negative";
          else return "zero";
        }
        
        [classify(5), classify(-2), classify(0)]
      `);
      expect(result).toEqual(["positive", "negative", "zero"]);
    });

    it('should handle if/else inside arrow functions', async () => {
      const result = await ctx.execute(`
        let categorize = (age) => {
          if (age < 13) return "child";
          else if (age < 20) return "teen";
          else if (age < 65) return "adult";
          else return "senior";
        };
        
        [categorize(10), categorize(16), categorize(30), categorize(70)]
      `);
      expect(result).toEqual(["child", "teen", "adult", "senior"]);
    });

    it('should handle if/else with recursive functions', async () => {
      const result = await ctx.execute(`
        function factorial(n) {
          if (n <= 1) return 1;
          else return n * factorial(n - 1);
        }
        
        factorial(5)
      `);
      expect(result).toBe(120);
    });

    it('should handle if/else with async functions', async () => {
      const result = await ctx.execute(`
        async function processData(shouldDelay) {
          if (shouldDelay) {
            // Simulate async operation
            return "delayed-result";
          } else {
            return "immediate-result";
          }
        }
        
        async function main() {
          let result1 = await processData(false);
          let result2 = await processData(true);
          return [result1, result2];
        }
        
        await main()
      `);
      expect(result).toEqual(["immediate-result", "delayed-result"]);
    });
  });

  describe('If/else with class definitions and methods', () => {
    it('should handle if/else inside class methods', async () => {
      const result = await ctx.execute(`
        class Calculator {
          divide(a, b) {
            if (b === 0) return "Cannot divide by zero";
            else return a / b;
          }
        }
        
        let calc = new Calculator();
        [calc.divide(10, 2), calc.divide(10, 0)]
      `);
      expect(result).toEqual([5, "Cannot divide by zero"]);
    });

    it('should handle if/else inside constructors', async () => {
      const result = await ctx.execute(`
        class Person {
          constructor(name, age) {
            this.name = name;
            if (age < 0) this.age = 0;
            else if (age > 150) this.age = 150;
            else this.age = age;
          }
        }
        
        let p1 = new Person("Alice", 25);
        let p2 = new Person("Bob", -5);
        let p3 = new Person("Charlie", 200);
        
        [p1.age, p2.age, p3.age]
      `);
      expect(result).toEqual([25, 0, 150]);
    });

    it('should handle if/else with class inheritance', async () => {
      const result = await ctx.execute(`
        class Shape {
          constructor(type) {
            this.type = type;
          }
          
          describe() {
            if (this.type === "circle") return "I am round";
            else if (this.type === "square") return "I have four equal sides";
            else return "I am a generic shape";
          }
        }
        
        class Circle extends Shape {
          constructor() {
            super("circle");
          }
        }
        
        let shape = new Shape("triangle");
        let circle = new Circle();
        
        [shape.describe(), circle.describe()]
      `);
      expect(result).toEqual(["I am a generic shape", "I am round"]);
    });
  });

  describe('If/else with advanced loop constructs', () => {
    it('should handle if/else with for-of loops', async () => {
      const result = await ctx.execute(`
        let items = [1, 2, 3, 4, 5];
        let results = [];
        
        for (let item of items) {
          if (item % 2 === 0) results.push("even: " + item);
          else results.push("odd: " + item);
        }
        
        results
      `);
      expect(result).toEqual(["odd: 1", "even: 2", "odd: 3", "even: 4", "odd: 5"]);
    });

    it('should handle if/else with for-in loops', async () => {
      const result = await ctx.execute(`
        let obj = { a: 1, b: 2, c: 3 };
        let results = [];
        
        for (let key in obj) {
          if (obj[key] % 2 === 0) results.push(key + ": even");
          else results.push(key + ": odd");
        }
        
        results.sort() // Ensure consistent order
      `);
      expect(result).toEqual(["a: odd", "b: even", "c: odd"]);
    });

    it('should handle nested loops with if/else', async () => {
      const result = await ctx.execute(`
        let matrix = [[1, 2], [3, 4], [5, 6]];
        let results = [];
        
        for (let i = 0; i < matrix.length; i++) {
          for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] % 2 === 0) results.push("even");
            else results.push("odd");
          }
        }
        
        results
      `);
      expect(result).toEqual(["odd", "even", "odd", "even", "odd", "even"]);
    });

    it('should handle if/else with simple break and continue', async () => {
      const result = await ctx.execute(`
        let results = [];
        
        for (let i = 0; i < 5; i++) {
          if (i === 2) continue;
          else if (i === 4) break;
          else results.push(i);
        }
        
        results
      `);
      expect(result).toEqual([0, 1, 3]);
    });
  });

  describe('If/else with destructuring and modern syntax', () => {
    it('should handle if/else with array destructuring', async () => {
      const result = await ctx.execute(`
        let pairs = [[1, 2], [3, 4], [5, 6]];
        let results = [];
        
        for (let [a, b] of pairs) {
          if (a > b) results.push("first greater");
          else if (b > a) results.push("second greater");
          else results.push("equal");
        }
        
        results
      `);
      expect(result).toEqual(["second greater", "second greater", "second greater"]);
    });

    it('should handle if/else with object destructuring', async () => {
      const result = await ctx.execute(`
        let users = [
          { name: "Alice", age: 25, status: "active" },
          { name: "Bob", age: 17, status: "inactive" },
          { name: "Charlie", age: 30, status: "active" }
        ];
        let results = [];
        
        for (let { name, age, status } of users) {
          if (age >= 18 && status === "active") results.push(name + ": adult-active");
          else if (age >= 18) results.push(name + ": adult-inactive");
          else results.push(name + ": minor");
        }
        
        results
      `);
      expect(result).toEqual(["Alice: adult-active", "Bob: minor", "Charlie: adult-active"]);
    });

    it('should handle if/else with spread operator', async () => {
      const result = await ctx.execute(`
        let baseConfig = { debug: false, timeout: 1000 };
        let userConfig = { debug: true };
        let config;
        
        if (userConfig.debug !== undefined) {
          config = { ...baseConfig, ...userConfig };
        } else {
          config = { ...baseConfig };
        }
        
        config
      `);
      expect(result).toEqual({ debug: true, timeout: 1000 });
    });
  });

  describe('If/else with template literals and expressions', () => {
    it('should handle if/else with ternary operators (JavaScript alternative)', async () => {
      const result = await ctx.execute(`
        let users = [
          { name: "Alice", score: 85 },
          { name: "Bob", score: 92 },
          { name: "Charlie", score: 78 }
        ];
        
        let reports = users.map(user => {
          let grade;
          let status;
          if (user.score >= 90) grade = "A";
          else if (user.score >= 80) grade = "B";
          else grade = "C";
          
          if (user.score >= 80) status = "Pass";
          else status = "Fail";
          
          return {
            name: user.name,
            grade: grade,
            status: status
          };
        });
        
        reports
      `);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Alice");
      expect(result[1].grade).toBe("A");
      expect(result[2].status).toBe("Fail");
    });

    it('should handle complex expressions in if conditions', async () => {
      const result = await ctx.execute(`
        let data = [
          { items: [1, 2, 3], metadata: { valid: true } },
          { items: [], metadata: { valid: false } },
          { items: [4, 5], metadata: { valid: true } }
        ];
        
        let processed = data.map(entry => {
          if (entry.items.length > 0 && entry.metadata.valid) {
            return entry.items.reduce((sum, item) => sum + item, 0);
          } else if (entry.items.length > 0) {
            return "invalid-data";
          } else {
            return "empty";
          }
        });
        
        processed
      `);
      expect(result).toEqual([6, "empty", 9]);
    });
  });

  describe('If/else with modules and imports (simulated)', () => {
    it('should handle if/else with module-like patterns', async () => {
      ctx.addModule('utils', `
        export function isPositive(n) {
          return n > 0;
        }
        
        export function isEven(n) {
          return n % 2 === 0;
        }
      `);

      const result = await ctx.execute(`
        import { isPositive, isEven } from "utils";
        
        let numbers = [-2, -1, 0, 1, 2, 3, 4];
        let classified = [];
        
        for (let num of numbers) {
          if (isPositive(num) && isEven(num)) classified.push("positive-even");
          else if (isPositive(num)) classified.push("positive-odd");
          else if (isEven(num)) classified.push("non-positive-even");
          else classified.push("non-positive-odd");
        }
        
        classified
      `);
      expect(result).toEqual([
        "non-positive-even", "non-positive-odd", "non-positive-even",
        "positive-odd", "positive-even", "positive-odd", "positive-even"
      ]);
    });
  });
});