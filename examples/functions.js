// Function examples

// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));

// Arrow functions
const add = (a, b) => a + b;
const multiply = (x, y) => {
  return x * y;
};

console.log("5 + 3 =", add(5, 3));
console.log("5 * 3 =", multiply(5, 3));

// Higher-order functions
function applyOperation(a, b, operation) {
  return operation(a, b);
}

console.log("10 + 20 =", applyOperation(10, 20, add));

// Closures
function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}

const counter = makeCounter();
console.log("Counter:", counter());
console.log("Counter:", counter());
console.log("Counter:", counter());
