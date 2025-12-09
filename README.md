# JSLike

**Production-ready JavaScript interpreter** with full ES6+ support, native JSX parsing, and React integration. JSLike executes real JavaScript code with a custom runtime environment, supporting modern ES6+ features including classes, destructuring, template literals, JSX, and more.

## Features

- **Production-Ready** - Handles files of any size, tested with 1000+ tests
- **Full ES6+ JavaScript Support** - Classes, destructuring, template literals, spread operator, arrow functions
- **Native JSX Support** - Parse and execute JSX without pre-transformation
- **React Integration** - Import React hooks and components via moduleResolver
- **CSP-Safe** - Tree-walking interpreter, no eval() or new Function()
- **ASI (Automatic Semicolon Insertion)** - Write JavaScript naturally without mandatory semicolons
- **Acorn Parser** - Battle-tested parser used by webpack, ESLint, and major tools
- **Zero Runtime Dependencies** - Parser bundled, no npm install needed after build
- **REPL & CLI** - Interactive development and direct file execution

## Installation

```bash
npm install jslike
```

Or for development:

```bash
git clone https://github.com/artpar/jslike.git
cd jslike
npm install
npm run build
```

## Quick Start

### Programmatic Usage

```javascript
import { execute, createEnvironment } from 'jslike';

// Simple execution
const result = await execute(`
  const greeting = "Hello";
  const name = "World";
  greeting + ", " + name + "!"
`);
console.log(result); // "Hello, World!"
```

### JSX Support

```javascript
import { execute } from 'jslike';

const element = await execute(`
  function Button({ label, onClick }) {
    return <button className="btn" onClick={onClick}>{label}</button>;
  }

  <div className="container">
    <h1>Welcome</h1>
    <Button label="Click me" onClick={() => console.log('clicked')} />
  </div>
`);

// element is a React-compatible element object:
// { $$typeof: Symbol(react.element), type: 'div', props: {...}, ... }
```

### React Integration

