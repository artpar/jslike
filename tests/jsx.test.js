import { describe, it, expect } from 'vitest';
import { execute, createEnvironment } from '../src/index.js';

describe('JSX Support', () => {
  describe('Basic Elements', () => {
    it('parses and executes simple JSX element', async () => {
      const result = await execute(`<div>Hello</div>`);
      expect(result.type).toBe('div');
      expect(result.props.children).toBe('Hello');
    });

    it('parses self-closing element', async () => {
      const result = await execute(`<br />`);
      expect(result.type).toBe('br');
      // Props object exists but has no meaningful attributes
      expect(result.props.children).toBe(undefined);
    });

    it('handles multiple children', async () => {
      const result = await execute(`<div>Hello <span>World</span></div>`);
      expect(result.type).toBe('div');
      expect(result.props.children.length).toBe(2);
      expect(result.props.children[0]).toBe('Hello');
      expect(result.props.children[1].type).toBe('span');
    });
  });

  describe('Attributes', () => {
    it('handles string attributes', async () => {
      const result = await execute(`<div className="container" id="main">Content</div>`);
      expect(result.props.className).toBe('container');
      expect(result.props.id).toBe('main');
    });

    it('handles boolean attributes', async () => {
      const result = await execute(`<input disabled />`);
      expect(result.props.disabled).toBe(true);
    });

    it('handles expression attributes', async () => {
      const result = await execute(`
        const cls = "active";
        <div className={cls}>Test</div>
      `);
      expect(result.props.className).toBe('active');
    });

    it('handles spread attributes', async () => {
      const result = await execute(`
        const props = { className: "test", id: "spread" };
        <div {...props}>Content</div>
      `);
      expect(result.props.className).toBe('test');
      expect(result.props.id).toBe('spread');
    });

    it('combines spread with regular attributes', async () => {
      const result = await execute(`
        const props = { className: "base" };
        <div {...props} id="custom">Content</div>
      `);
      expect(result.props.className).toBe('base');
      expect(result.props.id).toBe('custom');
    });
  });

  describe('Expressions', () => {
    it('evaluates expression in children', async () => {
      const result = await execute(`
        const name = "World";
        <div>Hello {name}</div>
      `);
      expect(result.props.children).toContain('World');
    });

    it('evaluates complex expressions', async () => {
      const result = await execute(`
        const x = 5;
        const y = 3;
        <div>{x + y}</div>
      `);
      expect(result.props.children).toBe(8);
    });

    it('handles conditional rendering with &&', async () => {
      const result = await execute(`
        const show = true;
        <div>{show && <span>Visible</span>}</div>
      `);
      expect(result.props.children.type).toBe('span');
    });

    it('filters out false values', async () => {
      const result = await execute(`
        const show = false;
        <div>{show && <span>Hidden</span>}</div>
      `);
      expect(result.props.children).toBe(undefined);
    });

    it('handles ternary expressions', async () => {
      const result = await execute(`
        const condition = true;
        <div>{condition ? "Yes" : "No"}</div>
      `);
      expect(result.props.children).toBe('Yes');
    });
  });

  describe('Fragments', () => {
    it('handles empty fragments', async () => {
      const result = await execute(`<></>`);
      expect(result.type).toBe(Symbol.for('react.fragment'));
    });

    it('handles fragments with children', async () => {
      const result = await execute(`
        <>
          <div>First</div>
          <div>Second</div>
        </>
      `);
      expect(result.type).toBe(Symbol.for('react.fragment'));
      expect(result.props.children.length).toBe(2);
    });
  });

  describe('Components', () => {
    it('creates element with component as type', async () => {
      // Note: Like React, createElement stores the component function as type
      // The component is NOT called - that's the renderer's job
      const result = await execute(`
        function Button({ label }) {
          return <button>{label}</button>;
        }
        <Button label="Click me" />
      `);
      expect(typeof result.type).toBe('function');
      expect(result.props.label).toBe('Click me');
    });

    it('can call component manually to get rendered output', async () => {
      const result = await execute(`
        function Button({ label }) {
          return <button>{label}</button>;
        }
        // Manually call the component to get rendered output
        Button({ label: "Click me" })
      `);
      expect(result.type).toBe('button');
      expect(result.props.children).toBe('Click me');
    });

    it('passes children to component', async () => {
      const result = await execute(`
        function Card({ children }) {
          return <div className="card">{children}</div>;
        }
        <Card><span>Inner content</span></Card>
      `);
      // Component function is stored as type
      expect(typeof result.type).toBe('function');
      // Children are passed as prop
      expect(result.props.children.type).toBe('span');
    });

    it('handles component with multiple props', async () => {
      const result = await execute(`
        function Link({ href, children, className }) {
          return <a href={href} className={className}>{children}</a>;
        }
        <Link href="https://example.com" className="link">Click here</Link>
      `);
      // Component function is stored as type
      expect(typeof result.type).toBe('function');
      expect(result.props.href).toBe('https://example.com');
      expect(result.props.className).toBe('link');
    });
  });

  describe('Array Mapping', () => {
    it('handles array.map in children', async () => {
      const result = await execute(`
        const items = ['a', 'b', 'c'];
        <ul>
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
      `);
      expect(result.type).toBe('ul');
      expect(result.props.children.length).toBe(3);
      expect(result.props.children[0].type).toBe('li');
      expect(result.props.children[0].props.children).toBe('a');
    });

    it('handles array.map with index', async () => {
      const result = await execute(`
        const items = [1, 2, 3];
        <ul>
          {items.map((item, i) => <li key={i}>{item * 2}</li>)}
        </ul>
      `);
      expect(result.props.children[0].props.children).toBe(2);
      expect(result.props.children[1].props.children).toBe(4);
      expect(result.props.children[2].props.children).toBe(6);
    });
  });

  describe('Event Handlers', () => {
    it('passes function as event handler', async () => {
      const result = await execute(`
        const handleClick = () => console.log('clicked');
        <button onClick={handleClick}>Click</button>
      `);
      expect(typeof result.props.onClick).toBe('function');
    });

    it('passes inline arrow function', async () => {
      const result = await execute(`
        <button onClick={() => 42}>Click</button>
      `);
      expect(typeof result.props.onClick).toBe('function');
      expect(result.props.onClick()).toBe(42);
    });
  });

  describe('JSX Element as Attribute', () => {
    it('handles JSX element as attribute value', async () => {
      const result = await execute(`
        const icon = <span>*</span>;
        <button icon={icon}>Click</button>
      `);
      expect(result.props.icon.type).toBe('span');
      expect(result.props.icon.props.children).toBe('*');
    });
  });

  describe('Whitespace Handling', () => {
    it('normalizes whitespace in JSX text', async () => {
      const result = await execute(`
        <div>
          Hello
          World
        </div>
      `);
      // Whitespace should be normalized
      expect(result.type).toBe('div');
    });

    it('preserves significant whitespace', async () => {
      const result = await execute(`<div>Hello World</div>`);
      expect(result.props.children).toBe('Hello World');
    });
  });

  describe('Async in JSX', () => {
    it('handles async expressions in attributes', async () => {
      const result = await execute(`
        async function getData() {
          return "async-data";
        }
        const data = await getData();
        <div data-value={data}>Content</div>
      `);
      expect(result.props['data-value']).toBe('async-data');
    });

    it('handles async in children', async () => {
      const result = await execute(`
        async function fetchText() {
          return "fetched text";
        }
        const text = await fetchText();
        <div>{text}</div>
      `);
      expect(result.props.children).toBe('fetched text');
    });
  });

  describe('Member Expression Components', () => {
    it('handles dotted component names', async () => {
      const result = await execute(`
        const UI = {
          Button: ({ children }) => <button>{children}</button>
        };
        <UI.Button>Click</UI.Button>
      `);
      // Component function is stored as type
      expect(typeof result.type).toBe('function');
      expect(result.props.children).toBe('Click');
    });

    it('can call member component to get rendered output', async () => {
      const result = await execute(`
        const UI = {
          Button: ({ children }) => <button>{children}</button>
        };
        // Call the component directly
        UI.Button({ children: "Click" })
      `);
      expect(result.type).toBe('button');
      expect(result.props.children).toBe('Click');
    });
  });
});
