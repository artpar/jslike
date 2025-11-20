// Algorithm examples

// Factorial
function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

console.log("Factorial of 5:", factorial(5));
console.log("Factorial of 10:", factorial(10));

// Fibonacci
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("\nFibonacci sequence:");
for (let i = 0; i < 10; i = i + 1) {
  console.log("  fib(" + i + ") =", fibonacci(i));
}

// Prime numbers
function isPrime(num) {
  if (num <= 1) {
    return false;
  }
  if (num === 2) {
    return true;
  }

  for (let i = 2; i * i <= num; i = i + 1) {
    if (num % i === 0) {
      return false;
    }
  }
  return true;
}

console.log("\nPrime numbers up to 30:");
for (let i = 2; i <= 30; i = i + 1) {
  if (isPrime(i)) {
    console.log("  " + i);
  }
}

// Sum of array
function sum(arr) {
  let total = 0;
  for (let num of arr) {
    total = total + num;
  }
  return total;
}

const numbers = [1, 2, 3, 4, 5];
console.log("\nSum of", numbers, "=", sum(numbers));

// Find maximum
function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i = i + 1) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}

const nums = [3, 7, 2, 9, 1, 5];
console.log("Maximum of", nums, "=", findMax(nums));
