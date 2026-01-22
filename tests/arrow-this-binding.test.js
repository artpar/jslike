// Test for arrow function lexical 'this' binding - GitHub Issue #3
import { describe, it, expect, vi } from 'vitest';
import { execute, WangInterpreter } from '../src/index.js';

describe('Arrow Function this Binding', () => {
  it('arrow function should capture this from enclosing method', async () => {
    const interpreter = new WangInterpreter({});

    const code = `
      const obj = {
        name: 'TestObject',
        method: function() {
          const arrow = () => this.name;
          return arrow();
        }
      };
      obj.method();
    `;

    const result = await interpreter.execute(code);
    expect(result).toBe('TestObject');
  });

  it('arrow function should preserve this in setTimeout callback', async () => {
    const interpreter = new WangInterpreter({});

    let capturedValue = null;
    interpreter.setVariable('capture', (val) => { capturedValue = val; });
    interpreter.setVariable('setTimeout', setTimeout);

    const code = `
      const obj = {
        name: 'AsyncTest',
        method: function() {
          setTimeout(() => {
            capture(this.name);
          }, 10);
        }
      };
      obj.method();
    `;

    await interpreter.execute(code);

    // Wait for setTimeout callback
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(capturedValue).toBe('AsyncTest');
  });

  it('nested arrow functions should all capture outer this', async () => {
    const interpreter = new WangInterpreter({});

    const code = `
      const obj = {
        value: 42,
        method: function() {
          const arrow1 = () => {
            const arrow2 = () => this.value;
            return arrow2();
          };
          return arrow1();
        }
      };
      obj.method();
    `;

    const result = await interpreter.execute(code);
    expect(result).toBe(42);
  });

  it('arrow function preserves this when passed as callback', async () => {
    const interpreter = new WangInterpreter({});

    let results = [];
    interpreter.setVariable('runCallback', (cb) => {
      results.push(cb());
    });

    const code = `
      const obj = {
        items: ['a', 'b', 'c'],
        process: function() {
          const arrow = () => this.items.length;
          runCallback(arrow);
        }
      };
      obj.process();
    `;

    await interpreter.execute(code);
    expect(results).toEqual([3]);
  });

  it('arrow function this differs from regular function this', async () => {
    const interpreter = new WangInterpreter({});

    let arrowThis = null;
    let regularThis = null;
    interpreter.setVariable('captureArrow', (val) => { arrowThis = val; });
    interpreter.setVariable('captureRegular', (val) => { regularThis = val; });
    interpreter.setVariable('callWith', (fn, ctx) => fn.call(ctx));

    const code = `
      const obj = {
        name: 'outer',
        test: function() {
          const arrow = () => captureArrow(this.name);
          const regular = function() { captureRegular(this.name); };

          const other = { name: 'other' };
          callWith(arrow, other);    // Arrow should use 'outer' (lexical)
          callWith(regular, other);  // Regular should use 'other' (call-site)
        }
      };
      obj.test();
    `;

    await interpreter.execute(code);
    expect(arrowThis).toBe('outer');
    expect(regularThis).toBe('other');
  });

  it('issue #3: handleCopy scenario with setTimeout', async () => {
    const interpreter = new WangInterpreter({});
    interpreter.setVariable('setTimeout', setTimeout);

    let callbackThisWorked = false;
    let callbackError = null;

    interpreter.setVariable('markCallbackThis', () => { callbackThisWorked = true; });
    interpreter.setVariable('markError', (err) => { callbackError = err; });

    const code = `
      function handleCopy() {
        this.innerText = '✓ Copied!';
        this.style.background = '#17bf63';
        setTimeout(() => {
          try {
            this.innerText = 'Copy';
            this.style.background = '#1d9bf0';
            markCallbackThis();
          } catch (err) {
            markError(err);
          }
        }, 10);
      }
      handleCopy;
    `;

    const handler = await interpreter.execute(code);
    const mockButton = { innerText: 'Copy', style: { background: '#1d9bf0' } };
    handler.call(mockButton);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(callbackThisWorked).toBe(true);
    expect(callbackError).toBeNull();
    expect(mockButton.innerText).toBe('Copy');
    expect(mockButton.style.background).toBe('#1d9bf0');
  });
});
