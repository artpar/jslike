import { describe, it, expect } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';

describe('Promise Method Chaining', () => {
  function createInterpreter(functions = {}) {
    return new WangInterpreter({ functions });
  }

  it('should call Promise.prototype.then on resolved promises', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      return await Promise.resolve(1).then(x => x + 1);
    `);

    expect(result).toBe(2);
  });

  it('should preserve Promise values stored in variables before chaining', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let promise = Promise.resolve(4);
      return await promise.then(x => x + 1);
    `);

    expect(result).toBe(5);
  });

  it('should preserve Promise values assigned after declaration before chaining', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let promise;
      promise = Promise.resolve(6);
      return await promise.then(x => x + 1);
    `);

    expect(result).toBe(7);
  });

  it('should preserve Promise values stored on object properties before chaining', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let state = {};
      state.promise = Promise.resolve(8);
      return await state.promise.then(x => x + 1);
    `);

    expect(result).toBe(9);
  });

  it('should call Promise.prototype.catch on resolved and rejected promises', async () => {
    const interpreter = createInterpreter();

    const resolved = await interpreter.execute(`
      return await Promise.resolve(false).catch(() => true);
    `);
    const rejected = await interpreter.execute(`
      return await Promise.reject(new Error("failed")).catch(() => true);
    `);

    expect(resolved).toBe(false);
    expect(rejected).toBe(true);
  });

  it('should call Promise methods on native async function results', async () => {
    const interpreter = createInterpreter({
      nativeAsync: async () => false
    });

    const result = await interpreter.execute(`
      return await nativeAsync().catch(() => true);
    `);

    expect(result).toBe(false);
  });

  it('should call Promise methods on nested native object method results', async () => {
    const interpreter = createInterpreter({
      page: {
        locator: () => ({
          isVisible: async () => false
        })
      }
    });

    const result = await interpreter.execute(`
      return await page.locator("#submit").isVisible().catch(() => true);
    `);

    expect(result).toBe(false);
  });

  it('should recover rejected nested native object method results with catch', async () => {
    const interpreter = createInterpreter({
      page: {
        locator: () => ({
          isVisible: async () => {
            throw new Error("detached");
          }
        })
      }
    });

    const result = await interpreter.execute(`
      return await page.locator("#missing").isVisible().catch(() => false);
    `);

    expect(result).toBe(false);
  });

  it('should call Promise.prototype.finally without replacing the resolved value', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let hit = false;
      let value = await Promise.resolve(3).finally(() => { hit = true });
      return hit ? value : 0;
    `);

    expect(result).toBe(3);
  });

  it('should preserve Promise receivers through conditional expressions', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let promise = true ? Promise.resolve(10) : Promise.resolve(0);
      return await promise.then(x => x + 1);
    `);

    expect(result).toBe(11);
  });

  it('should preserve Promise receivers through logical expressions', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let promise = null ?? Promise.resolve(12);
      return await promise.then(x => x + 1);
    `);

    expect(result).toBe(13);
  });

  it('should preserve Promise receivers through sequence expressions', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      return await (Promise.resolve(0), Promise.resolve(14)).then(x => x + 1);
    `);

    expect(result).toBe(15);
  });

  it('should run longer then catch finally chains with interpreted callbacks', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let finalized = false;
      let value = await Promise.resolve(2)
        .then(x => x + 3)
        .then(x => Promise.resolve(x * 2))
        .catch(() => 0)
        .finally(() => { finalized = true });
      return finalized ? value : -1;
    `);

    expect(result).toBe(10);
  });

  it('should support Promise.all with mixed then and catch chains', async () => {
    const interpreter = createInterpreter();

    const result = await interpreter.execute(`
      let results = await Promise.all([
        Promise.resolve(1).then(x => x + 1),
        Promise.reject(new Error("failed")).catch(() => 3)
      ]);
      return results;
    `);

    expect(result).toEqual([2, 3]);
  });
});
