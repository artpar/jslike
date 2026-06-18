import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

describe('Dynamic import expressions', () => {
  it('resolves a literal specifier through the module resolver', async () => {
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        if (modulePath === './dep.js') {
          return {
            path: '/virtual/project/dep.js',
            code: 'export const value = 42;'
          };
        }
        return null;
      }
    };

    const result = await execute(
      'const m = await import("./dep.js"); m.value',
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toBe(42);
    expect(calls).toEqual([
      { modulePath: './dep.js', fromPath: '/virtual/project/main.js' }
    ]);
  });

  it('evaluates computed specifiers before resolving', async () => {
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        if (modulePath === './dep.js') {
          return {
            path: '/virtual/project/dep.js',
            code: 'export const value = "computed";'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        const name = "dep";
        const m = await import("./" + name + ".js");
        m.value
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toBe('computed');
    expect(calls).toEqual([
      { modulePath: './dep.js', fromPath: '/virtual/project/main.js' }
    ]);
  });

  it('works inside interpreted async functions', async () => {
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        if (modulePath === './dep.js') {
          return {
            path: '/virtual/project/dep.js',
            code: 'export const value = 7;'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        async function loadValue() {
          const m = await import("./dep.js");
          return m.value;
        }
        await loadValue()
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toBe(7);
    expect(calls).toEqual([
      { modulePath: './dep.js', fromPath: '/virtual/project/main.js' }
    ]);
  });

  it('uses the importing module path for nested dynamic imports', async () => {
    const calls = [];
    const modules = {
      '/virtual/project/main.js::./dep.js': {
        path: '/virtual/project/lib/dep.js',
        code: `
          export async function loadNested() {
            const nested = await import("./nested.js");
            return nested.value;
          }
        `
      },
      '/virtual/project/lib/dep.js::./nested.js': {
        path: '/virtual/project/lib/nested.js',
        code: 'export const value = 11;'
      }
    };
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        return modules[`${fromPath}::${modulePath}`] ?? null;
      }
    };

    const result = await execute(
      `
        const dep = await import("./dep.js");
        await dep.loadNested()
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toBe(11);
    expect(calls).toEqual([
      { modulePath: './dep.js', fromPath: '/virtual/project/main.js' },
      { modulePath: './nested.js', fromPath: '/virtual/project/lib/dep.js' }
    ]);
  });

  it('returns native module exports from dynamic imports', async () => {
    const nativeModule = {
      default: { name: 'native-lib' },
      value: 13,
      getValue: () => 17
    };
    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === 'native-lib') {
          return {
            path: 'native-lib',
            exports: nativeModule
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        const m = await import("native-lib");
        [m.default.name, m.value, m.getValue()].join(":")
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toBe('native-lib:13:17');
  });

  it('shares the resolved-path cache between static and dynamic imports', async () => {
    let evaluations = 0;
    const env = createEnvironment();
    env.define('recordEvaluation', () => {
      evaluations += 1;
      return evaluations;
    });

    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './dep.js' || modulePath === './alias.js') {
          return {
            path: '/virtual/project/shared/dep.js',
            code: 'export const value = recordEvaluation();'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        import { value as staticValue } from "./dep.js";
        const dynamicModule = await import("./alias.js");
        ({ staticValue, dynamicValue: dynamicModule.value })
      `,
      env,
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toEqual({ staticValue: 1, dynamicValue: 1 });
    expect(evaluations).toBe(1);
  });

  it('rejects dynamic imports when no module resolver is configured', async () => {
    await expect(
      execute(
        'await import("./dep.js")',
        createEnvironment(),
        { sourcePath: '/virtual/project/main.js' }
      )
    ).rejects.toThrow('Module resolver not configured - cannot import modules');
  });

  it('rejects unresolved dynamic imports with the module path', async () => {
    const moduleResolver = {
      async resolve() {
        return null;
      }
    };

    await expect(
      execute(
        'await import("./missing.js")',
        createEnvironment(),
        {
          moduleResolver,
          sourcePath: '/virtual/project/main.js'
        }
      )
    ).rejects.toThrow("Cannot find module './missing.js'");
  });

  it('rejects non-string dynamic import specifiers before resolving', async () => {
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        return null;
      }
    };

    await expect(
      execute(
        'await import(42)',
        createEnvironment(),
        {
          moduleResolver,
          sourcePath: '/virtual/project/main.js'
        }
      )
    ).rejects.toThrow('Dynamic import specifier must evaluate to a string');
    expect(calls).toEqual([]);
  });
});
