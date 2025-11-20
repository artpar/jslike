// Control flow examples

// If-else
const age = 18;

if (age >= 18) {
  console.log("You are an adult");
} else {
  console.log("You are a minor");
}

// Nested if-else
const score = 85;

if (score >= 90) {
  console.log("Grade: A");
} else if (score >= 80) {
  console.log("Grade: B");
} else if (score >= 70) {
  console.log("Grade: C");
} else if (score >= 60) {
  console.log("Grade: D");
} else {
  console.log("Grade: F");
}

// Ternary operator
const isEven = (5 % 2 === 0) ? "even" : "odd";
console.log("5 is", isEven);

// Switch statement
const day = 3;

switch (day) {
  case 1:
    console.log("Monday");
    break;
  case 2:
    console.log("Tuesday");
    break;
  case 3:
    console.log("Wednesday");
    break;
  case 4:
    console.log("Thursday");
    break;
  case 5:
    console.log("Friday");
    break;
  default:
    console.log("Weekend");
}

// Try-catch
try {
  console.log("\nTrying risky operation...");
  throw "Something went wrong!";
} catch (error) {
  console.log("Caught error:", error);
}

console.log("Program continues after error handling");

// Try-finally
try {
  console.log("\nExecuting code...");
} finally {
  console.log("Cleanup in finally block");
}

// Try-catch-finally
let x = 10;
try {
  console.log("\nValue of x:", x);
  if (x > 5) {
    throw "x is too large!";
  }
} catch (err) {
  console.log("Error:", err);
} finally {
  console.log("Finally block always executes");
}
