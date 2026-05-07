import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

describe('Module resolver importer paths', () => {
  it('passes execute sourcePath to top-level static imports', async () => {
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        return {
          path: '/virtual/project/dep.js',
          code: 'export const value = 42;'
        };
      }
    };

    const result = await execute(
      'import { value } from "./dep.js"; value',
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

  it('uses resolved module path as fromPath for nested static imports', async () => {
    const calls = [];
    const modules = {
      '/virtual/project/main.js::./dep.js': {
        path: '/virtual/project/lib/dep.js',
        code: 'import { nested } from "./nested.js"; export const value = nested;'
      },
      '/virtual/project/lib/dep.js::./nested.js': {
        path: '/virtual/project/lib/nested.js',
        code: 'export const nested = 7;'
      }
    };
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        return modules[`${fromPath}::${modulePath}`] ?? null;
      }
    };

    const result = await execute(
      'import { value } from "./dep.js"; value',
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toBe(7);
    expect(calls).toEqual([
      { modulePath: './dep.js', fromPath: '/virtual/project/main.js' },
      { modulePath: './nested.js', fromPath: '/virtual/project/lib/dep.js' }
    ]);
  });

  it('caches modules by resolved path instead of raw import specifier', async () => {
    const modules = {
      '/virtual/project/main.js::./a.js': {
        path: '/virtual/project/one/a.js',
        code: 'import { value } from "./shared.js"; export const valueA = value;'
      },
      '/virtual/project/main.js::./b.js': {
        path: '/virtual/project/two/b.js',
        code: 'import { value } from "./shared.js"; export const valueB = value;'
      },
      '/virtual/project/one/a.js::./shared.js': {
        path: '/virtual/project/one/shared.js',
        code: 'export const value = "one";'
      },
      '/virtual/project/two/b.js::./shared.js': {
        path: '/virtual/project/two/shared.js',
        code: 'export const value = "two";'
      }
    };
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        return modules[`${fromPath}::${modulePath}`] ?? null;
      }
    };

    const result = await execute(
      `
        import { valueA } from "./a.js";
        import { valueB } from "./b.js";
        valueA + ":" + valueB
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toBe('one:two');
  });
});
