import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

async function executeTS(code, env = createEnvironment()) {
  return execute(code, env, { sourcePath: '/virtual/main.ts' });
}

describe('TypeScript erasure semantics', () => {
  it.each([
    ['type alias', 'type User = { name: string }; const value = 1; value', 1],
    ['interface', 'interface User { name: string } const value = 2; value', 2],
    ['declared function', 'declare function external(): string; const value = 3; value', 3],
    ['declared const', 'declare const external: string; const value = 4; value', 4],
    ['block-local type declarations', 'if (true) { type Local = string; interface Box { value: Local } } 5', 5]
  ])('treats %s as runtime no-op', async (_name, code, expected) => {
    await expect(executeTS(code)).resolves.toBe(expected);
  });

  it.each([
    ['variable annotation', 'const value: number = 1; value', 1],
    ['tuple annotation', 'const pair: [string, number] = ["a", 2]; pair[1]', 2],
    ['readonly array annotation', 'const items: readonly number[] = [3, 4]; items[0]', 3],
    ['object destructuring annotation', 'const { name }: { name: string } = { name: "Ada" }; name', 'Ada'],
    ['array destructuring annotation', 'const [first]: [string] = ["Grace"]; first', 'Grace']
  ])('ignores %s', async (_name, code, expected) => {
    await expect(executeTS(code)).resolves.toBe(expected);
  });

  it.each([
    ['function parameter and return annotations', 'function add(a: number, b: number): number { return a + b; } add(2, 3)', 5],
    ['optional parameter annotation', 'function value(x?: number): number { return x ?? 6; } value()', 6],
    ['rest parameter annotation', 'function sum(...values: number[]): number { return values[0] + values[1]; } sum(3, 4)', 7],
    ['type predicate return annotation', 'function isString(x: unknown): x is string { return typeof x === "string"; } isString("x")', true],
    ['generic function declaration', 'function id<T>(x: T): T { return x; } id<string>("typed")', 'typed'],
    ['generic arrow function', 'const id = <T>(x: T): T => x; id<number>(8)', 8],
    ['generic object method', 'const box = { get<T>(value: T): T { return value; } }; box.get<string>("ok")', 'ok']
  ])('executes functions with %s', async (_name, code, expected) => {
    await expect(executeTS(code)).resolves.toBe(expected);
  });

  it.each([
    ['as expression', 'const input: unknown = "as"; const value = input as string; value', 'as'],
    ['satisfies expression', 'const value = { name: "sat" } satisfies { name: string }; value.name', 'sat'],
    ['non-null expression', 'const value: string | null = "nonnull"; value!.toUpperCase()', 'NONNULL'],
    ['angle-bracket assertion', 'const input: unknown = "angle"; const value = <string>input; value', 'angle'],
    ['generic call instantiation', 'function id<T>(x: T): T { return x; } id<string>("call")', 'call']
  ])('unwraps %s', async (_name, code, expected) => {
    await expect(executeTS(code)).resolves.toBe(expected);
  });

  it('erases abstract and access modifiers while preserving runtime class behavior', async () => {
    const result = await executeTS(`
      abstract class Base {
        value(): number { return 9; }
      }
      class User extends Base {
        private name: string;
        constructor(name: string) {
          super();
          this.name = name;
        }
        public getName(): string {
          return this.name + this.value();
        }
      }
      new User("Ada").getName()
    `);

    expect(result).toBe('Ada9');
  });

  it.each([
    [
      'numeric enum with reverse mappings',
      'enum Color { Red, Blue = 4, Green } [Color.Red, Color.Blue, Color.Green, Color[5]]',
      [0, 4, 5, 'Green']
    ],
    [
      'string enum without reverse mappings',
      'enum Direction { Up = "UP", Down = "DOWN" } [Direction.Up, Direction.Down, Direction.UP]',
      ['UP', 'DOWN', undefined]
    ],
    [
      'computed numeric enum members',
      'enum Flags { A = 1 << 0, B = 1 << 1 } Flags.B',
      2
    ],
    [
      'const enum runtime object',
      'const enum Color { Red, Blue } Color.Blue',
      1
    ]
  ])('executes %s', async (_name, code, expected) => {
    await expect(executeTS(code)).resolves.toEqual(expected);
  });

  it('exports TypeScript enums from modules', async () => {
    const result = await execute(
      'export enum Color { Red, Blue } Color.Blue',
      createEnvironment(),
      { sourcePath: '/virtual/main.ts' }
    );

    expect(result).toBe(1);
  });

  it.each([
    [
      'public parameter property',
      'class User { constructor(public name: string) {} } new User("Ada").name',
      'Ada'
    ],
    [
      'readonly parameter property with default value',
      'class User { constructor(readonly name: string = "Grace") {} } new User().name',
      'Grace'
    ],
    [
      'private parameter property read by method',
      'class User { constructor(private name: string) {} getName(): string { return this.name; } } new User("Lin").getName()',
      'Lin'
    ]
  ])('executes %s', async (_name, code, expected) => {
    await expect(executeTS(code)).resolves.toBe(expected);
  });

  it('treats ambient declare module as runtime no-op', async () => {
    await expect(executeTS(
      'declare module "x" { export interface User { name: string } } const value = 10; value'
    )).resolves.toBe(10);
  });

  it.each([
    ['namespace', 'namespace Config { const value = 1 } Config.value', 'TSModuleDeclaration'],
    ['export assignment', 'const value = 1; export = value;', 'TSExportAssignment'],
    ['import equals', 'import fs = require("fs"); const value = 1; value', 'TSImportEqualsDeclaration']
  ])('throws clear unsupported runtime error for %s', async (_name, code, nodeType) => {
    await expect(executeTS(code)).rejects.toThrow(`Unsupported runtime TypeScript syntax: ${nodeType}`);
  });
});
