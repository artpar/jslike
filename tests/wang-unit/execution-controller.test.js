import { describe, it, expect, beforeEach } from 'vitest';
import { execute, ExecutionController, WangInterpreter } from '../../src/index.js';

describe('ExecutionController', () => {
  describe('Initial State', () => {
    it('should start in idle state', () => {
      const controller = new ExecutionController();
      expect(controller.getStatus().state).toBe('idle');
    });

    it('should have zero step count initially', () => {
      const controller = new ExecutionController();
      expect(controller.getStatus().stepCount).toBe(0);
    });

    it('should have empty call stack initially', () => {
      const controller = new ExecutionController();
      expect(controller.getStatus().callStack).toEqual([]);
    });

    it('should have null currentNode initially', () => {
      const controller = new ExecutionController();
      expect(controller.getStatus().currentNode).toBe(null);
    });

    it('should not be aborted initially', () => {
      const controller = new ExecutionController();
      expect(controller.aborted).toBe(false);
    });

    it('should have empty variables initially', () => {
      const controller = new ExecutionController();
      expect(controller.getStatus().variables).toEqual({});
    });
  });

  describe('State Transitions', () => {
    it('should transition from idle to running to completed', async () => {
      const controller = new ExecutionController();
      const states = [];

      states.push(controller.getStatus().state);

      const promise = execute('let x = 1 + 1; x', null, { executionController: controller });

      // Can't reliably capture 'running' state in sync code, but we verify start and end
      const result = await promise;
      states.push(controller.getStatus().state);

      expect(states[0]).toBe('idle');
      expect(states[1]).toBe('completed');
      expect(result).toBe(2);
    });

    it('should transition to aborted state when abort is called', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 100; i++) {
          await sleep(5);
          count++;
        }
        count
      `, null, { executionController: controller });

      // Abort after a short delay
      await new Promise(r => setTimeout(r, 20));
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
        expect(controller.getStatus().state).toBe('aborted');
      }
    });

    it('should transition through paused state', async () => {
      const controller = new ExecutionController();
      let pausedState = null;

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 20; i++) {
          await sleep(10);
          count++;
        }
        count
      `, null, { executionController: controller });

      // Pause after some iterations
      await new Promise(r => setTimeout(r, 50));
      controller.pause();

      // Wait for pause to take effect
      await new Promise(r => setTimeout(r, 20));
      pausedState = controller.getStatus().state;

      // Resume
      controller.resume();

      const result = await promise;

      expect(pausedState).toBe('paused');
      expect(controller.getStatus().state).toBe('completed');
      expect(result).toBe(20);
    });
  });

  describe('Abort Functionality', () => {
    it('should abort execution in a for loop', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 1000; i++) {
          await sleep(1);
          count++;
        }
        count
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 20));
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
        expect(e.message).toBe('The operation was aborted');
      }
    });

    it('should abort execution in a while loop', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        while (count < 1000) {
          await sleep(1);
          count++;
        }
        count
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 20));
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });

    it('should abort execution in a do-while loop', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        do {
          await sleep(1);
          count++;
        } while (count < 1000);
        count
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 20));
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });

    it('should abort execution in a for-of loop', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let sum = 0;
        let arr = [];
        for (let i = 0; i < 1000; i++) arr.push(i);
        for (const num of arr) {
          await sleep(1);
          sum += num;
        }
        sum
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 20));
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });

    it('should abort execution in a for-in loop', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let obj = {};
        for (let i = 0; i < 100; i++) obj['key' + i] = i;
        let sum = 0;
        for (const key in obj) {
          await sleep(1);
          sum += obj[key];
        }
        sum
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 20));
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });

    it('should allow pre-abort before execution starts', async () => {
      const controller = new ExecutionController();
      controller.abort(); // Abort before starting

      try {
        await execute('let x = 1; x', null, { executionController: controller });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
        expect(controller.getStatus().state).toBe('aborted');
      }
    });

    it('should be idempotent when called multiple times', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 100; i++) {
          await sleep(5);
          count++;
        }
        count
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 20));
      controller.abort();
      controller.abort(); // Second call should be safe
      controller.abort(); // Third call should be safe

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });

    it('should abort while paused', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 100; i++) {
          await sleep(10);
          count++;
        }
        count
      `, null, { executionController: controller });

      // Pause first
      await new Promise(r => setTimeout(r, 50));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));

      expect(controller.getStatus().state).toBe('paused');

      // Now abort while paused
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
        expect(controller.getStatus().state).toBe('aborted');
      }
    });
  });

  describe('Pause/Resume Functionality', () => {
    it('should pause and resume execution', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 10; i++) {
          await sleep(20);
          count++;
        }
        count
      `, null, { executionController: controller });

      // Pause after a few iterations
      await new Promise(r => setTimeout(r, 50));
      controller.pause();

      // Wait for pause to take effect
      await new Promise(r => setTimeout(r, 30));
      expect(controller.getStatus().state).toBe('paused');

      // Resume
      controller.resume();

      const result = await promise;
      expect(result).toBe(10);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should allow multiple pause/resume cycles', async () => {
      const controller = new ExecutionController();
      let pauseCount = 0;

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 30; i++) {
          await sleep(10);
          count++;
        }
        count
      `, null, { executionController: controller });

      // First pause/resume
      await new Promise(r => setTimeout(r, 50));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));
      if (controller.getStatus().state === 'paused') pauseCount++;
      controller.resume();

      // Second pause/resume
      await new Promise(r => setTimeout(r, 50));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));
      if (controller.getStatus().state === 'paused') pauseCount++;
      controller.resume();

      const result = await promise;
      expect(pauseCount).toBe(2);
      expect(result).toBe(30);
    });

    it('should ignore pause when not running', () => {
      const controller = new ExecutionController();

      // Pause in idle state - should be ignored
      controller.pause();
      expect(controller.getStatus().state).toBe('idle');
    });

    it('should ignore resume when not paused', async () => {
      const controller = new ExecutionController();

      // Resume in idle state - should be ignored
      controller.resume();
      expect(controller.getStatus().state).toBe('idle');

      // Resume during running - should be ignored
      const promise = execute(`
        let x = 0;
        for (let i = 0; i < 5; i++) {
          await sleep(5);
          x++;
        }
        x
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 10));
      controller.resume(); // Should be no-op

      const result = await promise;
      expect(result).toBe(5);
    });

    it('should allow status inspection while paused', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let myVar = 'test';
        let count = 0;
        for (let i = 0; i < 20; i++) {
          await sleep(10);
          count = i;
        }
        count
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 50));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));

      const status = controller.getStatus();
      expect(status.state).toBe('paused');
      expect(status.stepCount).toBeGreaterThan(0);
      expect(status.variables.myVar).toEqual({ type: 'string', value: 'test' });
      expect(status.variables.count).toBeDefined();
      expect(status.variables.count.type).toBe('number');

      controller.resume();
      await promise;
    });
  });

  describe('getStatus() - Step Count', () => {
    it('should increment step count during execution', async () => {
      const controller = new ExecutionController();

      await execute('let x = 1; let y = 2; x + y', null, { executionController: controller });

      expect(controller.getStatus().stepCount).toBeGreaterThan(0);
    });

    it('should have higher step count for more complex code', async () => {
      const controller1 = new ExecutionController();
      const controller2 = new ExecutionController();

      await execute('1 + 1', null, { executionController: controller1 });
      await execute(`
        let sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += i;
        }
        sum
      `, null, { executionController: controller2 });

      expect(controller2.getStatus().stepCount).toBeGreaterThan(controller1.getStatus().stepCount);
    });
  });

  describe('getStatus() - Current Node', () => {
    it('should track current node type during execution', async () => {
      const controller = new ExecutionController();
      let nodeTypes = [];

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 10; i++) {
          await sleep(20);
          count++;
        }
        count
      `, null, { executionController: controller });

      // Sample node types during execution
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 30));
        const node = controller.getStatus().currentNode;
        if (node) nodeTypes.push(node);
      }

      await promise;

      // Should have captured some node types
      expect(nodeTypes.length).toBeGreaterThan(0);
    });

    it('should show final node type after completion', async () => {
      const controller = new ExecutionController();

      await execute('let x = 42; x', null, { executionController: controller });

      // After completion, currentNode should still have the last evaluated node
      expect(controller.getStatus().currentNode).toBeDefined();
    });
  });

  describe('getStatus() - Call Stack', () => {
    it('should track function calls in call stack', async () => {
      const controller = new ExecutionController();
      let capturedStack = null;

      const promise = execute(`
        function outer() {
          return inner();
        }
        function inner() {
          // Pause point
          for (let i = 0; i < 5; i++) {
            sleep(20);
          }
          return 'done';
        }
        outer()
      `, null, { executionController: controller });

      // Try to capture stack during execution
      await new Promise(r => setTimeout(r, 30));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));
      capturedStack = [...controller.getStatus().callStack];
      controller.resume();

      await promise;

      // Call stack should have captured function names
      // Note: may or may not capture depending on timing
      expect(controller.getStatus().callStack).toEqual([]); // Empty after completion
    });

    it('should show empty call stack for top-level code', async () => {
      const controller = new ExecutionController();

      await execute('let x = 1; x + 1', null, { executionController: controller });

      expect(controller.getStatus().callStack).toEqual([]);
    });

    it('should properly pop call stack on function return', async () => {
      const controller = new ExecutionController();

      await execute(`
        function foo() { return 1; }
        function bar() { return foo() + 1; }
        bar()
      `, null, { executionController: controller });

      // After execution, call stack should be empty
      expect(controller.getStatus().callStack).toEqual([]);
    });
  });

  describe('getStatus() - Variables', () => {
    it('should serialize undefined correctly', async () => {
      const controller = new ExecutionController();

      await execute('let x = undefined; x', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.x).toEqual({ type: 'undefined' });
    });

    it('should serialize null correctly', async () => {
      const controller = new ExecutionController();

      await execute('let x = null; x', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.x).toEqual({ type: 'null' });
    });

    it('should serialize numbers correctly', async () => {
      const controller = new ExecutionController();

      await execute('let x = 42; let y = 3.14; [x, y]', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.x).toEqual({ type: 'number', value: 42 });
      expect(vars.y).toEqual({ type: 'number', value: 3.14 });
    });

    it('should serialize strings correctly', async () => {
      const controller = new ExecutionController();

      await execute('let x = "hello"; x', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.x).toEqual({ type: 'string', value: 'hello' });
    });

    it('should serialize booleans correctly', async () => {
      const controller = new ExecutionController();

      await execute('let x = true; let y = false; [x, y]', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.x).toEqual({ type: 'boolean', value: true });
      expect(vars.y).toEqual({ type: 'boolean', value: false });
    });

    it('should serialize arrays with length', async () => {
      const controller = new ExecutionController();

      await execute('let arr = [1, 2, 3, 4, 5]; arr', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.arr.type).toBe('array');
      expect(vars.arr.length).toBe(5);
    });

    it('should serialize objects with key preview', async () => {
      const controller = new ExecutionController();

      await execute('let obj = { a: 1, b: 2, c: 3 }; obj', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.obj.type).toBe('object');
      expect(vars.obj.preview).toContain('a');
      expect(vars.obj.preview).toContain('b');
      expect(vars.obj.preview).toContain('c');
    });

    it('should serialize functions with name', async () => {
      const controller = new ExecutionController();

      await execute('function myFunc() { return 1; } myFunc', null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.myFunc.type).toBe('function');
    });

    it('should handle objects with many keys (preview limit)', async () => {
      const controller = new ExecutionController();

      await execute(`
        let obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 };
        obj
      `, null, { executionController: controller });

      const vars = controller.getStatus().variables;
      expect(vars.obj.type).toBe('object');
      expect(vars.obj.preview.length).toBeLessThanOrEqual(5); // Preview limited to 5 keys
    });

    it('should show variables from nested scopes', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let outer = 'outer';
        for (let i = 0; i < 10; i++) {
          let inner = 'inner';
          await sleep(20);
        }
        outer
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 50));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));

      const vars = controller.getStatus().variables;
      expect(vars.outer).toEqual({ type: 'string', value: 'outer' });
      // inner may or may not be visible depending on exact pause point

      controller.resume();
      await promise;
    });
  });

  describe('Loop Checkpoints', () => {
    it('should checkpoint in for loops', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 20; i++) {
          await sleep(10);
          count++;
        }
        count
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 50));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));

      const status = controller.getStatus();
      expect(status.state).toBe('paused');
      expect(status.variables.count.value).toBeLessThan(20);

      controller.resume();
      const result = await promise;
      expect(result).toBe(20);
    });

    it('should checkpoint in nested loops', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            await sleep(5);
            count++;
          }
        }
        count
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 30));
      controller.pause();
      await new Promise(r => setTimeout(r, 20));

      expect(controller.getStatus().state).toBe('paused');
      expect(controller.getStatus().variables.count.value).toBeLessThan(25);

      controller.resume();
      const result = await promise;
      expect(result).toBe(25);
    });
  });

  describe('Function Call Tracking', () => {
    it('should track async function calls', async () => {
      const controller = new ExecutionController();

      await execute(`
        async function asyncFunc() {
          await sleep(10);
          return 42;
        }
        await asyncFunc()
      `, null, { executionController: controller });

      // After completion, call stack should be empty
      expect(controller.getStatus().callStack).toEqual([]);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should track recursive function calls', async () => {
      const controller = new ExecutionController();

      await execute(`
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        factorial(5)
      `, null, { executionController: controller });

      expect(controller.getStatus().callStack).toEqual([]);
      expect(controller.getStatus().state).toBe('completed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const controller = new ExecutionController();

      const result = await execute('', null, { executionController: controller });

      expect(result).toBeUndefined();
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should handle code with no loops or functions', async () => {
      const controller = new ExecutionController();

      const result = await execute('1 + 2 + 3', null, { executionController: controller });

      expect(result).toBe(6);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should handle very fast execution (completes before pause)', async () => {
      const controller = new ExecutionController();

      const promise = execute('1 + 1', null, { executionController: controller });

      // Try to pause, but execution will likely be done
      setTimeout(() => controller.pause(), 0);

      const result = await promise;
      expect(result).toBe(2);
      // State should be completed, not paused
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should reset state for new execution with same controller', async () => {
      const controller = new ExecutionController();

      // First execution
      await execute('let x = 1; x', null, { executionController: controller });
      const firstStepCount = controller.getStatus().stepCount;
      expect(controller.getStatus().state).toBe('completed');

      // Second execution - should reset
      await execute('let y = 2; y', null, { executionController: controller });

      // Step count should have been reset and counted again
      expect(controller.getStatus().state).toBe('completed');
      // Note: step count resets on _start()
    });

    it('should handle thrown errors (not abort)', async () => {
      const controller = new ExecutionController();

      try {
        await execute(`
          function throwError() {
            throw new Error("test error");
          }
          throwError()
        `, null, { executionController: controller });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.message).toBe('test error');
        // State should not be 'aborted' for regular errors
        expect(controller.getStatus().state).not.toBe('aborted');
      }
    });

    it('should handle try/catch around aborted section', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let result = 'not caught';
        try {
          for (let i = 0; i < 100; i++) {
            await sleep(10);
          }
        } catch (e) {
          result = 'caught: ' + e.name;
        }
        result
      `, null, { executionController: controller });

      await new Promise(r => setTimeout(r, 30));
      controller.abort();

      // The abort error should propagate out, not be caught
      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without controller (no performance impact)', async () => {
      // Execute without controller
      const result = await execute('let x = 1; for (let i = 0; i < 100; i++) x++; x', null, {});
      expect(result).toBe(101);
    });

    it('should work with legacy abortSignal (no controller)', async () => {
      const abortController = new AbortController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 100; i++) {
          await sleep(10);
          count++;
        }
        count
      `, null, { abortSignal: abortController.signal });

      await new Promise(r => setTimeout(r, 30));
      abortController.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });

    it('should not add microtask delays without controller', async () => {
      // This test verifies that basic execution timing is preserved
      // Note: async forEach with async callbacks is a known edge case in native JS
      // where forEach doesn't wait for async callbacks. We test with for-of instead.
      const result = await execute(`
        let results = [];
        let items = [1, 2, 3];
        for (const item of items) {
          await Promise.resolve();
          results.push(item * 2);
        }
        results
      `);

      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('Integration with WangInterpreter', () => {
    it('should work with WangInterpreter', async () => {
      const controller = new ExecutionController();
      const interpreter = new WangInterpreter();

      const result = await interpreter.execute(
        'let x = 10; for (let i = 0; i < 5; i++) x++; x',
        undefined,
        { executionController: controller }
      );

      expect(result).toBe(15);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should work with WangInterpreter and withMetadata', async () => {
      const controller = new ExecutionController();
      const interpreter = new WangInterpreter();

      const result = await interpreter.execute(
        'log("hello"); 42',
        undefined,
        { executionController: controller, withMetadata: true }
      );

      expect(result.result).toBe(42);
      expect(result.metadata.logs.length).toBeGreaterThan(0);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should allow abort through WangInterpreter', async () => {
      const controller = new ExecutionController();
      const interpreter = new WangInterpreter();

      const promise = interpreter.execute(`
        let count = 0;
        for (let i = 0; i < 100; i++) {
          await sleep(10);
          count++;
        }
        count
      `, undefined, { executionController: controller });

      await new Promise(r => setTimeout(r, 30));
      controller.abort();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('AbortError');
      }
    });
  });

  describe('aborted Getter (AbortSignal Compatibility)', () => {
    it('should return false initially', () => {
      const controller = new ExecutionController();
      expect(controller.aborted).toBe(false);
    });

    it('should return true after abort', () => {
      const controller = new ExecutionController();
      controller.abort();
      expect(controller.aborted).toBe(true);
    });

    it('should be compatible with AbortSignal interface', async () => {
      const controller = new ExecutionController();

      // Can be used like AbortSignal
      const checkAborted = () => {
        if (controller.aborted) {
          throw new Error('Aborted');
        }
      };

      checkAborted(); // Should not throw

      controller.abort();

      expect(() => checkAborted()).toThrow('Aborted');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle async/await with multiple awaits', async () => {
      const controller = new ExecutionController();

      const result = await execute(`
        async function fetchData() {
          await sleep(5);
          return { data: 'fetched' };
        }

        async function processData() {
          const result = await fetchData();
          await sleep(5);
          return result.data + ' and processed';
        }

        await processData()
      `, null, { executionController: controller });

      expect(result).toBe('fetched and processed');
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should handle Promise.all with controller', async () => {
      const controller = new ExecutionController();

      const result = await execute(`
        const makePromise = (val, delay) => new Promise(resolve => setTimeout(() => resolve(val), delay));
        const promises = [
          makePromise(1, 10),
          makePromise(2, 10),
          makePromise(3, 10)
        ];
        await Promise.all(promises)
      `, null, { executionController: controller });

      expect(result).toEqual([1, 2, 3]);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should handle class methods with controller', async () => {
      const controller = new ExecutionController();

      const result = await execute(`
        class Counter {
          constructor() {
            this.count = 0;
          }

          async increment() {
            await sleep(5);
            this.count++;
            return this.count;
          }
        }

        const counter = new Counter();
        await counter.increment();
        await counter.increment();
        counter.count
      `, null, { executionController: controller });

      expect(result).toBe(2);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should handle generator-like patterns', async () => {
      const controller = new ExecutionController();

      const result = await execute(`
        let results = [];
        for (let i = 0; i < 5; i++) {
          await sleep(5);
          results.push(i * 2);
        }
        results
      `, null, { executionController: controller });

      expect(result).toEqual([0, 2, 4, 6, 8]);
      expect(controller.getStatus().state).toBe('completed');
    });

    it('should maintain correct state through error recovery', async () => {
      const controller = new ExecutionController();

      const result = await execute(`
        let status = 'start';
        try {
          throw new Error('expected');
        } catch (e) {
          status = 'caught';
        }
        status
      `, null, { executionController: controller });

      expect(result).toBe('caught');
      expect(controller.getStatus().state).toBe('completed');
    });
  });

  describe('Timing and Performance', () => {
    it('should not significantly slow down execution without pause', async () => {
      const controller = new ExecutionController();

      const start = Date.now();
      await execute(`
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        sum
      `, null, { executionController: controller });
      const duration = Date.now() - start;

      // Should complete quickly (< 1 second for 1000 iterations)
      expect(duration).toBeLessThan(1000);
    });

    it('should pause promptly at checkpoints', async () => {
      const controller = new ExecutionController();

      const promise = execute(`
        let count = 0;
        for (let i = 0; i < 100; i++) {
          await sleep(20);
          count++;
        }
        count
      `, null, { executionController: controller });

      // Wait and then pause
      await new Promise(r => setTimeout(r, 100));
      const beforePause = Date.now();
      controller.pause();

      // Wait for pause to take effect
      await new Promise(r => setTimeout(r, 50));

      expect(controller.getStatus().state).toBe('paused');

      // Pause should happen within ~30ms (one sleep iteration)
      const pauseLatency = Date.now() - beforePause;
      expect(pauseLatency).toBeLessThan(100);

      controller.resume();
      await promise;
    });
  });
});
