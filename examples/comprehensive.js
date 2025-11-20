// Comprehensive example demonstrating various features

console.log("=== JSLike Language Demo ===\n");

// 1. Variables and types
console.log("1. Variables and Types:");
let name = "JSLike";
const version = 1.0;
var isActive = true;
let nothing = null;
let notDefined = undefined;

console.log("  String:", name);
console.log("  Number:", version);
console.log("  Boolean:", isActive);
console.log("  Null:", nothing);
console.log("  Undefined:", notDefined);

// 2. Operators
console.log("\n2. Operators:");
console.log("  Arithmetic: 10 + 5 =", 10 + 5);
console.log("  Comparison: 10 > 5 =", 10 > 5);
console.log("  Logical: true && false =", true && false);
console.log("  Bitwise: 5 | 3 =", 5 | 3);

// 3. Functions
console.log("\n3. Functions:");

function greet(name) {
  return "Hello, " + name + "!";
}

const square = (n) => n * n;

console.log("  Function:", greet("World"));
console.log("  Arrow function:", square(5));

// 4. Arrays and iteration
console.log("\n4. Arrays:");
const fruits = ["apple", "banana", "cherry"];
console.log("  Fruits:", fruits);

for (let i = 0; i < fruits.length; i = i + 1) {
  console.log("    " + i + ":", fruits[i]);
}

// 5. Objects
console.log("\n5. Objects:");
const car = {
  brand: "Tesla",
  model: "Model 3",
  year: 2024,
  getInfo: () => {
    return "Tesla Model 3 (2024)";
  }
};

console.log("  Car:", car);
console.log("  Brand:", car.brand);
console.log("  Info:", car.getInfo());

// 6. Control flow
console.log("\n6. Control Flow:");

const num = 15;
if (num > 10) {
  console.log("  Number is greater than 10");
}

for (let i = 1; i <= 5; i = i + 1) {
  if (i === 3) {
    continue;
  }
  console.log("  Loop iteration:", i);
}

// 7. Higher-order functions
console.log("\n7. Higher-Order Functions:");

function applyTwice(func, value) {
  return func(func(value));
}

const double = (x) => x * 2;
console.log("  Apply double twice to 3:", applyTwice(double, 3));

// 8. Closures
console.log("\n8. Closures:");

function createMultiplier(factor) {
  return (num) => num * factor;
}

const triple = createMultiplier(3);
const quadruple = createMultiplier(4);

console.log("  Triple 5:", triple(5));
console.log("  Quadruple 5:", quadruple(5));

// 9. Recursion
console.log("\n9. Recursion:");

function countdown(n) {
  if (n <= 0) {
    console.log("  Blastoff!");
    return;
  }
  console.log("  " + n + "...");
  countdown(n - 1);
}

countdown(5);

// 10. Error handling
console.log("\n10. Error Handling:");

try {
  console.log("  Attempting division...");
  const result = 10 / 2;
  console.log("  Result:", result);

  if (result < 10) {
    throw "Result too small!";
  }
} catch (error) {
  console.log("  Caught:", error);
} finally {
  console.log("  Cleanup complete");
}

console.log("\n=== Demo Complete ===");
