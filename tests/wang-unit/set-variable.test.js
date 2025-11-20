import { describe, it, expect } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';

describe('setVariable() method', () => {
  it('should set primitive variables', async () => {
    const interpreter = new WangInterpreter();
    
    interpreter.setVariable('myNumber', 42);
    interpreter.setVariable('myString', 'hello');
    interpreter.setVariable('myBoolean', true);
    interpreter.setVariable('myNull', null);
    interpreter.setVariable('myUndefined', undefined);
    
    const result = await interpreter.execute(`
      log("myNumber:", myNumber)
      log("myString:", myString)
      log("myBoolean:", myBoolean)
      log("myNull:", myNull)
      log("myUndefined:", myUndefined)
      myNumber
    `);
    
    expect(result).toBe(42);
  });

  it('should set Math object as a variable', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Math', Math);
    
    const result = await interpreter.execute(`
      let x = Math.abs(-10)
      let y = Math.floor(3.7)
      let z = Math.max(1, 2, 3)
      let pi = Math.PI
      x + y + z
    `);
    
    expect(result).toBe(16); // 10 + 3 + 3
  });

  it('should set JSON object as a variable', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('JSON', JSON);
    
    const result = await interpreter.execute(`
      let obj = { name: "test", value: 123 }
      let str = JSON.stringify(obj)
      let parsed = JSON.parse(str)
      parsed.value
    `);
    
    expect(result).toBe(123);
  });

  it('should set Object methods as a variable', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Object', Object);
    
    const result = await interpreter.execute(`
      let obj = { a: 1, b: 2, c: 3 }
      let keys = Object.keys(obj)
      let values = Object.values(obj)
      keys.length + values[0] + values[1] + values[2]
    `);
    
    expect(result).toBe(9); // 3 + 1 + 2 + 3
  });

  it('should set Array methods as a variable', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Array', Array);
    
    const result = await interpreter.execute(`
      let isArr = Array.isArray([1, 2, 3])
      let fromStr = Array.from("abc")
      fromStr.length
    `);
    
    expect(result).toBe(3);
  });

  it('should set custom objects as variables', async () => {
    const interpreter = new WangInterpreter();
    
    const customObj = {
      name: 'CustomObject',
      getValue: () => 42,
      add: (a, b) => a + b,
      nested: {
        deep: {
          value: 'deep value'
        }
      }
    };
    
    interpreter.setVariable('custom', customObj);
    
    const result = await interpreter.execute(`
      let name = custom.name
      let value = custom.getValue()
      let sum = custom.add(10, 20)
      let deep = custom.nested.deep.value
      sum
    `);
    
    expect(result).toBe(30);
  });

  it('should override built-in variables if set', async () => {
    const interpreter = new WangInterpreter();
    
    // Override NaN with a custom value
    interpreter.setVariable('NaN', 'Not a Number');
    
    const result = await interpreter.execute(`
      NaN
    `);
    
    expect(result).toBe('Not a Number');
  });

  // Pipeline operators removed - not JavaScript compatible
  // Test removed as it used Wang-specific pipeline syntax

  it('should allow setting functions as variables', async () => {
    const interpreter = new WangInterpreter();
    
    const myFunc = (x) => x * 2;
    interpreter.setVariable('double', myFunc);
    
    const result = await interpreter.execute(`
      let x = double(21)
      x
    `);
    
    expect(result).toBe(42);
  });

  it('should persist across multiple executions', async () => {
    const interpreter = new WangInterpreter();
    
    interpreter.setVariable('persistentValue', 100);
    
    const result1 = await interpreter.execute(`persistentValue`);
    expect(result1).toBe(100);
    
    const result2 = await interpreter.execute(`persistentValue + 50`);
    expect(result2).toBe(150);
    
    // Change the value
    interpreter.setVariable('persistentValue', 200);
    
    const result3 = await interpreter.execute(`persistentValue`);
    expect(result3).toBe(200);
  });
});