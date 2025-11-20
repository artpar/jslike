// Arrays and Objects

// Arrays
const numbers = [1, 2, 3, 4, 5];
console.log("Array:", numbers);
console.log("First element:", numbers[0]);
console.log("Length:", numbers.length);

numbers[5] = 6;
console.log("After adding element:", numbers);

// Nested arrays
const matrix = [[1, 2], [3, 4], [5, 6]];
console.log("\nMatrix:");
for (let row of matrix) {
  console.log(row);
}

// Objects
const person = {
  name: "Alice",
  age: 30,
  city: "New York"
};

console.log("\nPerson object:", person);
console.log("Name:", person.name);
console.log("Age:", person["age"]);

// Adding properties
person.email = "alice@example.com";
person["phone"] = "555-1234";
console.log("Updated person:", person);

// Nested objects
const company = {
  name: "TechCorp",
  employees: [
    { name: "Bob", role: "Developer" },
    { name: "Carol", role: "Designer" }
  ],
  location: {
    city: "San Francisco",
    country: "USA"
  }
};

console.log("\nCompany:", company.name);
console.log("First employee:", company.employees[0].name);
console.log("Location:", company.location.city);

// Object shorthand
const x = 10;
const y = 20;
const point = { x, y };
console.log("\nPoint:", point);