```javascript
import { execute, createEnvironment } from 'jslike';
import * as React from 'react';

// Create module resolver for React imports
const moduleResolver = {
  async resolve(modulePath) {
    if (modulePath === 'react') {
      return { exports: React };  // Return native module exports
    }
    return null;
  }
};

// Create environment with React for JSX
const env = createEnvironment();
env.define('React', React);

// Execute with React hooks
const component = await execute(`
  import { useState, useEffect } from 'react';

  function Counter() {
    const [count, setCount] = useState(0);

    useEffect(() => {
      document.title = \`Count: \${count}\`;
    }, [count]);

    return (
      <div>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    );
  }

  <Counter />
`, env, { moduleResolver });
```

### CLI Usage

```bash
# Run a file
npx jslike myfile.js

# Interactive REPL
npx jslike --repl
```

## Module System

JSLike supports ES6 imports with a flexible module resolver:

### Native Module Exports (React, lodash, etc.)

```javascript
const moduleResolver = {
  async resolve(modulePath) {
    // Return native JavaScript objects directly
    if (modulePath === 'react') {
      return { exports: React };
    }
    if (modulePath === 'lodash') {
      return { exports: _ };
    }
    return null;
  }
};
```

### Code Modules (parsed and executed)

```javascript
const moduleResolver = {
  async resolve(modulePath) {
    if (modulePath === './utils') {
      return {
        code: `
          export function double(x) { return x * 2; }
          export const PI = 3.14159;
        `
      };
    }
    return null;
  }
};
```

### Import Styles Supported

```javascript
import { useState, useEffect } from 'react';     // Named imports
import React from 'react';                        // Default import
import * as Utils from './utils';                 // Namespace import
```

## JSX Features

### Basic Elements

```javascript
<div className="container">Hello World</div>
<input type="text" disabled />
<br />
```

### Expressions

```javascript
const name = "World";
<div>Hello {name}</div>
<div>{1 + 2 + 3}</div>
<div>{items.map(item => <span key={item.id}>{item.name}</span>)}</div>
```

### Attributes

```javascript
// String attributes
<div className="container" id="main">

// Expression attributes
<div className={isActive ? 'active' : 'inactive'}>

// Spread attributes
const props = { className: 'btn', disabled: true };
<button {...props}>Click</button>

// Boolean attributes
<input disabled />  // Same as disabled={true}
```

### Fragments

```javascript
<>
  <div>First</div>
  <div>Second</div>
</>
```

### Components

```javascript
// Function components
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage - components are stored as type (React behavior)
<Card title="Welcome">
  <p>Card content here</p>
</Card>

// To render, call component manually or use React renderer
Card({ title: "Welcome", children: <p>Content</p> })
```

### Member Expression Components

```javascript
const UI = {
  Button: ({ children }) => <button className="ui-btn">{children}</button>,
  Card: ({ children }) => <div className="ui-card">{children}</div>
};

<UI.Button>Click me</UI.Button>
```

## Language Features

### Variables

```javascript
let x = 10;
const name = "Alice";
var isActive = true;
```

### Functions

```javascript
// Function declaration
function add(a, b) {
  return a + b;
}

// Arrow functions
const multiply = (x, y) => x * y;
const greet = name => `Hello, ${name}`;

// Default parameters
function greet(name = "World") {
  return `Hello, ${name}`;
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
```

### Classes

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }
}

class Dog extends Animal {
  speak() {
    return `${this.name} barks`;
  }
}

const dog = new Dog("Rex");
dog.speak(); // "Rex barks"
```

### Destructuring

```javascript
// Object destructuring
const { name, age } = person;
const { name: userName, age: userAge } = person;

// Array destructuring
const [first, second, ...rest] = array;

// Parameter destructuring
function greet({ name, age }) {
  return `${name} is ${age}`;
}
```

### Template Literals

```javascript
const name = "World";
const greeting = `Hello, ${name}!`;
const multiline = `
  Line 1
  Line 2
`;
```

### Async/Await

```javascript
async function fetchData() {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Top-level await supported
const result = await fetchData();
```

### Control Flow

```javascript
// If-else
if (x > 10) {
  console.log("Greater");
} else if (x === 10) {
  console.log("Equal");
} else {
  console.log("Less");
}

// Ternary
const result = x > 5 ? "yes" : "no";

// Nullish coalescing
const value = input ?? "default";

// Optional chaining
const name = user?.profile?.name;

// Switch
switch (day) {
  case 1: return "Monday";
  case 2: return "Tuesday";
  default: return "Other";
}
```

### Loops

```javascript
// For loop
for (let i = 0; i < 10; i++) {
  console.log(i);
}

// For-of
for (const item of array) {
  console.log(item);
}

// For-in
for (const key in object) {
  console.log(key, object[key]);
}

// While
while (condition) { /* ... */ }

// Do-while
do { /* ... */ } while (condition);
```

## Built-in Objects & Functions

### Standard JavaScript

- `console.log()`, `console.error()`, `console.warn()`
- `Math.PI`, `Math.sqrt()`, `Math.random()`, etc.
- `Array`, `Object`, `String`, `Number`, `Boolean`
- `Map`, `Set`, `WeakMap`, `WeakSet`
- `RegExp`, `Symbol`
- `JSON.parse()`, `JSON.stringify()`
- `Promise`, `Date`, `Error`
- `setTimeout()`, `setInterval()`
- `parseInt()`, `parseFloat()`, `isNaN()`, `isFinite()`

### JSX Runtime

- `createElement(type, props, ...children)` - Creates React-compatible elements
- `Fragment` - Symbol for React fragments

### Wang Standard Library

Utility functions available globally:

```javascript
// Array operations
sort_by(array, key)      // Sort by key or function
group_by(array, key)     // Group into object by key
unique(array)            // Remove duplicates
chunk(array, size)       // Split into chunks
flatten(array, depth)    // Flatten nested arrays
first(array, n)          // Get first n items
last(array, n)           // Get last n items
range(start, end, step)  // Generate number sequence

// Object operations
keys(obj)                // Object.keys
values(obj)              // Object.values
entries(obj)             // Object.entries
pick(obj, keys)          // Pick specific keys
omit(obj, keys)          // Omit specific keys
merge(...objects)        // Merge objects
get(obj, path, default)  // Deep get with dot notation
clone(obj)               // Deep clone

// String operations
split(str, sep)          // Split string
join(arr, sep)           // Join array
trim(str)                // Trim whitespace
upper(str)               // Uppercase
lower(str)               // Lowercase
capitalize(str)          // Capitalize first letter
truncate(str, len)       // Truncate with ellipsis

// Type checking
is_string(val)           // Check if string
is_number(val)           // Check if number
is_array(val)            // Check if array
is_object(val)           // Check if object
is_function(val)         // Check if function
is_empty(val)            // Check if empty

// Math operations
sum(array)               // Sum of numbers
avg(array)               // Average
min(array)               // Minimum
max(array)               // Maximum
clamp(num, min, max)     // Clamp to range
round(num, decimals)     // Round to decimals
```

## API Reference

### execute(code, env?, options?)

Execute JavaScript code and return the result.

```javascript
const result = await execute(code, env, {
  moduleResolver,        // For import statements
  executionController,   // For pause/resume/abort
  abortSignal            // For cancellation
});
```

### createEnvironment()

Create a new execution environment with built-ins.

```javascript
const env = createEnvironment();
env.define('myVar', 42);
env.define('myFunc', (x) => x * 2);
```

### ModuleResolver

Interface for resolving imports:

```javascript
const moduleResolver = {
  async resolve(modulePath, fromPath) {
    // Return { exports: object } for native modules
    // Return { code: string } for code modules
    // Return null if not found
  },
  async exists(modulePath, fromPath) {
    // Return boolean
  },
  async list(prefix) {
    // Return string[] of module paths
  }
};
```

### ExecutionController

Control execution flow:

```javascript
import { execute, ExecutionController } from 'jslike';

const controller = new ExecutionController();

// Start execution
const promise = execute(code, null, { executionController: controller });

// Control execution
controller.pause();
controller.resume();
controller.abort();

// Check state
console.log(controller.state); // 'running' | 'paused' | 'completed' | 'aborted'
```

## Testing

```bash
npm test                    # Run all tests
npm test -- tests/jsx.test.js  # Run specific test file
```

**1009 tests** covering:
- ES6+ language features
- JSX parsing and execution
- React integration
- Module imports
- Error handling
- Edge cases

## Architecture

```
src/
├── parser.js              - Bundled Acorn + acorn-jsx (~245KB)
├── index.js               - Main API (parse/execute)
├── interpreter/
│   └── interpreter.js     - Tree-walking interpreter (~2500 LOC)
├── runtime/
│   ├── environment.js     - Lexical scoping and closures
│   ├── builtins.js        - Built-in objects and JSX runtime
│   └── execution-controller.js - Pause/resume/abort
└── ast/
    └── nodes.js           - AST node types
```

## Known Limitations

- Generator functions (`function*`, `yield`) not supported
- Tagged template literals not fully supported
- Class getters/setters not fully supported
- Proxies and Reflect API not implemented

## License

MIT

## Links

- [npm package](https://www.npmjs.com/package/jslike)
- [GitHub repository](https://github.com/artpar/jslike)
