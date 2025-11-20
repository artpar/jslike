// Simple class test
class Rectangle {
  constructor(width, height) {
    console.log("Constructor called, this =", this)
    this.width = width
    this.height = height
  }

  area() {
    return this.width * this.height
  }
}

const rect = new Rectangle(10, 20)
console.log("Created rectangle:", rect)
console.log("Width:", rect.width)
console.log("Height:", rect.height)
console.log("Area:", rect.area())
