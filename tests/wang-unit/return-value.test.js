import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Wang Interpreter Return Values', () => {
  let interpreter;

  beforeEach(() => {
    const resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        add: (a, b) => a + b,
        multiply: (a, b) => a * b,
      },
    });
  });

  it('should return the last evaluated expression', async () => {
    const result = await interpreter.execute(`
      let x = 5
      let y = 10
      x + y
    `);
    expect(result).toBe(15);
  });

  it('should return undefined for declarations as last statement', async () => {
    const result = await interpreter.execute(`
      let x = 5
      let y = 10
      let z = x + y
    `);
    expect(result).toBeUndefined();
  });

  it('should return the value of the last expression in a block', async () => {
    const result = await interpreter.execute(`
      let x = 5
      {
        let y = 10
        x = x + y
      }
      x * 2
    `);
    expect(result).toBe(30);
  });

  it('should return the result of the last function call', async () => {
    const result = await interpreter.execute(`
      function calculate(a, b) {
        return a * b + 10
      }
      
      let x = 5
      calculate(x, 3)
    `);
    expect(result).toBe(25);
  });

  it('should return the last value in a sequence of expressions', async () => {
    const result = await interpreter.execute(`
      5
      10
      15
      20
    `);
    expect(result).toBe(20);
  });

  it('should return array/object literals as last expression', async () => {
    const arrayResult = await interpreter.execute(`
      let x = 5;
      [x, x * 2, x * 3]
    `);
    expect(arrayResult).toEqual([5, 10, 15]);

    const objResult = await interpreter.execute(`
      let name = "Wang"
      let version = "1.0";
      ({ name, version, active: true })
    `);
    expect(objResult).toEqual({ name: 'Wang', version: '1.0', active: true });
  });

  it('should return the value from conditional expressions', async () => {
    const result1 = await interpreter.execute(`
      let x = 10
      if (x > 5) {
        "big"
      } else {
        "small"
      }
    `);
    expect(result1).toBe('big');

    const result2 = await interpreter.execute(`
      let x = 3
      if (x > 5) {
        "big"
      } else {
        "small"
      }
    `);
    expect(result2).toBe('small');
  });

  it('should return the last value from a loop', async () => {
    const result = await interpreter.execute(`
      let sum = 0
      for (let i = 1; i <= 5; i = i + 1) {
        sum = sum + i
      }
      sum
    `);
    expect(result).toBe(15);
  });

  it('should handle explicit return-like pattern', async () => {
    // In Wang, the last expression acts as an implicit return
    const result = await interpreter.execute(`
      function process(x) {
        let doubled = x * 2
        let tripled = x * 3
        return doubled + tripled
      }
      
      // Last expression is what gets returned from execute()
      process(5)
    `);
    expect(result).toBe(25);
  });

  it('should work with function composition returning last value', async () => {
    interpreter.bindFunction('double', (x) => x * 2);
    interpreter.bindFunction('addTen', (x) => x + 10);

    const result = await interpreter.execute(`
      let start = 5
      addTen(double(start))
    `);
    expect(result).toBe(20);
  });

  it('should handle complex nested expressions', async () => {
    const result = await interpreter.execute(`
      let data = { x: 5, y: 10 }
      let factor = 2;

      // The last expression becomes the return value
      ({
        result: (data.x + data.y) * factor,
        sum: data.x + data.y,
        product: data.x * data.y
      })
    `);
    expect(result).toEqual({
      result: 30,
      sum: 15,
      product: 50,
    });
  });

  it('should return undefined for empty programs', async () => {
    const result = await interpreter.execute('');
    expect(result).toBeUndefined();
  });

  it('should return undefined when last statement is a function declaration', async () => {
    const result = await interpreter.execute(`
      let x = 5
      function test() { return x * 2 }
    `);
    expect(result).toBeUndefined();
  });

  it('should return class instances when created as last expression', async () => {
    const result = await interpreter.execute(`
      class Calculator {
        constructor(initial) {
          this.value = initial
        }
        
        add(x) {
          this.value = this.value + x
          return this
        }
        
        getValue() {
          return this.value
        }
      }
      
      const calc = new Calculator(10)
      calc.add(5).getValue()
    `);
    expect(result).toBe(15);
  });
});
