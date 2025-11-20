// Simple demonstration of JSLike

// Variables
const x = 10;
const y = 20;
console.log("x + y =", x + y);

// Function
function double(n) {
  return n * 2;
}
console.log("double(5) =", double(5));

// Arrow function
const square = (n) => n * n;
console.log("square(4) =", square(4));

// If statement
if (x < y) {
  console.log("x is less than y");
}

// Array
const arr = [1, 2, 3];
console.log("Array:", arr[0], arr[1], arr[2]);

// Object
const obj = { name: "Test", value: 42 };
console.log("Object:", obj.name, obj.value);
