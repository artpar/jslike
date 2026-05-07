import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Class Fields', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({ moduleResolver: resolver });
  });

  it('should initialize direct instance fields with arrow functions bound to this', async () => {
    const result = await interpreter.execute(`
      class Base {
        constructor(v) { this.v = v; }
        visit = () => this.v;
      }

      const c = new Base(42);
      return {
        type: typeof c.visit,
        value: c.visit(),
        keys: Object.keys(c)
      };
    `);

    expect(result).toEqual({
      type: 'function',
      value: 42,
      keys: ['visit', 'v']
    });
  });

  it('should initialize inherited base class fields during super calls', async () => {
    const result = await interpreter.execute(`
      class Base {
        constructor(v) { this.v = v; }
        visit = () => this.v;
      }

      class Child extends Base {
        constructor() { super(42); }
      }

      const c = new Child();
      return {
        type: typeof c.visit,
        value: typeof c.visit === "function" ? c.visit() : undefined,
        keys: Object.keys(c)
      };
    `);

    expect(result).toEqual({
      type: 'function',
      value: 42,
      keys: ['visit', 'v']
    });
  });

  it('should initialize inherited fields when subclass has an implicit constructor', async () => {
    const result = await interpreter.execute(`
      class Base {
        constructor(v) { this.v = v; }
        visit = () => this.v;
      }

      class Child extends Base {}

      const c = new Child(7);
      return {
        value: c.visit(),
        keys: Object.keys(c),
        isBase: c instanceof Base,
        isChild: c instanceof Child
      };
    `);

    expect(result).toEqual({
      value: 7,
      keys: ['visit', 'v'],
      isBase: true,
      isChild: true
    });
  });

  it('should initialize derived fields immediately after super before the rest of the constructor body', async () => {
    const result = await interpreter.execute(`
      class Base {
        constructor() {
          this.order = ['base constructor'];
        }
      }

      class Child extends Base {
        own = this.order.push('derived field');

        constructor() {
          super();
          this.order.push('derived constructor');
        }
      }

      const c = new Child();
      return {
        own: c.own,
        order: c.order,
        keys: Object.keys(c)
      };
    `);

    expect(result).toEqual({
      own: 2,
      order: ['base constructor', 'derived field', 'derived constructor'],
      keys: ['order', 'own']
    });
  });

  it('should allow derived fields to read base constructor state', async () => {
    const result = await interpreter.execute(`
      class Base {
        constructor(v) {
          this.v = v;
        }
      }

      class Child extends Base {
        doubled = this.v * 2;

        constructor() {
          super(21);
          this.after = this.doubled + 1;
        }
      }

      const c = new Child();
      return {
        v: c.v,
        doubled: c.doubled,
        after: c.after,
        keys: Object.keys(c)
      };
    `);

    expect(result).toEqual({
      v: 21,
      doubled: 42,
      after: 43,
      keys: ['v', 'doubled', 'after']
    });
  });

  it('should initialize plain, undefined, and computed fields', async () => {
    const result = await interpreter.execute(`
      const dynamicName = 'visit';

      class Example {
        value = 10;
        empty;
        [dynamicName] = () => this.value;
      }

      const c = new Example();
      return {
        value: c.value,
        empty: c.empty,
        hasEmpty: Object.keys(c).includes('empty'),
        visitType: typeof c.visit,
        visitValue: c.visit(),
        keys: Object.keys(c)
      };
    `);

    expect(result).toEqual({
      value: 10,
      empty: undefined,
      hasEmpty: true,
      visitType: 'function',
      visitValue: 10,
      keys: ['value', 'empty', 'visit']
    });
  });

  it('should initialize field chains across multiple inheritance levels', async () => {
    const result = await interpreter.execute(`
      class GrandParent {
        grand = 'grand';
      }

      class Parent extends GrandParent {
        parent = this.grand + ':parent';
      }

      class Child extends Parent {
        child = this.parent + ':child';
      }

      const c = new Child();
      return {
        grand: c.grand,
        parent: c.parent,
        child: c.child,
        keys: Object.keys(c)
      };
    `);

    expect(result).toEqual({
      grand: 'grand',
      parent: 'grand:parent',
      child: 'grand:parent:child',
      keys: ['grand', 'parent', 'child']
    });
  });

  it('should preserve inherited prototype methods alongside inherited fields', async () => {
    const result = await interpreter.execute(`
      class Base {
        label = 'base';
        visit = () => this.label;

        describe() {
          return this.visit();
        }
      }

      class Child extends Base {}

      const c = new Child();
      return {
        visit: c.visit(),
        describe: c.describe(),
        keys: Object.keys(c)
      };
    `);

    expect(result).toEqual({
      visit: 'base',
      describe: 'base',
      keys: ['label', 'visit']
    });
  });
});
