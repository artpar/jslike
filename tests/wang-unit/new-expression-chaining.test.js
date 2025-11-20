import { expect, describe, it } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';

describe('NewExpression Method Chaining', () => {
  it('should support method chaining on new expressions without parentheses', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    
    const result = await interpreter.execute(`
      __result = new Date().toISOString()
    `);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should support method chaining on new expressions with parentheses', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    
    const result = await interpreter.execute(`
      __result = (new Date()).toISOString()
    `);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should support property access on new expressions', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    interpreter.setVariable('Array', Array);
    
    const result = await interpreter.execute(`
      let arr = new Array(5).length
      __result = arr
    `);
    
    expect(result).toBe(5);
  });

  it('should support chained method calls on new expressions', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    
    const result = await interpreter.execute(`
      __result = new Date("2024-01-01").getFullYear()
    `);
    
    expect(result).toBe(2024);
  });

  it('should support optional chaining on new expressions', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    
    const result = await interpreter.execute(`
      let d = new Date()
      __result = d?.toISOString()
    `);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should support computed property access on new expressions', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    
    const result = await interpreter.execute(`
      let method = "toISOString"
      __result = new Date()[method]()
    `);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should work with built-in Map constructor', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Map', Map);
    
    const result = await interpreter.execute(`
      __result = new Map().size
    `);
    
    expect(result).toBe(0);
  });

  it('should work in assignment expressions', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    
    const result = await interpreter.execute(`
      let isoString = new Date("2024-06-15").toISOString()
      __result = isoString
    `);
    
    expect(result).toBe("2024-06-15T00:00:00.000Z");
  });

  it('should work with new expressions without arguments', async () => {
    const interpreter = new WangInterpreter();
    interpreter.setVariable('Date', Date);
    
    // Test that new without parens still works (creates instance but doesn't call methods)
    const result = await interpreter.execute(`
      let d = new Date
      __result = typeof d
    `);
    
    expect(result).toBe("object");
  });
});