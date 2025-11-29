// Basic tests for JSLike - what actually works
import { describe, it, expect } from 'vitest';
import { execute } from '../src/index.js';

describe('JSLike Basic Tests', () => {
  it('Variables (const, let, var)', async () => {
    const result = await execute(`
const x = 10;
let y = 20;
var z = 30;
x + y + z
    `);
    expect(result).toBe(60);
  });

  it('Function declaration', async () => {
    const result = await execute(`
function add(a, b) {
  return a + b;
}
add(5, 3)
    `);
    expect(result).toBe(8);
  });

  it('Arrow functions', async () => {
    const result = await execute(`
const multiply = (a, b) => a * b;
multiply(4, 5)
    `);
    expect(result).toBe(20);
  });

  it('Object literals', async () => {
    const result = await execute(`
const obj = { x: 10, y: 20 };
obj.x + obj.y
    `);
    expect(result).toBe(30);
  });

  it('Array literals', async () => {
    const result = await execute(`
const arr = [1, 2, 3];
arr[0] + arr[1] + arr[2]
    `);
    expect(result).toBe(6);
  });

  it('If/else statements', async () => {
    const result = await execute(`
const x = 10;
let result;
if (x > 5) {
  result = "big";
} else {
  result = "small";
}
result
    `);
    expect(result).toBe("big");
  });

  it('For loop', async () => {
    const result = await execute(`
let sum = 0;
for (let i = 1; i <= 5; i = i + 1) {
  sum = sum + i;
}
sum
    `);
    expect(result).toBe(15);
  });

  it('While loop', async () => {
    const result = await execute(`
let i = 0;
let sum = 0;
while (i < 5) {
  sum = sum + i;
  i = i + 1;
}
sum
    `);
    expect(result).toBe(10);
  });

  it('Closures', async () => {
    const result = await execute(`
function makeAdder(x) {
  return (y) => x + y;
}
const add5 = makeAdder(5);
add5(3)
    `);
    expect(result).toBe(8);
  });

  it('Binary operators', async () => {
    const result = await execute(`
const a = 10;
const b = 3;
a + b * 2
    `);
    expect(result).toBe(16);
  });
});
