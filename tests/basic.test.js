// Basic tests for JSLike - what actually works
import { execute } from '../src/index.js';

const tests = [];

// Test 1: Variables
tests.push({
  name: 'Variables (const, let, var)',
  run: async () => {
    const result = await execute(`
const x = 10;
let y = 20;
var z = 30;
x + y + z
    `);
    if (result !== 60) throw new Error(`Expected 60, got ${result}`);
  }
});

// Test 2: Functions
tests.push({
  name: 'Function declaration',
  run: async () => {
    const result = await execute(`
function add(a, b) {
  return a + b;
}
add(5, 3)
    `);
    if (result !== 8) throw new Error(`Expected 8, got ${result}`);
  }
});

// Test 3: Arrow functions
tests.push({
  name: 'Arrow functions',
  run: async () => {
    const result = await execute(`
const multiply = (a, b) => a * b;
multiply(4, 5)
    `);
    if (result !== 20) throw new Error(`Expected 20, got ${result}`);
  }
});

// Test 4: Objects
tests.push({
  name: 'Object literals',
  run: async () => {
    const result = await execute(`
const obj = { x: 10, y: 20 };
obj.x + obj.y
    `);
    if (result !== 30) throw new Error(`Expected 30, got ${result}`);
  }
});

// Test 5: Arrays
tests.push({
  name: 'Array literals',
  run: async () => {
    const result = await execute(`
const arr = [1, 2, 3];
arr[0] + arr[1] + arr[2]
    `);
    if (result !== 6) throw new Error(`Expected 6, got ${result}`);
  }
});

// Test 6: If/else
tests.push({
  name: 'If/else statements',
  run: async () => {
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
    if (result !== "big") throw new Error(`Expected "big", got ${result}`);
  }
});

// Test 7: For loop
tests.push({
  name: 'For loop',
  run: async () => {
    const result = await execute(`
let sum = 0;
for (let i = 1; i <= 5; i = i + 1) {
  sum = sum + i;
}
sum
    `);
    if (result !== 15) throw new Error(`Expected 15, got ${result}`);
  }
});

// Test 8: While loop
tests.push({
  name: 'While loop',
  run: async () => {
    const result = await execute(`
let i = 0;
let sum = 0;
while (i < 5) {
  sum = sum + i;
  i = i + 1;
}
sum
    `);
    if (result !== 10) throw new Error(`Expected 10, got ${result}`);
  }
});

// Test 9: Closures
tests.push({
  name: 'Closures',
  run: async () => {
    const result = await execute(`
function makeAdder(x) {
  return (y) => x + y;
}
const add5 = makeAdder(5);
add5(3)
    `);
    if (result !== 8) throw new Error(`Expected 8, got ${result}`);
  }
});

// Test 10: Operators
tests.push({
  name: 'Binary operators',
  run: async () => {
    const result = await execute(`
const a = 10;
const b = 3;
a + b * 2
    `);
    if (result !== 16) throw new Error(`Expected 16, got ${result}`);
  }
});

// Run all tests
async function runTests() {
  console.log('🧪 Running JSLike Tests\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.run();
      console.log(`  ✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${test.name}`);
      console.log(`     ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
