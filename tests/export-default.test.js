import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

/**
 * Tests for export default returning the exported value from execute()
 *
 * Issue: Code ending with `export default Component;` was returning undefined
 * because export statements don't return values in JS semantics.
 *
 * Fix: execute() now checks interpreter.moduleExports.default when result is undefined
 */

describe('Export Default Return Value', () => {

  describe('Basic Export Default', () => {
    it('returns function from export default reference', async () => {
      const result = await execute(`
        function MyComponent() {
          return { type: 'div', props: {} };
        }
        export default MyComponent;
      `);

      expect(typeof result).toBe('function');
      expect(result()).toEqual({ type: 'div', props: {} });
    });

    it('returns inline function from export default', async () => {
      const result = await execute(`
        export default function Calculator() {
          return { add: (a, b) => a + b };
        }
      `);

      expect(typeof result).toBe('function');
      // Verify the function works correctly
      const instance = result();
      expect(instance.add(2, 3)).toBe(5);
    });

    it('returns anonymous arrow function from export default', async () => {
      // Note: `export default function() {}` is handled differently by JSLike
      // Using arrow function for anonymous function test
      const result = await execute(`
        export default (() => 42);
      `);

      expect(typeof result).toBe('function');
      expect(result()).toBe(42);
    });

    it('returns arrow function from export default', async () => {
      const result = await execute(`
        export default () => 'hello';
      `);

      expect(typeof result).toBe('function');
      expect(result()).toBe('hello');
    });

    it('returns class from export default', async () => {
      const result = await execute(`
        export default class Counter {
          constructor() {
            this.count = 0;
          }
          increment() {
            this.count++;
          }
        }
      `);

      expect(typeof result).toBe('function');
      const instance = new result();
      expect(instance.count).toBe(0);
      instance.increment();
      expect(instance.count).toBe(1);
    });

    it('returns object from export default', async () => {
      const result = await execute(`
        export default { name: 'test', version: '1.0.0' };
      `);

      expect(result).toEqual({ name: 'test', version: '1.0.0' });
    });

    it('returns array from export default', async () => {
      const result = await execute(`
        export default [1, 2, 3];
      `);

      expect(result).toEqual([1, 2, 3]);
    });

    it('returns primitive string from export default', async () => {
      const result = await execute(`
        export default 'hello world';
      `);

      expect(result).toBe('hello world');
    });

    it('returns primitive number from export default', async () => {
      const result = await execute(`
        export default 42;
      `);

      expect(result).toBe(42);
    });
  });

  describe('Falsy Export Values', () => {
    it('returns null from export default', async () => {
      const result = await execute(`
        export default null;
      `);

      expect(result).toBe(null);
    });

    it('returns 0 from export default', async () => {
      const result = await execute(`
        export default 0;
      `);

      expect(result).toBe(0);
    });

    it('returns false from export default', async () => {
      const result = await execute(`
        export default false;
      `);

      expect(result).toBe(false);
    });

    it('returns empty string from export default', async () => {
      const result = await execute(`
        export default '';
      `);

      expect(result).toBe('');
    });
  });

  describe('Export Default with Other Code', () => {
    it('returns default export even when followed by other statements', async () => {
      const result = await execute(`
        function MyComponent() {
          return 'component';
        }
        export default MyComponent;
        const unused = 'ignored';
      `);

      expect(typeof result).toBe('function');
      expect(result()).toBe('component');
    });

    it('returns default export when preceded by other exports', async () => {
      const result = await execute(`
        export const helper = () => 'helper';
        export function utility() { return 'utility'; }

        function MainComponent() {
          return 'main';
        }
        export default MainComponent;
      `);

      expect(typeof result).toBe('function');
      expect(result()).toBe('main');
    });
  });

  describe('Backward Compatibility', () => {
    it('returns last expression value for non-module code', async () => {
      const result = await execute(`
        const x = 1;
        const y = 2;
        x + y
      `);

      expect(result).toBe(3);
    });

    it('returns undefined for named exports only (no default)', async () => {
      const result = await execute(`
        export const foo = 1;
        export function bar() { return 2; }
      `);

      expect(result).toBe(undefined);
    });

    it('returns explicit expression after export default', async () => {
      const result = await execute(`
        function MyComponent() { return 'component'; }
        export default MyComponent;
        42
      `);

      // When there's an expression after export default, that expression is returned
      expect(result).toBe(42);
    });
  });

  describe('React Component Pattern', () => {
    it('returns component function for typical React pattern', async () => {
      const mockReact = {
        default: {}, // Need default export for `import React from 'react'`
        createElement: (type, props, ...children) => ({
          $$typeof: Symbol.for('react.element'),
          type,
          props: { ...props, children }
        })
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'react') {
            return { exports: mockReact };
          }
          return null;
        }
      };

      const env = createEnvironment();
      env.define('React', mockReact);

      const result = await execute(`
        import React from 'react';

        function Dashboard() {
          return <div className="dashboard">Hello</div>;
        }

        export default Dashboard;
      `, env, { moduleResolver });

      expect(typeof result).toBe('function');

      // Calling the component should return JSX element
      const element = result();
      expect(element.type).toBe('div');
      expect(element.props.className).toBe('dashboard');
    });

    it('returns component with hooks', async () => {
      const mockReact = {
        useState: (initial) => [initial, () => {}],
        useEffect: () => {},
        createElement: (type, props, ...children) => ({
          type,
          props: { ...props, children }
        })
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'react') {
            return { exports: mockReact };
          }
          return null;
        }
      };

      const env = createEnvironment();
      env.define('React', mockReact);

      const result = await execute(`
        import { useState, useEffect } from 'react';

        function Counter() {
          const [count, setCount] = useState(0);
          useEffect(() => {
            console.log('mounted');
          }, []);
          return <button onClick={() => setCount(count + 1)}>{count}</button>;
        }

        export default Counter;
      `, env, { moduleResolver });

      expect(typeof result).toBe('function');
      // Verify function works
      const element = result();
      expect(element.type).toBe('button');
    });
  });

  describe('Edge Cases', () => {
    it('handles export default with computed value', async () => {
      const result = await execute(`
        const base = 10;
        export default base * 2 + 5;
      `);

      expect(result).toBe(25);
    });

    it('handles export default with IIFE', async () => {
      const result = await execute(`
        export default (() => {
          const privateValue = 42;
          return { getValue: () => privateValue };
        })();
      `);

      expect(result.getValue()).toBe(42);
    });

    it('handles export default with ternary', async () => {
      const result = await execute(`
        const isProduction = false;
        export default isProduction ? 'prod' : 'dev';
      `);

      expect(result).toBe('dev');
    });

    it('handles re-exporting an imported default', async () => {
      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === './utils') {
            return {
              code: `
                export default function utils() { return 'utils'; }
              `
            };
          }
          return null;
        }
      };

      const result = await execute(`
        import Utils from './utils';
        export default Utils;
      `, null, { moduleResolver });

      expect(typeof result).toBe('function');
      expect(result()).toBe('utils');
    });
  });
});
