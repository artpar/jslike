// Loop examples

// For loop
console.log("For loop:");
for (let i = 1; i <= 5; i = i + 1) {
  console.log("  Iteration", i);
}

// While loop
console.log("\nWhile loop:");
let count = 1;
while (count <= 3) {
  console.log("  Count:", count);
  count = count + 1;
}

// Do-while loop
console.log("\nDo-While loop:");
let num = 1;
do {
  console.log("  Number:", num);
  num = num + 1;
} while (num <= 3);

// For-in loop
console.log("\nFor-in loop:");
const obj = { a: 1, b: 2, c: 3 };
for (let key in obj) {
  console.log("  Key:", key, "Value:", obj[key]);
}

// For-of loop
console.log("\nFor-of loop:");
const arr = [10, 20, 30];
for (let value of arr) {
  console.log("  Value:", value);
}

// Break and continue
console.log("\nBreak and Continue:");
for (let i = 1; i <= 10; i = i + 1) {
  if (i === 3) {
    continue;
  }
  if (i === 7) {
    break;
  }
  console.log("  i =", i);
}
