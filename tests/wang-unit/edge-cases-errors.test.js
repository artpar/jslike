import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Edge Cases: Error Handling and Propagation', () => {
  let interpreter;
  let moduleResolver;

  beforeEach(() => {
    moduleResolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver,
      functions: {
        // Only provide test helper functions, not JavaScript built-ins
        throwError: (msg) => {
          throw new Error(msg);
        },
        asyncThrow: async (msg) => {
          throw new Error(msg);
        },
        safeDivide: (a, b) => {
          if (b === 0) throw new Error('Division by zero');
          return a / b;
        },
      },
    });
  });

  describe('Try-Catch-Finally Edge Cases', () => {
    it('should handle try without catch', async () => {
      const code = `
                let result = 'initial'
                try {
                    result = 'in try'
                } finally {
                    result = result + ' and finally'
                }
                result
            `;
      const result = await interpreter.execute(code);
      expect(result).toBe('in try and finally');
    });

    it('should execute finally even when error is thrown', async () => {
      const code = `
                let log = []
                try {
                    log.push('try')
                    throwError('test error')
                    log.push('after error')
                } catch (e) {
                    log.push('catch')
                } finally {
                    log.push('finally')
                }
                log
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual(['try', 'catch', 'finally']);
    });

    it('should handle nested try-catch blocks', async () => {
      const code = `
                let log = []
                try {
                    log.push('outer try')
                    try {
                        log.push('inner try')
                        throwError('inner error')
                    } catch (e) {
                        log.push('inner catch')
                        throwError('rethrow')
                    } finally {
                        log.push('inner finally')
                    }
                } catch (e) {
                    log.push('outer catch')
                } finally {
                    log.push('outer finally')
                }
                log
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual([
        'outer try',
        'inner try',
        'inner catch',
        'inner finally',
        'outer catch',
        'outer finally',
      ]);
    });

    it('should handle return in try with finally', async () => {
      const code = `
                function test() {
                    try {
                        return 'from try'
                    } finally {
                        // finally executes but doesn't override return
                    }
                }
                test()
            `;
      const result = await interpreter.execute(code);
      expect(result).toBe('from try');
    });

    it('should handle throw in finally', async () => {
      const code = `
                function test() {
                    try {
                        return 'from try'
                    } finally {
                        throw new Error('from finally')
                    }
                }
                let result
                try {
                    result = test()
                } catch (e) {
                    result = e.message
                }
                result
            `;
      const result = await interpreter.execute(code);
      expect(result).toBe('from finally');
    });

    it('should handle error in catch block', async () => {
      const code = `
                let log = []
                try {
                    try {
                        throwError('first error')
                    } catch (e) {
                        log.push('caught first')
                        throwError('error in catch')
                    }
                } catch (e) {
                    log.push('caught error from catch')
                }
                log
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual(['caught first', 'caught error from catch']);
    });
  });

  describe('Error Types and Messages', () => {
    it('should preserve error types', async () => {
      const code = `
                let errors = []
                
                try {
                    let x = null
                    x.property
                } catch (e) {
                    errors.push({ type: 'null access', message: e.message })
                }
                
                try {
                    nonExistentFunction()
                } catch (e) {
                    errors.push({ type: 'undefined function', message: e.message })
                }
                
                try {
                    let obj = {}
                    obj.method()
                } catch (e) {
                    errors.push({ type: 'not a function', message: e.message })
                }
                
                errors
            `;
      const result = await interpreter.execute(code);
      expect(result[0].type).toBe('null access');
      expect(result[0].message).toContain('Cannot read property');
      // Other error types depend on implementation
    });

    it('should handle custom error objects', async () => {
      const code = `
                class CustomError extends Error {
                    constructor(message, code) {
                        super(message)
                        this.name = 'CustomError'
                        this.code = code
                    }
                }
                
                try {
                    throw new CustomError('Custom message', 'ERR_001')
                } catch (e) {
                    {
                        name: e.name,
                        message: e.message,
                        code: e.code
                    }
                }
            `;
      const result = await interpreter.execute(code);
      expect(result.name).toBe('CustomError');
      expect(result.message).toBe('Custom message');
      expect(result.code).toBe('ERR_001');
    });

    it('should handle throwing non-Error values', async () => {
      const code = `
                let caught = []
                
                try { throw 42 } catch (e) { caught.push(e) }
                try { throw 'string error' } catch (e) { caught.push(e) }
                try { throw null } catch (e) { caught.push(e) }
                try { throw { custom: 'object' } } catch (e) { caught.push(e) }
                
                caught
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual([42, 'string error', null, { custom: 'object' }]);
    });
  });

  describe('Async Error Handling', () => {
    it('should handle errors in async functions', async () => {
      const code = `
                async function failingAsync() {
                    await Promise.resolve()
                    throw new Error('async error')
                }
                
                let result
                try {
                    await failingAsync()
                    result = 'should not reach'
                } catch (e) {
                    result = 'caught: ' + e.message
                }
                result
            `;
      const result = await interpreter.execute(code);
      expect(result).toBe('caught: async error');
    });

    it('should handle promise rejections', async () => {
      const code = `
                let results = []
                
                try {
                    await Promise.reject('rejected promise')
                } catch (e) {
                    results.push('caught: ' + e)
                }
                
                try {
                    await asyncThrow('async throw')
                } catch (e) {
                    results.push('caught async: ' + e.message)
                }
                
                results
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual(['caught: rejected promise', 'caught async: async throw']);
    });

    it('should handle errors in async arrow functions', async () => {
      const code = `
                let asyncArrow = async () => {
                    throw new Error('arrow async error')
                }
                
                let result
                try {
                    await asyncArrow()
                } catch (e) {
                    result = e.message
                }
                result
            `;
      const result = await interpreter.execute(code);
      expect(result).toBe('arrow async error');
    });
  });

  describe('Error in Different Contexts', () => {
    it('should handle errors in object property access chains', async () => {
      const code = `
                let obj = { 
                    a: { 
                        b: null 
                    } 
                }
                
                try {
                    let result = obj.a.b.c.d.e
                } catch (e) {
                    e.message
                }
            `;
      const result = await interpreter.execute(code);
      expect(result).toContain('Cannot read property');
    });

    it('should handle errors in array operations', async () => {
      const code = `
                let errors = []
                
                try {
                    let arr = null
                    arr.map(x => x * 2)
                } catch (e) {
                    errors.push('null array')
                }
                
                try {
                    let arr = [1, 2, 3]
                    arr.nonExistentMethod()
                } catch (e) {
                    errors.push('undefined method')
                }
                
                errors
            `;
      const result = await interpreter.execute(code);
      expect(result).toContain('null array');
    });

    it('should handle errors in constructors', async () => {
      const code = `
                class FailingConstructor {
                    constructor(shouldFail) {
                        if (shouldFail) {
                            throw new Error('Constructor failed')
                        }
                        this.value = 'success'
                    }
                }
                
                let results = []
                
                try {
                    let obj = new FailingConstructor(false)
                    results.push(obj.value)
                } catch (e) {
                    results.push('error')
                }
                
                try {
                    let obj = new FailingConstructor(true)
                    results.push('should not reach')
                } catch (e) {
                    results.push(e.message)
                }
                
                results
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual(['success', 'Constructor failed']);
    });
  });

  describe('Error Recovery and State', () => {
    it('should maintain variable state after error', async () => {
      const code = `
                let counter = 0
                let log = []
                
                for (let i = 0; i < 5; i=i+1) {
                    try {
                        counter = counter + 1
                        if (i === 2) {
                            throwError('error at 2')
                        }
                        log.push('success: ' + i)
                    } catch (e) {
                        log.push('error: ' + i)
                    }
                }
                
                return { counter, log }
            `;
      const result = await interpreter.execute(code);
      expect(result.counter).toBe(5);
      expect(result.log).toEqual([
        'success: 0',
        'success: 1',
        'error: 2',
        'success: 3',
        'success: 4',
      ]);
    });

    it('should handle errors in nested function calls', async () => {
      const code = `
                let result
                try {
                    result = safeDivide(safeDivide(10, 0), 2)
                } catch (e) {
                    result = 'caught: ' + e.message
                }
                result
            `;
      const result = await interpreter.execute(code);
      expect(result).toBe('caught: Division by zero');
    });

    it('should handle errors in destructuring', async () => {
      const code = `
                let results = []
                
                try {
                    let { a, b } = null
                } catch (e) {
                    results.push('destructure null')
                }
                
                try {
                    let [x, y] = undefined
                } catch (e) {
                    results.push('destructure undefined')
                }
                
                results
            `;
      const result = await interpreter.execute(code);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Stack Trace and Error Context', () => {
    it('should handle deep call stack errors', async () => {
      const code = `
                function level1() { level2() }
                function level2() { level3() }
                function level3() { level4() }
                function level4() { throwError('deep error') }
                
                try {
                    level1()
                } catch (e) {
                    e.message
                }
            `;
      const result = await interpreter.execute(code);
      expect(result).toBe('deep error');
    });

    it('should handle recursive function errors', async () => {
      const code = `
                function recursive(n) {
                    if (n < 0) throw new Error('negative value')
                    if (n === 0) return 'done'
                    return recursive(n - 1)
                }
                
                let results = []
                
                try {
                    results.push(recursive(3))
                } catch (e) {
                    results.push('error')
                }
                
                try {
                    results.push(recursive(-1))
                } catch (e) {
                    results.push(e.message)
                }
                
                results
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual(['done', 'negative value']);
    });
  });

  describe('Edge Cases with Control Flow', () => {
    it('should handle break/continue with try-catch in loops', async () => {
      const code = `
                let log = []
                
                for (let i = 0; i < 5; i = i + 1) {
                    try {
                        if (i === 1) continue
                        if (i === 3) break
                        if (i === 2) throw new Error('error at 2')
                        log.push(i)
                    } catch (e) {
                        log.push('caught at ' + i)
                        continue
                    }
                }
                
                log
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual([0, 'caught at 2']);
    });

    it('should handle return in try-catch within function', async () => {
      const code = `
                function test(n) {
                    try {
                        if (n < 0) throw new Error('negative')
                        if (n === 0) return 'zero'
                        return 'positive'
                    } catch (e) {
                        return 'error: ' + e.message
                    } finally {
                        // This runs but doesn't affect return
                    }
                }
                
                {
                    negative: test(-1),
                    zero: test(0),
                    positive: test(1)
                }
            `;
      const result = await interpreter.execute(code);
      expect(result).toEqual({
        negative: 'error: negative',
        zero: 'zero',
        positive: 'positive',
      });
    });
  });

  describe('Special Error Scenarios', () => {
    it('should handle custom function errors', async () => {
      const code = `
                let results = []
                
                try {
                    throwError('custom error')
                    results.push('should not reach')
                } catch (e) {
                    results.push('caught: ' + e.message)
                }
                
                results
            `;
      const result = await interpreter.execute(code);
      expect(result).toContain('caught: custom error');
    });

    it('should handle division by zero', async () => {
      const code = `
                let results = []
                
                // Regular division by zero returns Infinity
                results.push(5 / 0)
                results.push(-5 / 0)
                results.push(0 / 0) // NaN
                
                // Custom function throws error
                try {
                    safeDivide(10, 0)
                } catch (e) {
                    results.push(e.message)
                }
                
                results
            `;
      const result = await interpreter.execute(code);
      expect(result[0]).toBe(Infinity);
      expect(result[1]).toBe(-Infinity);
      expect(result[2]).toBeNaN();
      expect(result[3]).toBe('Division by zero');
    });
  });
});
