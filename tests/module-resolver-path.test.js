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

  it('resolves top-level dynamic imports through the module resolver', async () => {
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

  it('keeps dynamic import as a promise before await', async () => {
    const moduleResolver = {
      async resolve(modulePath) {
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
      `
        const p = import("./dep.js");
        const hasThen = typeof p.then === "function";
        const m = await p;
        ({ hasThen, value: m.value })
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: '/virtual/project/main.js'
      }
    );

    expect(result).toEqual({ hasThen: true, value: 42 });
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

  it('does not recursively re-evaluate circular static imports', async () => {
    const modules = {
      'a.js': {
        path: 'a.js',
        code: 'import { b } from "b.js"; export const a = "a"; export const fromB = b;'
      },
      'b.js': {
        path: 'b.js',
        code: 'import { a } from "a.js"; export const b = "b"; export const fromA = a;'
      }
    };
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        if (calls.length > 20) {
          throw new Error(`resolver loop count=${calls.length} module=${modulePath} from=${fromPath}`);
        }
        return modules[modulePath] ?? null;
      }
    };

    const result = await execute(
      'import { a, fromB } from "a.js"; a + ":" + fromB',
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: 'root.js'
      }
    );

    expect(result).toBe('a:b');
    expect(calls).toEqual([
      { modulePath: 'a.js', fromPath: 'root.js' },
      { modulePath: 'b.js', fromPath: 'a.js' }
    ]);
  });

  it('keeps named class imports live across circular module evaluation', async () => {
    const modules = {
      'a.js': {
        path: 'a.js',
        code: 'import { B } from "b.js"; export class A { makeB() { return new B(); } }'
      },
      'b.js': {
        path: 'b.js',
        code: 'import { A } from "a.js"; export class B { typeOfA() { return typeof A; } makeA() { return new A(); } }'
      }
    };
    const calls = [];
    const moduleResolver = {
      async resolve(modulePath, fromPath) {
        calls.push({ modulePath, fromPath });
        if (calls.length > 20) {
          throw new Error(`resolver loop count=${calls.length} module=${modulePath} from=${fromPath}`);
        }
        return modules[modulePath] ?? null;
      }
    };

    const result = await execute(
      `
        import { A } from "a.js";
        import { B } from "b.js";
        const b = new A().makeB();
        const a = new B().makeA();
        ({ entryA: typeof A, entryB: typeof B, bTypeOfA: b.typeOfA(), aName: a.constructor.name })
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: 'root.js'
      }
    );

    expect(result).toEqual({
      entryA: 'function',
      entryB: 'function',
      bTypeOfA: 'function',
      aName: 'classConstructor'
    });
    expect(calls).toEqual([
      { modulePath: 'a.js', fromPath: 'root.js' },
      { modulePath: 'b.js', fromPath: 'a.js' }
    ]);
  });

  it('keeps default imports live across circular module evaluation', async () => {
    const modules = {
      'a.js': {
        path: 'a.js',
        code: 'import { typeOfA } from "b.js"; export default class A {} export const seen = typeOfA();'
      },
      'b.js': {
        path: 'b.js',
        code: 'import A from "a.js"; export function typeOfA() { return typeof A; } export function makeA() { return new A(); }'
      }
    };
    const moduleResolver = {
      async resolve(modulePath) {
        return modules[modulePath] ?? null;
      }
    };

    const result = await execute(
      `
        import A, { seen } from "a.js";
        import { typeOfA, makeA } from "b.js";
        const a = makeA();
        ({ entryA: typeof A, bTypeOfA: typeOfA(), duringA: seen, aName: a.constructor.name })
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: 'root.js'
      }
    );

    expect(result).toEqual({
      entryA: 'function',
      bTypeOfA: 'function',
      duringA: 'function',
      aName: 'classConstructor'
    });
  });

  it('keeps TypeScript page-object class imports constructable across cycles', async () => {
    const modules = {
      '@playwright/test': {
        code: '',
        exports: { Page: function Page() {}, Locator: function Locator() {} }
      },
      '@pages/main-page': {
        path: 'page-objects/main-page.ts',
        code: `
          import { Locator, Page } from '@playwright/test';
          import { DisappearingElementsPage } from '@pages/disappearing-elements/disappearing-elements-page';
          import { GeolocationPage } from './geolocation-page';

          export class MainPage {
            readonly page: Page;
            readonly disappearingElementsLink: Locator;
            readonly geolocationLink: Locator;

            constructor(page: Page) {
              this.page = page;
              this.disappearingElementsLink = page.getByRole('link', { name: 'Disappearing Elements' });
              this.geolocationLink = page.getByRole('link', { name: 'Geolocation' });
            }

            async dissappearringElements() {
              await this.disappearingElementsLink.click();
              return new DisappearingElementsPage(this.page);
            }

            async geolocation() {
              await this.geolocationLink.click();
              return new GeolocationPage(this.page);
            }
          }`
      },
      '@pages/disappearing-elements/disappearing-elements-page': {
        path: 'page-objects/disappearing-elements/disappearing-elements-page.ts',
        code: `
          import { MainPage } from '@pages/main-page';
          import { Locator, Page } from '@playwright/test';

          export class DisappearingElementsPage {
            readonly page: Page;
            readonly homeButton: Locator;

            constructor(page: Page) {
              this.page = page;
              this.homeButton = page.getByRole('link', { name: 'Home' });
            }

            async home() {
              await this.homeButton.click();
              return new MainPage(this.page);
            }
          }`
      },
      './geolocation-page': {
        path: 'page-objects/geolocation-page.ts',
        code: 'export class GeolocationPage { constructor(page) { this.page = page; } }'
      }
    };
    const moduleResolver = {
      async resolve(modulePath) {
        return modules[modulePath] ?? null;
      }
    };

    const result = await execute(
      `
        import { MainPage } from '@pages/main-page';
        import { DisappearingElementsPage } from '@pages/disappearing-elements/disappearing-elements-page';

        const locator = { click: async () => undefined };
        const page = { getByRole() { return locator; } };
        const main = new MainPage(page);
        const disappearing = await main.dissappearringElements();
        const home = await disappearing.home();
        ({ mainType: typeof MainPage, disappearingName: disappearing.constructor.name, homeName: home.constructor.name })
      `,
      createEnvironment(),
      {
        moduleResolver,
        sourcePath: 'wrapper.js'
      }
    );

    expect(result).toEqual({
      mainType: 'function',
      disappearingName: 'classConstructor',
      homeName: 'classConstructor'
    });
  });
});
