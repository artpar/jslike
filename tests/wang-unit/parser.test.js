import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Parser', () => {
  it('should parse simple variable declaration', () => {
    const ctx = new TestContext();
    const results = ctx.parse('let x = 5');

    expect(results).toHaveLength(1);
    const ast = results[0];
    expect(ast.type).toBe('Program');
    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('VariableDeclaration');
  });

  it('should parse multiple statements', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      let x = 5
      let y = 10
      x + y
    `);

    expect(results).toHaveLength(1);
    const ast = results[0];
    expect(ast.body).toHaveLength(3);
  });

  it('should parse binary expression precedence correctly', () => {
    const ctx = new TestContext();
    const results = ctx.parse('2 + 3 * 4');

    expect(results).toHaveLength(1);
    const expr = results[0].body[0].expression;
    expect(expr.type).toBe('BinaryExpression');
    expect(expr.operator).toBe('+');
    expect(expr.right.type).toBe('BinaryExpression');
    expect(expr.right.operator).toBe('*');
  });

  it('should parse function declaration', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      function add(a, b) {
        return a + b
      }
    `);

    expect(results).toHaveLength(1);
    const fn = results[0].body[0];
    expect(fn.type).toBe('FunctionDeclaration');
    expect(fn.id.name).toBe('add');
    expect(fn.params).toHaveLength(2);
  });

  it('should parse arrow function', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const add = (a, b) => a + b');

    expect(results).toHaveLength(1);
    const decl = results[0].body[0];
    const arrow = decl.declarations[0].init;
    expect(arrow.type).toBe('ArrowFunctionExpression');
    expect(arrow.params).toHaveLength(2);
  });

  it('should parse object literal', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      const obj = {
        name: "test",
        value: 42,
        nested: { x: 1 }
      }
    `);

    expect(results).toHaveLength(1);
    const obj = results[0].body[0].declarations[0].init;
    expect(obj.type).toBe('ObjectExpression');
    expect(obj.properties).toHaveLength(3);
  });

  it('should parse array literal', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const arr = [1, 2, 3, ...other]');

    expect(results).toHaveLength(1);
    const arr = results[0].body[0].declarations[0].init;
    expect(arr.type).toBe('ArrayExpression');
    expect(arr.elements).toHaveLength(4);
    expect(arr.elements[3].type).toBe('SpreadElement');
  });

  it('should parse empty array correctly', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const arr = []');

    expect(results).toHaveLength(1);
    const arr = results[0].body[0].declarations[0].init;
    expect(arr.type).toBe('ArrayExpression');
    expect(arr.elements).toHaveLength(0);
  });

  // Pipeline expression test removed - not JavaScript compatible

  it('should parse class declaration', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      class Person {
        constructor(name) {
          this.name = name
          this.age = 0
        }
        
        greet() {
          return "Hello, " + this.name
        }
      }
    `);

    expect(results).toHaveLength(1);
    const cls = results[0].body[0];
    expect(cls.type).toBe('ClassDeclaration');
    expect(cls.id.name).toBe('Person');
    expect(cls.body.body).toHaveLength(2);
  });

  it('should parse import/export statements', () => {
    const ctx = new TestContext();

    const importResults = ctx.parse('import { foo, bar } from "module"');
    expect(importResults).toHaveLength(1);
    const imp = importResults[0].body[0];
    expect(imp.type).toBe('ImportDeclaration');
    expect(imp.specifiers).toHaveLength(2);

    const exportResults = ctx.parse('export const value = 42');
    expect(exportResults).toHaveLength(1);
    const exp = exportResults[0].body[0];
    expect(exp.type).toBe('ExportNamedDeclaration');
  });

  it('should parse try-catch-finally', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      try {
        riskyOperation()
      } catch (e) {
        handleError(e)
      } finally {
        cleanup()
      }
    `);

    expect(results).toHaveLength(1);
    const tryStmt = results[0].body[0];
    expect(tryStmt.type).toBe('TryStatement');
    expect(tryStmt.handler.type).toBe('CatchClause');
    expect(tryStmt.finalizer.type).toBe('BlockStatement');
  });

  it('should parse destructuring patterns', () => {
    const ctx = new TestContext();

    // Object destructuring
    const objResults = ctx.parse('const { a, b: renamed } = obj');
    const objPattern = objResults[0].body[0].declarations[0].id;
    expect(objPattern.type).toBe('ObjectPattern');
    expect(objPattern.properties).toHaveLength(2);

    // Array destructuring
    const arrResults = ctx.parse('const [first, , third, ...rest] = array');
    const arrPattern = arrResults[0].body[0].declarations[0].id;
    expect(arrPattern.type).toBe('ArrayPattern');
    expect(arrPattern.elements).toHaveLength(4);
    expect(arrPattern.elements[1]).toBeNull();
  });
});
