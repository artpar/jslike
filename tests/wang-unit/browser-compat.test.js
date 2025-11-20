/**
 * Test case for browser extension compatibility
 * Tests the exact code pattern used by the browser extension
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Browser Extension Compatibility', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({ moduleResolver: resolver });
  });

  it('should execute browser extension workflow pattern with compound assignment', async () => {
    const code = `let __inputs = {}
let x = 10
x += 5
__result = x`;

    const result = await interpreter.execute(code);
    expect(result).toBe(15);
  });

  it('should handle multiple compound assignments in browser pattern', async () => {
    const code = `let __inputs = {}
let x = 10
x += 5
let y = 20
y -= 3
let z = 4
z *= 2
let w = 16
w /= 4
__result = {
  x: x,
  y: y,
  z: z,
  w: w
}`;

    const result = await interpreter.execute(code);
    expect(result).toEqual({
      x: 15,
      y: 17,
      z: 8,
      w: 4,
    });
  });

  it('should work with __inputs as input parameter', async () => {
    const code = `let __inputs = { initial: 5 }
let x = __inputs.initial
x += 10
__result = x`;

    const result = await interpreter.execute(code);
    expect(result).toBe(15);
  });

  it('should handle compound assignment with __result directly', async () => {
    const code = `let __inputs = {}
__result = 0
__result += 10
__result += 5`;

    const result = await interpreter.execute(code);
    expect(result).toBe(15);
  });

  it('should work with all compound operators in sequence', async () => {
    const code = `let __inputs = {}
let value = 100
value += 20
value -= 10
value *= 2
value /= 4
__result = value`;

    const result = await interpreter.execute(code);
    expect(result).toBe(55); // ((100 + 20 - 10) * 2) / 4 = 55
  });

  it('should handle compound assignment in object properties', async () => {
    const code = `let __inputs = {}
let state = { count: 10 }
state.count += 5
state.count *= 2
__result = state.count`;

    const result = await interpreter.execute(code);
    expect(result).toBe(30);
  });

  it('should work with array elements and compound assignment', async () => {
    const code = `let __inputs = {}
let values = [10, 20, 30]
values[0] += 5
values[1] -= 5
values[2] *= 2
__result = values`;

    const result = await interpreter.execute(code);
    expect(result).toEqual([15, 15, 60]);
  });

  it('should handle string concatenation with += in browser pattern', async () => {
    const code = `let __inputs = {}
let message = "Hello"
message += " "
message += "World"
__result = message`;

    const result = await interpreter.execute(code);
    expect(result).toBe('Hello World');
  });

  it('should work with conditionals and compound assignment', async () => {
    const code = `let __inputs = { flag: true }
let value = 10
if (__inputs.flag) {
  value += 20
} else {
  value -= 5
}
__result = value`;

    const result = await interpreter.execute(code);
    expect(result).toBe(30);
  });

  it('should handle loops with compound assignment', async () => {
    const code = `let __inputs = {}
let sum = 0
for (let i = 1; i <= 5; i++) {
  sum += i
}
__result = sum`;

    const result = await interpreter.execute(code);
    expect(result).toBe(15);
  });
});
