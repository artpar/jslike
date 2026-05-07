import { describe, it, expect } from 'vitest';
import { parse } from '../src/index.js';

describe('TypeScript parser selection', () => {
  it('parses TypeScript when typescript option is enabled', () => {
    const ast = parse('type User = { name: string }; const user: User = { name: "a" };', {
      typescript: true
    });

    expect(ast.body.map(node => node.type)).toEqual([
      'TSTypeAliasDeclaration',
      'VariableDeclaration'
    ]);
  });

  it.each([
    '/virtual/file.ts',
    '/virtual/file.mts',
    '/virtual/file.cts'
  ])('parses TypeScript from sourcePath %s', (sourcePath) => {
    const ast = parse('interface User { name: string } const value: number = 1;', {
      sourcePath
    });

    expect(ast.body.map(node => node.type)).toEqual([
      'TSInterfaceDeclaration',
      'VariableDeclaration'
    ]);
  });

  it('parses TSX from .tsx sourcePath', () => {
    const ast = parse('const element: JSX.Element = <div className="x" />;', {
      sourcePath: '/virtual/component.tsx'
    });

    expect(ast.body[0].declarations[0].init.type).toBe('JSXElement');
  });

  it('parses TSX when tsx option is enabled', () => {
    const ast = parse('const element = <span>{1}</span>;', {
      tsx: true
    });

    expect(ast.body[0].declarations[0].init.type).toBe('JSXElement');
  });

  it('keeps JavaScript parser behavior when TypeScript is not enabled', () => {
    expect(() => parse('type User = { name: string };')).toThrow('Unexpected token');
  });

  it('keeps JSX parsing available for JavaScript', () => {
    const ast = parse('const element = <div />;', {
      sourceType: 'module'
    });

    expect(ast.body[0].declarations[0].init.type).toBe('JSXElement');
  });

  it('detects module source when export appears after a prior statement on the same line', () => {
    const ast = parse('const value: number = 1; export { value };', {
      sourcePath: '/virtual/main.ts'
    });

    expect(ast.sourceType).toBe('module');
    expect(ast.body.map(node => node.type)).toEqual([
      'VariableDeclaration',
      'ExportNamedDeclaration'
    ]);
  });

  it('detects module source when type declarations precede later exports', () => {
    const ast = parse('type User = {}; const value = 1; export { value };', {
      sourcePath: '/virtual/main.ts'
    });

    expect(ast.sourceType).toBe('module');
    expect(ast.body.map(node => node.type)).toEqual([
      'TSTypeAliasDeclaration',
      'VariableDeclaration',
      'ExportNamedDeclaration'
    ]);
  });

  it('parses import type and export type metadata', () => {
    const ast = parse('import type { User } from "./types"; export type { User };', {
      sourcePath: '/virtual/main.ts'
    });

    expect(ast.body[0].type).toBe('ImportDeclaration');
    expect(ast.body[0].importKind).toBe('type');
    expect(ast.body[1].type).toBe('ExportNamedDeclaration');
    expect(ast.body[1].exportKind).toBe('type');
  });

  it('parses angle-bracket type assertions in .ts mode', () => {
    const ast = parse('const value = <string>input;', {
      sourcePath: '/virtual/main.ts'
    });

    expect(ast.body[0].declarations[0].init.type).toBe('TSTypeAssertion');
  });
});
