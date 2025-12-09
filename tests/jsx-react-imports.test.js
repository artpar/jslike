import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

/**
 * Tests for importing native JS modules (like React) via moduleResolver
 */

describe('Native Module Imports', () => {

  describe('Basic Native Module Support', () => {
    it('imports named exports from native module', async () => {
      // Mock React-like module
      const mockReact = {
        createElement: (type, props, ...children) => ({ type, props, children }),
        useState: (initial) => [initial, () => {}],
        useEffect: () => {},
        Fragment: Symbol.for('react.fragment')
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'react') {
            return { exports: mockReact };
          }
          return null;
        }
      };

      const result = await execute(`
        import { createElement, Fragment } from 'react';
        createElement('div', { className: 'test' }, 'Hello')
      `, null, { moduleResolver });

      expect(result.type).toBe('div');
      expect(result.props.className).toBe('test');
      expect(result.children[0]).toBe('Hello');
    });

    it('imports default export from native module', async () => {
      const mockModule = {
        default: { version: '1.0.0', name: 'test-lib' },
        helper: () => 'helped'
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'test-lib') {
            return { exports: mockModule };
          }
          return null;
        }
      };

      const result = await execute(`
        import TestLib from 'test-lib';
        TestLib.version + '-' + TestLib.name
      `, null, { moduleResolver });

      expect(result).toBe('1.0.0-test-lib');
    });

    it('imports namespace from native module', async () => {
      const mockModule = {
        foo: 1,
        bar: 2,
        baz: () => 3
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'utils') {
            return { exports: mockModule };
          }
          return null;
        }
      };

      const result = await execute(`
        import * as Utils from 'utils';
        Utils.foo + Utils.bar + Utils.baz()
      `, null, { moduleResolver });

      expect(result).toBe(6);
    });
  });

  describe('React-like Integration', () => {
    it('uses imported createElement for JSX', async () => {
      const elements = [];
      const mockReact = {
        createElement: (type, props, ...children) => {
          const el = {
            $$typeof: Symbol.for('react.element'),
            type,
            props: { ...props, children: children.length === 1 ? children[0] : children },
            key: props?.key ?? null
          };
          elements.push(el);
          return el;
        },
        Fragment: Symbol.for('react.fragment')
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'react') {
            return { exports: mockReact };
          }
          return null;
        }
      };

      // Define React in environment so JSX can find it
      const env = createEnvironment();
      env.define('React', mockReact);

      const result = await execute(`
        import { createElement } from 'react';
        <div className="container">
          <span>Hello</span>
          <span>World</span>
        </div>
      `, env, { moduleResolver });

      expect(result.type).toBe('div');
      expect(result.props.className).toBe('container');
      expect(result.props.children.length).toBe(2);
    });

    it('imports useState-like hook', async () => {
      let stateValue = 0;
      const mockReact = {
        useState: (initial) => {
          stateValue = initial;
          return [initial, (newVal) => { stateValue = newVal; }];
        },
        createElement: (type, props, ...children) => ({
          $$typeof: Symbol.for('react.element'),
          type,
          props: { ...props, children: children.length === 1 ? children[0] : children }
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
        import { useState } from 'react';

        function Counter() {
          const [count, setCount] = useState(42);
          return <div>Count: {count}</div>;
        }

        Counter()
      `, env, { moduleResolver });

      expect(stateValue).toBe(42);
      expect(result.type).toBe('div');
    });

    it('imports multiple hooks', async () => {
      const calls = [];
      const mockReact = {
        useState: (initial) => {
          calls.push(['useState', initial]);
          return [initial, () => {}];
        },
        useEffect: (fn, deps) => {
          calls.push(['useEffect', deps]);
        },
        useMemo: (fn, deps) => {
          calls.push(['useMemo', deps]);
          return fn();
        },
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

      await execute(`
        import { useState, useEffect, useMemo } from 'react';

        function App() {
          const [value, setValue] = useState(10);
          useEffect(() => {}, [value]);
          const doubled = useMemo(() => value * 2, [value]);
          return <div>{doubled}</div>;
        }

        App()
      `, env, { moduleResolver });

      expect(calls).toContainEqual(['useState', 10]);
      expect(calls).toContainEqual(['useEffect', [10]]);
      expect(calls).toContainEqual(['useMemo', [10]]);
    });
  });

  describe('Mixed Code and Native Modules', () => {
    it('imports from both native and code modules', async () => {
      const mockLodash = {
        capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'lodash') {
            return { exports: mockLodash };
          }
          if (modulePath === './utils') {
            return {
              code: `
                export function double(x) { return x * 2; }
                export const PI = 3.14159;
              `
            };
          }
          return null;
        }
      };

      const result = await execute(`
        import { capitalize } from 'lodash';
        import { double, PI } from './utils';

        capitalize("hello") + " - " + double(PI).toFixed(2)
      `, null, { moduleResolver });

      expect(result).toBe('Hello - 6.28');
    });
  });

  describe('Module Caching', () => {
    it('caches native modules', async () => {
      let resolveCount = 0;
      const mockModule = {
        getValue: () => 42
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'cached-module') {
            resolveCount++;
            return { exports: mockModule };
          }
          return null;
        }
      };

      const result = await execute(`
        import { getValue } from 'cached-module';
        import { getValue as getValue2 } from 'cached-module';
        getValue() + getValue2()
      `, null, { moduleResolver });

      expect(result).toBe(84);
      expect(resolveCount).toBe(1); // Should only resolve once
    });
  });

  describe('Error Handling', () => {
    it('throws on missing named export', async () => {
      const mockModule = {
        foo: 1
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'test') {
            return { exports: mockModule };
          }
          return null;
        }
      };

      await expect(execute(`
        import { bar } from 'test';
        bar
      `, null, { moduleResolver })).rejects.toThrow("has no export 'bar'");
    });

    it('throws on missing default export', async () => {
      const mockModule = {
        foo: 1
      };

      const moduleResolver = {
        async resolve(modulePath) {
          if (modulePath === 'test') {
            return { exports: mockModule };
          }
          return null;
        }
      };

      await expect(execute(`
        import Foo from 'test';
        Foo
      `, null, { moduleResolver })).rejects.toThrow('has no default export');
    });

    it('throws on unresolved module', async () => {
      const moduleResolver = {
        async resolve(modulePath) {
          return null;
        }
      };

      await expect(execute(`
        import { foo } from 'nonexistent';
        foo
      `, null, { moduleResolver })).rejects.toThrow("Cannot find module 'nonexistent'");
    });
  });
});
