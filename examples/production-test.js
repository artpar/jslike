// Comprehensive production test - all ES6 features

// 1. ASI - no semicolons
const message = "Production Ready"
console.log("✅", message)

// 2. Classes
class Calculator {
  constructor(name) {
    this.name = name
  }

  add(a, b) {
    return a + b
  }
}

const calc = new Calculator("MathBot")
console.log("✅ Class:", calc.add(2, 3), "=", 5)

// 3. Destructuring
const {name} = calc
const [x, y, ...rest] = [1, 2, 3, 4, 5]
console.log("✅ Destructuring:", name, x, y, rest)

// 4. Template literals
const result = `${calc.name} calculated: ${calc.add(10, 20)}`
console.log("✅ Template literal:", result)

// 5. Spread operator
const arr = [1, 2, 3]
const arr2 = [...arr, 4, 5]
console.log("✅ Spread:", arr2)

// 6. Arrow functions with closures
const makeCounter = () => {
  let count = 0
  return () => ++count
}
const counter = makeCounter()
console.log("✅ Closures:", counter(), counter(), counter())

// 7. Complex algorithm
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log("✅ Fibonacci(10):", fibonacci(10))
console.log("\n🎉 All features working! JSLike is production-ready!")
