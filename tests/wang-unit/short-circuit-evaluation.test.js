import { describe, it, test, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Short-circuit evaluation', () => {
  let interpreter;
  let sideEffectCalls;

  beforeEach(() => {
    interpreter = new WangInterpreter({
      moduleResolver: new InMemoryModuleResolver(),
      functions: {
        // Function to track when right side is evaluated
        shouldNotBeCalled: () => {
          sideEffectCalls.push('shouldNotBeCalled');
          return 'SIDE_EFFECT';
        },
        // Function for truthy left side test
        getTruthy: () => {
          sideEffectCalls.push('getTruthy');
          return 'truthy-value';
        },
        // Function for falsy left side test
        getFalsy: () => {
          sideEffectCalls.push('getFalsy');
          return null;
        },
        // Function for right side when it should be called
        getRightSide: () => {
          sideEffectCalls.push('getRightSide');
          return 'right-side-value';
        }
      }
    });
    sideEffectCalls = [];
  });

  describe('Logical OR (||) operator', () => {
    test('should NOT evaluate right side when left side is truthy', async () => {
      const code = `
        let result = getTruthy() || shouldNotBeCalled();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe('truthy-value');
      expect(sideEffectCalls).toEqual(['getTruthy']);
      expect(sideEffectCalls).not.toContain('shouldNotBeCalled');
    });

    test('should evaluate right side when left side is falsy', async () => {
      const code = `
        let result = getFalsy() || getRightSide();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe('right-side-value');
      expect(sideEffectCalls).toEqual(['getFalsy', 'getRightSide']);
    });

    test('should work with literal truthy values', async () => {
      const code = `
        let result = 42 || shouldNotBeCalled();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe(42);
      expect(sideEffectCalls).toEqual([]);
      expect(sideEffectCalls).not.toContain('shouldNotBeCalled');
    });

    test('should work with literal falsy values', async () => {
      const code = `
        let result = 0 || getRightSide();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe('right-side-value');
      expect(sideEffectCalls).toEqual(['getRightSide']);
    });
  });

  describe('Logical AND (&&) operator', () => {
    test('should NOT evaluate right side when left side is falsy', async () => {
      const code = `
        let result = getFalsy() && shouldNotBeCalled();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe(null);
      expect(sideEffectCalls).toEqual(['getFalsy']);
      expect(sideEffectCalls).not.toContain('shouldNotBeCalled');
    });

    test('should evaluate right side when left side is truthy', async () => {
      const code = `
        let result = getTruthy() && getRightSide();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe('right-side-value');
      expect(sideEffectCalls).toEqual(['getTruthy', 'getRightSide']);
    });

    test('should work with literal falsy values', async () => {
      const code = `
        let result = false && shouldNotBeCalled();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe(false);
      expect(sideEffectCalls).toEqual([]);
      expect(sideEffectCalls).not.toContain('shouldNotBeCalled');
    });

    test('should work with literal truthy values', async () => {
      const code = `
        let result = "hello" && getRightSide();
        result;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe('right-side-value');
      expect(sideEffectCalls).toEqual(['getRightSide']);
    });
  });

  describe('Real-world example from user', () => {
    test('should not call tab_getActive when tabId is truthy', async () => {
      interpreter = new WangInterpreter({
        moduleResolver: new InMemoryModuleResolver(),
        functions: {
          tab_getActive: async () => {
            sideEffectCalls.push('tab_getActive_called');
            return { data: { id: 999 } };
          }
        }
      });

      const code = `
        let __inputs = {tabId: 1387604004};
        // Get the target tab ID
        let tabId = __inputs.tabId || (await tab_getActive()).data?.id;
        tabId;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe(1387604004);
      expect(sideEffectCalls).toEqual([]);
      expect(sideEffectCalls).not.toContain('tab_getActive_called');
    });

    test('should call tab_getActive when tabId is falsy', async () => {
      interpreter = new WangInterpreter({
        moduleResolver: new InMemoryModuleResolver(),
        functions: {
          tab_getActive: async () => {
            sideEffectCalls.push('tab_getActive_called');
            return { data: { id: 999 } };
          }
        }
      });

      const code = `
        let __inputs = {tabId: null};
        // Get the target tab ID
        let tabId = __inputs.tabId || (await tab_getActive()).data?.id;
        tabId;
      `;
      
      const result = await interpreter.execute(code);
      
      expect(result).toBe(999);
      expect(sideEffectCalls).toEqual(['tab_getActive_called']);
    });
  });
});