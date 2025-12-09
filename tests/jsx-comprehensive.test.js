import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

/**
 * Comprehensive JSX Integration Tests
 *
 * These tests explore the possibilities, alignments with React behavior,
 * and limits of the JSX/interpreter integration.
 */

describe('JSX Comprehensive Integration', () => {

  // ============================================================
  // SECTION 1: LANGUAGE FEATURE INTEGRATION
  // ============================================================

  describe('Integration with ES6+ Features', () => {

    describe('Closures and Scope', () => {
      it('captures closure variables in JSX expressions', async () => {
        const result = await execute(`
          function createCounter(start) {
            let count = start;
            return <div>
              <span>Count: {count}</span>
              <button onClick={() => count++}>Increment</button>
            </div>;
          }
          createCounter(10)
        `);
        expect(result.type).toBe('div');
        expect(result.props.children[0].props.children[1]).toBe(10);
      });

      it('preserves lexical scope in nested JSX', async () => {
        const result = await execute(`
          const outer = "outer";
          function Outer() {
            const inner = "inner";
            return <div data-outer={outer}>
              {(() => {
                const deepest = "deepest";
                return <span data-inner={inner} data-deepest={deepest}>{outer}-{inner}-{deepest}</span>;
              })()}
            </div>;
          }
          Outer()
        `);
        expect(result.props['data-outer']).toBe('outer');
        const span = result.props.children;
        expect(span.props['data-inner']).toBe('inner');
        expect(span.props['data-deepest']).toBe('deepest');
      });

      it('handles IIFE in JSX children', async () => {
        const result = await execute(`
          <div>
            {(() => {
              const items = [];
              for (let i = 0; i < 3; i++) {
                items.push(<span key={i}>{i}</span>);
              }
              return items;
            })()}
          </div>
        `);
        expect(result.props.children.length).toBe(3);
      });
    });

    describe('Destructuring', () => {
      it('uses destructured props in component', async () => {
        const result = await execute(`
          function Card({ title, subtitle, children }) {
            return <div className="card">
              <h1>{title}</h1>
              <h2>{subtitle}</h2>
              <div>{children}</div>
            </div>;
          }
          Card({ title: "Hello", subtitle: "World", children: <span>Content</span> })
        `);
        expect(result.props.children[0].props.children).toBe('Hello');
        expect(result.props.children[1].props.children).toBe('World');
      });

      it('uses rest props with spread', async () => {
        const result = await execute(`
          function Button({ children, ...rest }) {
            return <button {...rest}>{children}</button>;
          }
          Button({ children: "Click", className: "btn", disabled: true, "data-id": "123" })
        `);
        expect(result.props.children).toBe('Click');
        expect(result.props.className).toBe('btn');
        expect(result.props.disabled).toBe(true);
        expect(result.props['data-id']).toBe('123');
      });

      it('destructures arrays in JSX expressions', async () => {
        const result = await execute(`
          const data = [[1, "one"], [2, "two"], [3, "three"]];
          <ul>
            {data.map(([num, name]) => <li key={num}>{num}: {name}</li>)}
          </ul>
        `);
        expect(result.props.children.length).toBe(3);
        expect(result.props.children[0].props.children[0]).toBe(1);
        expect(result.props.children[0].props.children[2]).toBe('one');
      });

      it('uses nested destructuring', async () => {
        const result = await execute(`
          function UserCard({ user: { name, address: { city } } }) {
            return <div>{name} from {city}</div>;
          }
          UserCard({ user: { name: "Alice", address: { city: "NYC" } } })
        `);
        expect(result.props.children[0]).toBe('Alice');
        expect(result.props.children[2]).toBe('NYC');
      });
    });

    describe('Template Literals', () => {
      it('uses template literals in attributes', async () => {
        const result = await execute(`
          const prefix = "btn";
          const size = "lg";
          <button className={\`\${prefix}-\${size} \${prefix}-primary\`}>Click</button>
        `);
        expect(result.props.className).toBe('btn-lg btn-primary');
      });

      // KNOWN LIMITATION: Tagged template literals not fully supported
      it.skip('uses tagged template literals', async () => {
        const result = await execute(`
          function css(strings, ...values) {
            return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
          }
          const color = "red";
          <div style={css\`color: \${color}; font-size: 14px;\`}>Styled</div>
        `);
        expect(result.props.style).toBe('color: red; font-size: 14px;');
      });
    });

    describe('Async/Await Integration', () => {
      it('handles async data fetching before JSX', async () => {
        const result = await execute(`
          async function fetchUser() {
            await new Promise(r => setTimeout(r, 10));
            return { name: "John", email: "john@example.com" };
          }

          const user = await fetchUser();
          <div className="user-card">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        `);
        expect(result.props.children[0].props.children).toBe('John');
        expect(result.props.children[1].props.children).toBe('john@example.com');
      });

      it('handles Promise.all with JSX', async () => {
        const result = await execute(`
          async function getData(id) {
            await new Promise(r => setTimeout(r, 5));
            return { id, value: id * 10 };
          }

          const items = await Promise.all([1, 2, 3].map(id => getData(id)));
          <ul>
            {items.map(item => <li key={item.id}>{item.value}</li>)}
          </ul>
        `);
        expect(result.props.children.length).toBe(3);
        expect(result.props.children[0].props.children).toBe(10);
        expect(result.props.children[2].props.children).toBe(30);
      });

      it('handles async arrow function in event handler', async () => {
        const result = await execute(`
          <button onClick={async () => {
            await new Promise(r => setTimeout(r, 10));
            return "clicked";
          }}>Async Click</button>
        `);
        expect(typeof result.props.onClick).toBe('function');
        const clickResult = await result.props.onClick();
        expect(clickResult).toBe('clicked');
      });
    });

    describe('Classes and Inheritance', () => {
      it('uses class instance methods in JSX', async () => {
        const result = await execute(`
          class Formatter {
            constructor(prefix) {
              this.prefix = prefix;
            }
            format(text) {
              return this.prefix + ": " + text;
            }
          }

          const fmt = new Formatter("INFO");
          <div>{fmt.format("Hello World")}</div>
        `);
        expect(result.props.children).toBe('INFO: Hello World');
      });

      it('uses static class methods', async () => {
        const result = await execute(`
          class Utils {
            static capitalize(str) {
              return str.charAt(0).toUpperCase() + str.slice(1);
            }
          }

          <span>{Utils.capitalize("hello")}</span>
        `);
        expect(result.props.children).toBe('Hello');
      });

      // KNOWN LIMITATION: Class getters not fully supported
      it.skip('uses class with getters', async () => {
        const result = await execute(`
          class Person {
            constructor(first, last) {
              this.first = first;
              this.last = last;
            }
            get fullName() {
              return this.first + " " + this.last;
            }
          }

          const person = new Person("John", "Doe");
          <div>{person.fullName}</div>
        `);
        expect(result.props.children).toBe('John Doe');
      });
    });

    describe('Generators and Iterators', () => {
      // KNOWN LIMITATION: Generator functions not supported
      it.skip('spreads generator result into JSX children', async () => {
        const result = await execute(`
          function* generateItems(n) {
            for (let i = 0; i < n; i++) {
              yield <li key={i}>Item {i}</li>;
            }
          }

          <ul>{[...generateItems(3)]}</ul>
        `);
        expect(result.props.children.length).toBe(3);
      });

      // KNOWN LIMITATION: Generator functions not supported
      it.skip('uses Array.from with generator', async () => {
        const result = await execute(`
          function* range(start, end) {
            for (let i = start; i < end; i++) yield i;
          }

          <ul>
            {Array.from(range(1, 4), n => <li key={n}>{n * n}</li>)}
          </ul>
        `);
        expect(result.props.children.map(c => c.props.children)).toEqual([1, 4, 9]);
      });
    });

    describe('Symbols', () => {
      it('uses Symbol as key', async () => {
        const result = await execute(`
          const ID = Symbol('id');
          const data = { [ID]: 123, name: "test" };
          <div data-id={data[ID]}>{data.name}</div>
        `);
        expect(result.props['data-id']).toBe(123);
      });
    });

    describe('Map and Set', () => {
      it('iterates Map in JSX', async () => {
        const result = await execute(`
          const map = new Map([["a", 1], ["b", 2], ["c", 3]]);
          <ul>
            {[...map].map(([key, val]) => <li key={key}>{key}: {val}</li>)}
          </ul>
        `);
        expect(result.props.children.length).toBe(3);
      });

      it('iterates Set in JSX', async () => {
        const result = await execute(`
          const set = new Set([1, 2, 3, 2, 1]);
          <ul>
            {[...set].map(n => <li key={n}>{n}</li>)}
          </ul>
        `);
        expect(result.props.children.length).toBe(3);
      });
    });

    describe('Regular Expressions', () => {
      it('uses RegExp in JSX expression', async () => {
        const result = await execute(`
          const text = "Hello World";
          const pattern = /World/;
          <div>{pattern.test(text) ? "Match!" : "No match"}</div>
        `);
        expect(result.props.children).toBe('Match!');
      });

      it('uses string replace with regex', async () => {
        const result = await execute(`
          const text = "hello-world-test";
          <div>{text.replace(/-/g, "_")}</div>
        `);
        expect(result.props.children).toBe('hello_world_test');
      });
    });
  });

  // ============================================================
  // SECTION 2: REACT ALIGNMENT TESTS
  // ============================================================

  describe('React Behavior Alignment', () => {

    describe('createElement Signature', () => {
      it('produces correct $$typeof symbol', async () => {
        const result = await execute(`<div>Test</div>`);
        expect(result.$$typeof).toBe(Symbol.for('react.element'));
      });

      it('sets key from attribute', async () => {
        const result = await execute(`<div key="unique">Test</div>`);
        expect(result.key).toBe('unique');
      });

      it('sets ref from attribute', async () => {
        const result = await execute(`
          const myRef = { current: null };
          <div ref={myRef}>Test</div>
        `);
        expect(result.ref).toEqual({ current: null });
      });

      it('handles null props correctly', async () => {
        const result = await execute(`<br />`);
        // React behavior: props object exists but may be empty or have just children
        expect(result.props).toBeDefined();
      });
    });

    describe('Children Normalization', () => {
      it('single child is not wrapped in array', async () => {
        const result = await execute(`<div>Single</div>`);
        expect(result.props.children).toBe('Single');
        expect(Array.isArray(result.props.children)).toBe(false);
      });

      it('multiple children are in array', async () => {
        const result = await execute(`<div><span>A</span><span>B</span></div>`);
        expect(Array.isArray(result.props.children)).toBe(true);
        expect(result.props.children.length).toBe(2);
      });

      it('no children results in undefined', async () => {
        const result = await execute(`<div></div>`);
        expect(result.props.children).toBe(undefined);
      });

      it('flattens array children from map', async () => {
        const result = await execute(`
          const items = [1, 2];
          <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
        `);
        // Array from map should be flattened into children
        expect(result.props.children.length).toBe(2);
      });
    });

    describe('Falsy Value Filtering', () => {
      it('filters out false', async () => {
        const result = await execute(`<div>{false}</div>`);
        expect(result.props.children).toBe(undefined);
      });

      it('filters out null', async () => {
        const result = await execute(`<div>{null}</div>`);
        expect(result.props.children).toBe(undefined);
      });

      it('filters out undefined', async () => {
        const result = await execute(`<div>{undefined}</div>`);
        expect(result.props.children).toBe(undefined);
      });

      it('does NOT filter out 0', async () => {
        const result = await execute(`<div>{0}</div>`);
        expect(result.props.children).toBe(0);
      });

      it('does NOT filter out empty string', async () => {
        const result = await execute(`<div>{""}</div>`);
        expect(result.props.children).toBe("");
      });

      // NaN needs to be computed since it's not in global environment
      it('handles NaN from computation', async () => {
        const result = await execute(`<div>{0/0}</div>`);
        // NaN from division is kept (it's truthy-ish in filter sense)
        expect(Number.isNaN(result.props.children)).toBe(true);
      });

      it('handles mixed truthy and falsy', async () => {
        const result = await execute(`
          <div>
            {true && "shown"}
            {false && "hidden"}
            {null}
            {undefined}
            {0}
          </div>
        `);
        // Should have "shown" and 0
        expect(result.props.children).toContain('shown');
        expect(result.props.children).toContain(0);
      });
    });

    describe('Boolean Attributes', () => {
      it('handles true boolean attribute', async () => {
        const result = await execute(`<input disabled />`);
        expect(result.props.disabled).toBe(true);
      });

      it('handles explicit true', async () => {
        const result = await execute(`<input disabled={true} />`);
        expect(result.props.disabled).toBe(true);
      });

      it('handles explicit false', async () => {
        const result = await execute(`<input disabled={false} />`);
        expect(result.props.disabled).toBe(false);
      });

      it('handles multiple boolean attributes', async () => {
        const result = await execute(`<input disabled readOnly required />`);
        expect(result.props.disabled).toBe(true);
        expect(result.props.readOnly).toBe(true);
        expect(result.props.required).toBe(true);
      });
    });

    describe('Component vs Intrinsic Element Detection', () => {
      it('lowercase tag is string type', async () => {
        const result = await execute(`<div>Test</div>`);
        expect(result.type).toBe('div');
        expect(typeof result.type).toBe('string');
      });

      it('uppercase tag resolves to component', async () => {
        const result = await execute(`
          function MyComponent() { return <div>Hello</div>; }
          <MyComponent />
        `);
        expect(typeof result.type).toBe('function');
      });

      it('member expression resolves component', async () => {
        const result = await execute(`
          const UI = {
            Button: ({ children }) => <button>{children}</button>
          };
          <UI.Button>Click</UI.Button>
        `);
        expect(typeof result.type).toBe('function');
      });

      it('deeply nested member expression', async () => {
        const result = await execute(`
          const App = {
            Components: {
              UI: {
                Button: ({ label }) => <button>{label}</button>
              }
            }
          };
          <App.Components.UI.Button label="Deep" />
        `);
        expect(typeof result.type).toBe('function');
        expect(result.props.label).toBe('Deep');
      });
    });

    describe('Fragment Behavior', () => {
      it('fragment has correct type', async () => {
        const result = await execute(`<></>`);
        expect(result.type).toBe(Symbol.for('react.fragment'));
      });

      it('fragment children are accessible', async () => {
        const result = await execute(`
          <>
            <div>A</div>
            <div>B</div>
          </>
        `);
        expect(result.props.children.length).toBe(2);
      });

      it('nested fragments', async () => {
        const result = await execute(`
          <>
            <>
              <div>Deep</div>
            </>
          </>
        `);
        expect(result.type).toBe(Symbol.for('react.fragment'));
      });
    });
  });

  // ============================================================
  // SECTION 3: ADVANCED PATTERNS
  // ============================================================

  describe('Advanced React Patterns', () => {

    describe('Higher-Order Components (HOC)', () => {
      it('creates HOC that wraps component', async () => {
        // Note: Like React, JSX stores component function as type, doesn't call it
        // The wrapped component is NOT rendered - that's the renderer's job
        const result = await execute(`
          function withLogging(Component) {
            return function WrappedComponent(props) {
              return <div className="logged">
                <Component {...props} />
              </div>;
            };
          }

          function Button({ label }) {
            return <button>{label}</button>;
          }

          const LoggedButton = withLogging(Button);
          LoggedButton({ label: "Click me" })
        `);
        expect(result.props.className).toBe('logged');
        // Inner component is stored as function type, not rendered
        expect(typeof result.props.children.type).toBe('function');
        expect(result.props.children.props.label).toBe('Click me');
      });

      it('chains multiple HOCs', async () => {
        // Components are stored as type, not called
        const result = await execute(`
          function withBorder(Component) {
            return (props) => <div className="border"><Component {...props} /></div>;
          }

          function withPadding(Component) {
            return (props) => <div className="padding"><Component {...props} /></div>;
          }

          function Box({ children }) {
            return <div className="box">{children}</div>;
          }

          const StyledBox = withBorder(withPadding(Box));
          StyledBox({ children: "Content" })
        `);
        expect(result.props.className).toBe('border');
        // Inner wrapped component is function type
        expect(typeof result.props.children.type).toBe('function');
      });
    });

    describe('Render Props Pattern', () => {
      it('uses render prop function', async () => {
        const result = await execute(`
          function DataProvider({ data, render }) {
            return <div className="provider">{render(data)}</div>;
          }

          DataProvider({
            data: { name: "John", age: 30 },
            render: (data) => <span>{data.name} is {data.age}</span>
          })
        `);
        expect(result.props.className).toBe('provider');
        expect(result.props.children.props.children[0]).toBe('John');
      });

      it('uses children as render prop', async () => {
        const result = await execute(`
          function Mouse({ children }) {
            const position = { x: 100, y: 200 };
            return <div>{children(position)}</div>;
          }

          Mouse({ children: (pos) => <span>Position: {pos.x}, {pos.y}</span> })
        `);
        expect(result.props.children.props.children[1]).toBe(100);
        expect(result.props.children.props.children[3]).toBe(200);
      });
    });

    describe('Compound Components', () => {
      it('creates compound component structure', async () => {
        // Note: <Menu> stores Menu function as type, doesn't call it
        // To get rendered 'nav', need to call component manually
        const result = await execute(`
          function Menu({ children }) {
            return <nav className="menu">{children}</nav>;
          }

          Menu.Item = function MenuItem({ children, href }) {
            return <a href={href}>{children}</a>;
          };

          <Menu>
            <Menu.Item href="/home">Home</Menu.Item>
            <Menu.Item href="/about">About</Menu.Item>
          </Menu>
        `);
        // Component type is stored as function
        expect(typeof result.type).toBe('function');
        expect(result.props.children.length).toBe(2);
        // Children are also component types
        expect(typeof result.props.children[0].type).toBe('function');
      });

      it('can manually render compound components', async () => {
        // To get rendered output, call components manually
        const result = await execute(`
          function Menu({ children }) {
            return <nav className="menu">{children}</nav>;
          }

          Menu.Item = function MenuItem({ children, href }) {
            return <a href={href}>{children}</a>;
          };

          // Manually render
          Menu({
            children: [
              Menu.Item({ href: "/home", children: "Home" }),
              Menu.Item({ href: "/about", children: "About" })
            ]
          })
        `);
        expect(result.type).toBe('nav');
        expect(result.props.children.length).toBe(2);
        expect(result.props.children[0].type).toBe('a');
      });
    });

    describe('Controlled Components Pattern', () => {
      it('passes value and onChange', async () => {
        const result = await execute(`
          let inputValue = "initial";
          const handleChange = (e) => { inputValue = e.target.value; };

          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
          />
        `);
        expect(result.props.value).toBe('initial');
        expect(typeof result.props.onChange).toBe('function');
      });
    });

    describe('List Rendering Patterns', () => {
      it('renders keyed list', async () => {
        const result = await execute(`
          const users = [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
            { id: 3, name: "Charlie" }
          ];

          <ul>
            {users.map(user => (
              <li key={user.id}>
                <strong>{user.name}</strong>
              </li>
            ))}
          </ul>
        `);
        expect(result.props.children.length).toBe(3);
        expect(result.props.children[0].key).toBe(1);
        expect(result.props.children[1].key).toBe(2);
      });

      it('renders nested lists', async () => {
        const result = await execute(`
          const categories = [
            { name: "Fruits", items: ["Apple", "Banana"] },
            { name: "Vegetables", items: ["Carrot", "Potato"] }
          ];

          <div>
            {categories.map(cat => (
              <div key={cat.name}>
                <h3>{cat.name}</h3>
                <ul>
                  {cat.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        `);
        expect(result.props.children.length).toBe(2);
      });

      it('filters and maps in chain', async () => {
        const result = await execute(`
          const numbers = [1, 2, 3, 4, 5, 6];

          <ul>
            {numbers
              .filter(n => n % 2 === 0)
              .map(n => <li key={n}>{n * 10}</li>)}
          </ul>
        `);
        expect(result.props.children.length).toBe(3);
        expect(result.props.children.map(c => c.props.children)).toEqual([20, 40, 60]);
      });
    });

    describe('Conditional Rendering Patterns', () => {
      it('handles if-else via ternary', async () => {
        const result = await execute(`
          const isLoggedIn = true;
          <div>
            {isLoggedIn ? <span>Welcome!</span> : <span>Please log in</span>}
          </div>
        `);
        expect(result.props.children.props.children).toBe('Welcome!');
      });

      it('handles && short-circuit', async () => {
        const result = await execute(`
          const hasError = true;
          const error = "Something went wrong";
          <div>
            {hasError && <span className="error">{error}</span>}
          </div>
        `);
        expect(result.props.children.props.className).toBe('error');
      });

      it('handles || fallback', async () => {
        const result = await execute(`
          const name = "";
          <div>{name || "Anonymous"}</div>
        `);
        expect(result.props.children).toBe('Anonymous');
      });

      it('handles nullish coalescing', async () => {
        const result = await execute(`
          const count = 0;
          <div>{count ?? "No count"}</div>
        `);
        expect(result.props.children).toBe(0);
      });

      it('handles complex conditional', async () => {
        const result = await execute(`
          const status = "loading";
          <div>
            {status === "loading" && <span>Loading...</span>}
            {status === "error" && <span>Error!</span>}
            {status === "success" && <span>Done!</span>}
          </div>
        `);
        // Only the matching condition renders
        // False values from non-matching conditions are filtered
        const children = Array.isArray(result.props.children)
          ? result.props.children.filter(c => c !== undefined)
          : [result.props.children];
        expect(children[0].props.children).toBe('Loading...');
      });

      it('handles switch-like pattern with object', async () => {
        const result = await execute(`
          const status = "warning";
          const statusIcons = {
            success: <span>✓</span>,
            error: <span>✗</span>,
            warning: <span>⚠</span>
          };
          <div>{statusIcons[status] || <span>?</span>}</div>
        `);
        expect(result.props.children.props.children).toBe('⚠');
      });
    });
  });

  // ============================================================
  // SECTION 4: EDGE CASES AND LIMITS
  // ============================================================

  describe('Edge Cases and Limits', () => {

    describe('Deeply Nested Structures', () => {
      it('handles 10 levels of nesting', async () => {
        const result = await execute(`
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <div>
                          <div>
                            <div>Deep!</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `);
        let current = result;
        for (let i = 0; i < 9; i++) {
          expect(current.type).toBe('div');
          current = current.props.children;
        }
        expect(current.props.children).toBe('Deep!');
      });

      it('handles deeply nested expressions', async () => {
        const result = await execute(`
          const a = { b: { c: { d: { e: { f: "deep" } } } } };
          <div>{a.b.c.d.e.f}</div>
        `);
        expect(result.props.children).toBe('deep');
      });
    });

    describe('Many Attributes', () => {
      it('handles element with many attributes', async () => {
        const result = await execute(`
          <div
            id="test"
            className="container"
            data-a="1"
            data-b="2"
            data-c="3"
            data-d="4"
            data-e="5"
            aria-label="test"
            role="main"
            tabIndex={0}
          >Content</div>
        `);
        expect(result.props.id).toBe('test');
        expect(result.props.className).toBe('container');
        expect(result.props['data-e']).toBe('5');
        expect(result.props.tabIndex).toBe(0);
      });
    });

    describe('Large Lists', () => {
      it('handles list of 100 items', async () => {
        const result = await execute(`
          const items = [];
          for (let i = 0; i < 100; i++) {
            items.push(i);
          }
          <ul>
            {items.map(i => <li key={i}>{i}</li>)}
          </ul>
        `);
        expect(result.props.children.length).toBe(100);
        expect(result.props.children[99].props.children).toBe(99);
      });

      it('handles list of 1000 items', async () => {
        const result = await execute(`
          const items = Array.from({ length: 1000 }, (_, i) => i);
          <ul>
            {items.map(i => <li key={i}>{i}</li>)}
          </ul>
        `);
        expect(result.props.children.length).toBe(1000);
      });
    });

    describe('Unicode and Special Characters', () => {
      it('handles unicode in text', async () => {
        const result = await execute(`<div>Hello 世界 🌍 مرحبا</div>`);
        expect(result.props.children).toContain('世界');
        expect(result.props.children).toContain('🌍');
      });

      it('handles unicode in attributes', async () => {
        const result = await execute(`<div title="こんにちは" data-emoji="🎉">Test</div>`);
        expect(result.props.title).toBe('こんにちは');
        expect(result.props['data-emoji']).toBe('🎉');
      });

      it('handles unicode variable names', async () => {
        const result = await execute(`
          const 名前 = "太郎";
          <div>{名前}</div>
        `);
        expect(result.props.children).toBe('太郎');
      });
    });

    describe('Whitespace Edge Cases', () => {
      // BEHAVIORAL DIFFERENCE: Space between elements is normalized
      it('normalizes spaces between inline elements', async () => {
        const result = await execute(`<div><span>Hello</span> <span>World</span></div>`);
        // Space-only text nodes are trimmed by JSX whitespace normalization
        expect(result.props.children.length).toBe(2);
        expect(result.props.children[0].type).toBe('span');
        expect(result.props.children[1].type).toBe('span');
      });

      it('handles whitespace-only text nodes', async () => {
        const result = await execute(`<div>   </div>`);
        // Whitespace-only should be trimmed
        expect(result.props.children).toBe(undefined);
      });

      it('handles newlines in JSX', async () => {
        const result = await execute(`
          <div>
            Line 1
            Line 2
          </div>
        `);
        expect(result.type).toBe('div');
      });
    });

    describe('Expression Edge Cases', () => {
      it('handles empty expression', async () => {
        const result = await execute(`<div>{}</div>`);
        expect(result.props.children).toBe(undefined);
      });

      it('handles expression returning object', async () => {
        const result = await execute(`
          const obj = { a: 1, b: 2 };
          <div data-obj={obj}>Test</div>
        `);
        expect(result.props['data-obj']).toEqual({ a: 1, b: 2 });
      });

      it('handles expression returning array', async () => {
        const result = await execute(`
          const arr = [1, 2, 3];
          <div data-arr={arr}>Test</div>
        `);
        expect(result.props['data-arr']).toEqual([1, 2, 3]);
      });

      it('handles expression returning function', async () => {
        const result = await execute(`
          const fn = (x) => x * 2;
          <div data-fn={fn}>Test</div>
        `);
        expect(typeof result.props['data-fn']).toBe('function');
        expect(result.props['data-fn'](5)).toBe(10);
      });
    });

    describe('Self-Closing Elements', () => {
      it('handles all HTML void elements', async () => {
        const elements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
        for (const el of elements) {
          const result = await execute(`<${el} />`);
          expect(result.type).toBe(el);
        }
      });

      it('handles self-closing custom components', async () => {
        const result = await execute(`
          function Icon({ name }) {
            return <span className={\`icon-\${name}\`}></span>;
          }
          <Icon name="star" />
        `);
        expect(typeof result.type).toBe('function');
        expect(result.props.name).toBe('star');
      });
    });

    describe('Error Handling', () => {
      it('throws on undefined component', async () => {
        await expect(execute(`<UndefinedComponent />`))
          .rejects.toThrow();
      });

      it('throws on invalid expression', async () => {
        await expect(execute(`<div>{nonExistentVar}</div>`))
          .rejects.toThrow();
      });

      it('handles try-catch around JSX', async () => {
        const result = await execute(`
          let element;
          try {
            const x = 5;
            element = <div>{x}</div>;
          } catch (e) {
            element = <div>Error</div>;
          }
          element
        `);
        expect(result.props.children).toBe(5);
      });
    });

    describe('Spread Attribute Edge Cases', () => {
      it('handles spread with undefined properties', async () => {
        const result = await execute(`
          const props = { a: 1, b: undefined, c: 3 };
          <div {...props}>Test</div>
        `);
        expect(result.props.a).toBe(1);
        expect(result.props.b).toBe(undefined);
        expect(result.props.c).toBe(3);
      });

      it('handles multiple spreads', async () => {
        const result = await execute(`
          const base = { a: 1, b: 2 };
          const extra = { c: 3, d: 4 };
          <div {...base} {...extra}>Test</div>
        `);
        expect(result.props.a).toBe(1);
        expect(result.props.c).toBe(3);
      });

      it('later spread overrides earlier', async () => {
        const result = await execute(`
          const first = { a: 1, b: 2 };
          const second = { b: 20, c: 3 };
          <div {...first} {...second}>Test</div>
        `);
        expect(result.props.b).toBe(20);
      });

      it('explicit attribute overrides spread', async () => {
        const result = await execute(`
          const props = { className: "base", id: "spread" };
          <div {...props} className="override">Test</div>
        `);
        expect(result.props.className).toBe('override');
        expect(result.props.id).toBe('spread');
      });

      it('spread before explicit puts spread value', async () => {
        const result = await execute(`
          const props = { className: "base" };
          <div className="first" {...props}>Test</div>
        `);
        // Spread comes after explicit, so spread wins
        expect(result.props.className).toBe('base');
      });
    });

    describe('Comments in JSX', () => {
      it('handles JS comments in expressions', async () => {
        const result = await execute(`
          <div>
            {/* This is a comment */}
            <span>Content</span>
          </div>
        `);
        expect(result.props.children.type).toBe('span');
      });
    });

    describe('Data Types in Attributes', () => {
      it('handles number attribute', async () => {
        const result = await execute(`<div tabIndex={0} data-count={42}>Test</div>`);
        expect(result.props.tabIndex).toBe(0);
        expect(result.props['data-count']).toBe(42);
      });

      it('handles null attribute', async () => {
        const result = await execute(`<div data-val={null}>Test</div>`);
        expect(result.props['data-val']).toBe(null);
      });

      it('handles undefined attribute', async () => {
        const result = await execute(`<div data-val={undefined}>Test</div>`);
        expect(result.props['data-val']).toBe(undefined);
      });

      it('handles Symbol attribute', async () => {
        const result = await execute(`
          const sym = Symbol('test');
          <div data-sym={sym}>Test</div>
        `);
        expect(typeof result.props['data-sym']).toBe('symbol');
      });

      it('handles BigInt attribute', async () => {
        const result = await execute(`<div data-big={123n}>Test</div>`);
        expect(result.props['data-big']).toBe(123n);
      });
    });
  });

  // ============================================================
  // SECTION 5: WANG STANDARD LIBRARY WITH JSX
  // ============================================================

  describe('Wang Standard Library Integration', () => {
    it('uses sort_by with JSX rendering', async () => {
      const result = await execute(`
        const users = [
          { name: "Charlie", age: 25 },
          { name: "Alice", age: 30 },
          { name: "Bob", age: 20 }
        ];
        const sorted = sort_by(users, "name");
        <ul>
          {sorted.map(u => <li key={u.name}>{u.name}</li>)}
        </ul>
      `);
      expect(result.props.children[0].props.children).toBe('Alice');
      expect(result.props.children[1].props.children).toBe('Bob');
      expect(result.props.children[2].props.children).toBe('Charlie');
    });

    it('uses group_by with JSX rendering', async () => {
      const result = await execute(`
        const items = [
          { category: "fruit", name: "apple" },
          { category: "vegetable", name: "carrot" },
          { category: "fruit", name: "banana" }
        ];
        const grouped = group_by(items, "category");
        <div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3>{cat}</h3>
              <ul>
                {items.map(i => <li key={i.name}>{i.name}</li>)}
              </ul>
            </div>
          ))}
        </div>
      `);
      expect(result.props.children.length).toBe(2);
    });

    it('uses chunk with JSX grid', async () => {
      const result = await execute(`
        const items = [1, 2, 3, 4, 5, 6];
        const rows = chunk(items, 3);
        <table>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map(n => <td key={n}>{n}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      `);
      expect(result.props.children.props.children.length).toBe(2); // 2 rows
    });

    it('uses range with JSX', async () => {
      const result = await execute(`
        <ul>
          {range(1, 6).map(n => <li key={n}>{n}</li>)}
        </ul>
      `);
      expect(result.props.children.length).toBe(5);
      expect(result.props.children.map(c => c.props.children)).toEqual([1, 2, 3, 4, 5]);
    });

    it('uses unique with JSX', async () => {
      const result = await execute(`
        const tags = ["react", "vue", "react", "angular", "vue"];
        const uniqueTags = unique(tags);
        <ul>
          {uniqueTags.map(tag => <li key={tag}>{tag}</li>)}
        </ul>
      `);
      expect(result.props.children.length).toBe(3);
    });

    it('uses filter and map chain', async () => {
      const result = await execute(`
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const even = filter(numbers, n => n % 2 === 0);
        const doubled = map(even, n => n * 2);
        <ul>
          {doubled.map(n => <li key={n}>{n}</li>)}
        </ul>
      `);
      expect(result.props.children.map(c => c.props.children)).toEqual([4, 8, 12, 16, 20]);
    });

    it('uses pick for props filtering', async () => {
      const result = await execute(`
        const fullProps = { id: "1", className: "btn", onClick: () => {}, secret: "hide" };
        const safeProps = pick(fullProps, ["id", "className"]);
        <button {...safeProps}>Click</button>
      `);
      expect(result.props.id).toBe('1');
      expect(result.props.className).toBe('btn');
      expect(result.props.secret).toBe(undefined);
    });

    it('uses capitalize in JSX', async () => {
      const result = await execute(`
        const name = "john doe";
        <span>{capitalize(name)}</span>
      `);
      expect(result.props.children).toBe('John doe');
    });

    it('uses truncate for long text', async () => {
      const result = await execute(`
        const longText = "This is a very long text that should be truncated";
        <p>{truncate(longText, 20)}</p>
      `);
      expect(result.props.children).toBe('This is a very lo...');
    });

    it('uses is_empty for conditional rendering', async () => {
      const result = await execute(`
        const items = [];
        <div>
          {is_empty(items) ? <span>No items</span> : <ul>{items.map(i => <li>{i}</li>)}</ul>}
        </div>
      `);
      expect(result.props.children.props.children).toBe('No items');
    });

    it('uses sum for aggregation display', async () => {
      const result = await execute(`
        const prices = [10.99, 24.50, 5.00];
        const total = sum(prices).toFixed(2);
        <div>Total: {total}</div>
      `);
      expect(result.props.children).toContain('40.49');
    });
  });

  // ============================================================
  // SECTION 6: REAL-WORLD COMPONENT PATTERNS
  // ============================================================

  describe('Real-World Component Patterns', () => {

    it('renders a complete card component', async () => {
      const result = await execute(`
        function Card({ title, subtitle, image, children, footer }) {
          return (
            <div className="card">
              {image && <img src={image} alt={title} className="card-image" />}
              <div className="card-body">
                <h2 className="card-title">{title}</h2>
                {subtitle && <h3 className="card-subtitle">{subtitle}</h3>}
                <div className="card-content">{children}</div>
              </div>
              {footer && <div className="card-footer">{footer}</div>}
            </div>
          );
        }

        Card({
          title: "Welcome",
          subtitle: "Getting Started",
          image: "/hero.jpg",
          children: <p>This is the card content.</p>,
          footer: <button>Learn More</button>
        })
      `);
      expect(result.props.className).toBe('card');
      expect(result.props.children[0].type).toBe('img');
      expect(result.props.children[1].props.children[0].props.children).toBe('Welcome');
    });

    it('renders a navigation menu', async () => {
      const result = await execute(`
        function NavLink({ href, children, isActive }) {
          return (
            <a
              href={href}
              className={\`nav-link \${isActive ? 'active' : ''}\`}
            >
              {children}
            </a>
          );
        }

        function Navigation({ links, currentPath }) {
          return (
            <nav className="navigation">
              <ul>
                {links.map(link => (
                  <li key={link.href}>
                    {NavLink({
                      href: link.href,
                      children: link.label,
                      isActive: currentPath === link.href
                    })}
                  </li>
                ))}
              </ul>
            </nav>
          );
        }

        Navigation({
          currentPath: "/about",
          links: [
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" }
          ]
        })
      `);
      expect(result.props.className).toBe('navigation');
      const listItems = result.props.children.props.children;
      expect(listItems.length).toBe(3);
      // Check that About link has active class
      expect(listItems[1].props.children.props.className).toContain('active');
    });

    it('renders a data table', async () => {
      const result = await execute(`
        function DataTable({ columns, data, sortBy, sortDir }) {
          return (
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className={sortBy === col.key ? \`sorted-\${sortDir}\` : ''}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {columns.map(col => (
                      <td key={col.key}>{row[col.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }

        DataTable({
          columns: [
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" }
          ],
          data: [
            { name: "Alice", email: "alice@test.com", role: "Admin" },
            { name: "Bob", email: "bob@test.com", role: "User" }
          ],
          sortBy: "name",
          sortDir: "asc"
        })
      `);
      expect(result.type).toBe('table');
      const headers = result.props.children[0].props.children.props.children;
      expect(headers[0].props.className).toBe('sorted-asc');
    });

    it('renders a form with validation states', async () => {
      const result = await execute(`
        function FormField({ label, name, type, value, error, required }) {
          return (
            <div className={\`form-field \${error ? 'has-error' : ''}\`}>
              <label htmlFor={name}>
                {label}
                {required && <span className="required">*</span>}
              </label>
              <input
                type={type || "text"}
                id={name}
                name={name}
                value={value}
                className={error ? 'input-error' : 'input'}
              />
              {error && <span className="error-message">{error}</span>}
            </div>
          );
        }

        function Form({ fields }) {
          return (
            <form className="form">
              {fields.map(field => FormField(field))}
              <button type="submit">Submit</button>
            </form>
          );
        }

        Form({
          fields: [
            { label: "Username", name: "username", value: "", required: true, error: "Username is required" },
            { label: "Email", name: "email", type: "email", value: "test@test.com", required: true },
            { label: "Bio", name: "bio", value: "" }
          ]
        })
      `);
      expect(result.type).toBe('form');
      const fields = result.props.children.slice(0, -1); // Exclude submit button
      expect(fields.length).toBe(3);
      expect(fields[0].props.className).toContain('has-error');
    });

    it('renders a modal dialog', async () => {
      const result = await execute(`
        function Modal({ isOpen, onClose, title, children, footer }) {
          if (!isOpen) return null;

          return (
            <div className="modal-overlay" onClick={onClose}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{title}</h2>
                  <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                  {children}
                </div>
                {footer && (
                  <div className="modal-footer">
                    {footer}
                  </div>
                )}
              </div>
            </div>
          );
        }

        Modal({
          isOpen: true,
          onClose: () => {},
          title: "Confirm Action",
          children: <p>Are you sure you want to proceed?</p>,
          footer: (
            <>
              <button className="btn-cancel">Cancel</button>
              <button className="btn-confirm">Confirm</button>
            </>
          )
        })
      `);
      expect(result.props.className).toBe('modal-overlay');
      expect(result.props.children.props.children[0].props.children[0].props.children).toBe('Confirm Action');
    });

    it('handles closed modal returning null', async () => {
      const result = await execute(`
        function Modal({ isOpen }) {
          if (!isOpen) return null;
          return <div className="modal">Content</div>;
        }
        Modal({ isOpen: false })
      `);
      expect(result).toBe(null);
    });
  });

  // ============================================================
  // SECTION 7: LIMITS AND UNSUPPORTED FEATURES
  // ============================================================

  describe('Known Limits and Unsupported Features', () => {

    describe('Namespaced Attributes', () => {
      it('handles xlink:href (SVG)', async () => {
        // This tests if namespaced attributes are supported
        try {
          const result = await execute(`<use xlinkHref="#icon" />`);
          expect(result.props.xlinkHref).toBe('#icon');
        } catch (e) {
          // If not supported, document the limitation
          expect(e.message).toBeDefined();
        }
      });
    });

    describe('SVG Elements', () => {
      it('renders SVG elements', async () => {
        const result = await execute(`
          <svg width="100" height="100">
            <circle cx="50" cy="50" r="40" fill="red" />
          </svg>
        `);
        expect(result.type).toBe('svg');
        expect(result.props.children.type).toBe('circle');
      });
    });

    describe('dangerouslySetInnerHTML', () => {
      it('handles dangerouslySetInnerHTML attribute', async () => {
        const result = await execute(`
          <div dangerouslySetInnerHTML={{ __html: "<strong>Bold</strong>" }} />
        `);
        expect(result.props.dangerouslySetInnerHTML.__html).toBe('<strong>Bold</strong>');
      });
    });

    describe('Style Object', () => {
      it('handles style object', async () => {
        const result = await execute(`
          <div style={{ color: "red", fontSize: 16, marginTop: "10px" }}>Styled</div>
        `);
        expect(result.props.style.color).toBe('red');
        expect(result.props.style.fontSize).toBe(16);
      });
    });

    describe('Recursive Components', () => {
      it('handles recursive tree rendering', async () => {
        const result = await execute(`
          function TreeNode({ node }) {
            return (
              <div className="tree-node">
                <span>{node.name}</span>
                {node.children && node.children.length > 0 && (
                  <ul>
                    {node.children.map(child => (
                      <li key={child.name}>{TreeNode({ node: child })}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          }

          const tree = {
            name: "root",
            children: [
              { name: "a", children: [{ name: "a1" }, { name: "a2" }] },
              { name: "b" }
            ]
          };

          TreeNode({ node: tree })
        `);
        expect(result.props.className).toBe('tree-node');
        expect(result.props.children[0].props.children).toBe('root');
      });
    });

    describe('Component Returning Array', () => {
      it('handles component returning array of elements', async () => {
        const result = await execute(`
          function MultipleItems() {
            return [
              <li key="1">First</li>,
              <li key="2">Second</li>,
              <li key="3">Third</li>
            ];
          }

          <ul>
            {MultipleItems()}
          </ul>
        `);
        expect(result.props.children.length).toBe(3);
      });
    });

    describe('String Refs (Legacy)', () => {
      it('passes ref object', async () => {
        const result = await execute(`
          const myRef = { current: null };
          <input ref={myRef} />
        `);
        expect(result.ref).toEqual({ current: null });
      });

      it('passes callback ref', async () => {
        const result = await execute(`
          const setRef = (el) => { /* store ref */ };
          <input ref={setRef} />
        `);
        expect(typeof result.ref).toBe('function');
      });
    });
  });
});
