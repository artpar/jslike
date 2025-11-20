// ES6 Features Test

// 1. ASI - No semicolons needed!
const x = 10
const y = 20
console.log("ASI Test:", x + y)

// 2. Template literals
const name = "World"
const greeting = `Hello, ${name}!`
console.log("Template literal:", greeting)

// 3. Destructuring objects
const person = { firstName: "John", lastName: "Doe", age: 30 }
const { firstName, age } = person
console.log("Destructuring:", firstName, "is", age, "years old")

// 4. Destructuring arrays
const numbers = [1, 2, 3, 4, 5]
const [first, second, ...rest] = numbers
console.log("Array destructuring:", first, second, rest)

// 5. Arrow functions (already worked)
const double = x => x * 2
console.log("Arrow function:", double(5))

// 6. Classes
class Rectangle {
  constructor(width, height) {
    this.width = width
    this.height = height
  }

  area() {
    return this.width * this.height
  }
}

const rect = new Rectangle(10, 20)
console.log("Class test - Area:", rect.area())

// 7. Spread operator
const arr1 = [1, 2, 3]
const arr2 = [...arr1, 4, 5, 6]
console.log("Spread operator:", arr2)

// 8. Enhanced object literals
const shorthand = "value"
const obj = {
  shorthand,
  method() {
    return "I'm a method"
  }
}
console.log("Object shorthand:", obj.shorthand)
console.log("Object method:", obj.method())
