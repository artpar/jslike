import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

describe('TypeScript module execution', () => {
  it('executes imported .ts modules with erased type declarations and annotations', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === 'typed.ts') {
          return {
            path: 'typed.ts',
            code: 'type User = { name: string }; export const user: User = { name: "a" };'
          };
        }
        return null;
      }
    };

    const result = await execute(
      'import { user } from "typed.ts"; user.name',
      createEnvironment(),
      { moduleResolver }
    );

    expect(result).toBe('a');
  });

  it('uses resolved .ts module paths for nested TypeScript imports', async () => {
    const calls = [];
    const modules = {
      '/virtual/main.ts::./dep.ts': {
        path: '/virtual/lib/dep.ts',
        code: 'import { nested } from "./nested.ts"; export const value: number = nested;'
      },
      '/virtual/lib/dep.ts::./nested.ts': {
        path: '/virtual/lib/nested.ts',
        code: 'interface Box { value: number } export const nested: number = 7;'
      }
    };
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        return modules[`${fromPath}::${modulePath}`] ?? null;
      }
    };

    const result = await execute(
      'import { value } from "./dep.ts"; value',
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(7);
    expect(calls).toEqual([
      { modulePath: './dep.ts', fromPath: '/virtual/main.ts' },
      { modulePath: './nested.ts', fromPath: '/virtual/lib/dep.ts' }
    ]);
  });

  it('executes top-level .ts type assertions as their inner expressions', async () => {
    const result = await execute(
      `
        interface User { name: string }
        const user: User = { name: "Ada" };
        const one = user as User;
        const two = one satisfies User;
        const three = two!;
        three.name
      `,
      createEnvironment(),
      { sourcePath: '/virtual/main.ts' }
    );

    expect(result).toBe('Ada');
  });

  it('does not resolve type-only imports', async () => {
    const moduleResolver = {
      async resolve() {
        throw new Error('type-only import should not resolve at runtime');
      }
    };

    const result = await execute(
      `
        import type { User } from "./types.ts";
        const user: User = { name: "type-only" };
        user.name
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe('type-only');
  });

  it('does not require type-only mixed import specifiers to exist at runtime', async () => {
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        return {
          path: '/virtual/dep.ts',
          code: 'export const value: number = 11;'
        };
      }
    };

    const result = await execute(
      `
        import { type MissingType, value } from "./dep.ts";
        const typed: MissingType = value;
        typed
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(11);
    expect(calls).toEqual([
      { modulePath: './dep.ts', fromPath: '/virtual/main.ts' }
    ]);
  });

  it('elides regular named imports used only in type positions', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './types') {
          return {
            path: '/virtual/types.ts',
            code: 'export interface IProduct { name: string } export const value = 7;'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        import { IProduct, value } from "./types";
        const x: IProduct = { name: "a" };
        value
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(7);
  });

  it('does not resolve a regular import when every specifier is used only as a type', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        throw new Error(`type-only import should not resolve at runtime: ${modulePath}`);
      }
    };

    const result = await execute(
      `
        import { IProduct } from "./types";
        const x: IProduct = { name: "a" };
        x.name
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe('a');
  });

  it('still binds regular named imports referenced in function bodies', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './values') {
          return {
            path: '/virtual/values.ts',
            code: 'export const value = 8;'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        import { value } from "./values";
        function read(): number {
          return value;
        }
        read()
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(8);
  });

  it('elides default imports used only in type positions', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        throw new Error(`default type-only import should not resolve at runtime: ${modulePath}`);
      }
    };

    const result = await execute(
      `
        import Product from "./product";
        const x: Product = { name: "default" };
        x.name
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe('default');
  });

  it('elides namespace imports used only in qualified type positions', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        throw new Error(`namespace type-only import should not resolve at runtime: ${modulePath}`);
      }
    };

    const result = await execute(
      `
        import * as Models from "./models";
        const x: Models.IProduct = { name: "namespace" };
        x.name
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe('namespace');
  });

  it('still binds namespace imports used in value positions', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './models') {
          return {
            path: '/virtual/models.ts',
            code: 'export const value = 9;'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        import * as Models from "./models";
        Models.value
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(9);
  });

  it('still binds default imports used as TSX component values', async () => {
    const env = createEnvironment();
    env.define('React', {
      createElement: (type, props, ...children) => ({ type, props, children })
    });

    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './component') {
          return {
            path: '/virtual/component.tsx',
            code: 'export default function Button() { return "button"; }'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        import Button from "./component";
        const element = <Button />;
        element.type()
      `,
      env,
      {
        moduleResolver,
        sourcePath: '/virtual/main.tsx'
      }
    );

    expect(result).toBe('button');
  });

  it('still binds namespace imports used as TSX member component values', async () => {
    const env = createEnvironment();
    env.define('React', {
      createElement: (type, props, ...children) => ({ type, props, children })
    });

    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './ui') {
          return {
            path: '/virtual/ui.tsx',
            code: 'export function Button() { return "member-button"; }'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `
        import * as UI from "./ui";
        const element = <UI.Button />;
        element.type()
      `,
      env,
      {
        moduleResolver,
        sourcePath: '/virtual/main.tsx'
      }
    );

    expect(result).toBe('member-button');
  });

  it('skips type-only export specifiers', async () => {
    const result = await execute(
      `
        type User = { name: string };
        export type { User };
        export const value: number = 42;
        value
      `,
      createEnvironment(),
      { sourcePath: '/virtual/main.ts' }
    );

    expect(result).toBe(42);
  });

  it('does not resolve type-only re-exports', async () => {
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        if (modulePath === './entry.ts') {
          return {
            path: '/virtual/entry.ts',
            code: 'export type { User } from "./types.ts"; export const value: number = 12;'
          };
        }
        throw new Error(`unexpected runtime resolve for ${modulePath}`);
      }
    };

    const result = await execute(
      'import { value } from "./entry.ts"; value',
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(12);
    expect(calls).toEqual([
      { modulePath: './entry.ts', fromPath: '/virtual/main.ts' }
    ]);
  });

  it('exports runtime values from modules that also export local types', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './entry.ts') {
          return {
            path: '/virtual/entry.ts',
            code: 'type User = { name: string }; const value: number = 13; export { type User, value };'
          };
        }
        return null;
      }
    };

    const result = await execute(
      'import { value } from "./entry.ts"; value',
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(13);
  });

  it.each([
    ['.mts', './entry.mts'],
    ['.cts', './entry.cts']
  ])('executes imported %s modules with TypeScript syntax', async (_label, importPath) => {
    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === importPath) {
          return {
            path: `/virtual/entry${_label}`,
            code: 'interface Entry { value: number } export const value: number = 14;'
          };
        }
        return null;
      }
    };

    const result = await execute(
      `import { value } from "${importPath}"; value`,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe(14);
  });

  it('executes imported .tsx modules with JSX and TypeScript syntax', async () => {
    const env = createEnvironment();
    env.define('React', {
      createElement: (type, props, ...children) => ({ type, props, children })
    });

    const moduleResolver = {
      async resolve(modulePath) {
        if (modulePath === './component.tsx') {
          return {
            path: '/virtual/component.tsx',
            code: `
              type Label = string;
              const label: Label = "TSX";
              const element = <span>{label}</span>;
              export const text: Label = element.children[0];
            `
          };
        }
        return null;
      }
    };

    const result = await execute(
      'import { text } from "./component.tsx"; text',
      env,
      {
        moduleResolver,
        sourcePath: '/virtual/main.ts'
      }
    );

    expect(result).toBe('TSX');
  });

  it('executes .tsx JSX with TypeScript annotations', async () => {
    const env = createEnvironment();
    env.define('React', {
      createElement: (type, props, ...children) => ({ type, props, children })
    });

    const result = await execute(
      `
        type Label = string;
        const label: Label = "Hi";
        const element = <div className="greeting">{label}</div>;
        element.children[0]
      `,
      env,
      { sourcePath: '/virtual/component.tsx' }
    );

    expect(result).toBe('Hi');
  });

  it('executes TypeScript enums in module entry code', async () => {
    await expect(execute(
      'enum Color { Red, Blue } Color.Blue',
      createEnvironment(),
      { sourcePath: '/virtual/main.ts' }
    )).resolves.toBe(1);
  });
});
