import { describe, it, expect, beforeEach } from 'vitest'
import { WangInterpreter } from '../../src/interpreter/index.js';

describe('Multi-line Syntax Support', () => {
  let interpreter
  
  beforeEach(() => {
    interpreter = new WangInterpreter()
  })

  describe('Multi-line function calls', () => {
    it('should support multi-line arguments in function calls', async () => {
      const code = `
        function add(a, b, c) {
          return a + b + c
        }
        
        let result = add(
          1,
          2,
          3
        )
        
        result
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(6)
    })

    it('should support complex expressions in multi-line calls', async () => {
      const code = `
        function calc(x, y, z) {
          return x * y + z
        }
        
        let result = calc(
          2 + 3,
          4 - 1,
          10 / 2
        )
        
        result
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(20) // (2+3) * (4-1) + (10/2) = 5 * 3 + 5 = 20
    })

    it('should support nested multi-line calls', async () => {
      const code = `
        function outer(a, b) {
          return a + b
        }
        
        function inner(x) {
          return x * 2
        }
        
        let result = outer(
          inner(
            5
          ),
          inner(
            10
          )
        )
        
        result
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(30) // inner(5) = 10, inner(10) = 20, outer(10, 20) = 30
    })

    it('should support method calls with multi-line arguments', async () => {
      const code = `
        class Calculator {
          multiply(a, b, c) {
            return a * b * c
          }
        }
        
        let calc = new Calculator()
        let result = calc.multiply(
          2,
          3,
          4
        )
        
        result
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(24)
    })
  })

  describe('Multi-line function parameters', () => {
    it('should support multi-line parameters in function declarations', async () => {
      const code = `
        function test(
          param1,
          param2,
          param3
        ) {
          return param1 + param2 + param3
        }
        
        test(10, 20, 30)
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(60)
    })

    it('should support multi-line parameters in arrow functions', async () => {
      const code = `
        let fn = (
          a,
          b,
          c
        ) => a * b * c
        
        fn(2, 3, 4)
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(24)
    })

    it('should support multi-line parameters in async functions', async () => {
      const code = `
        async function asyncAdd(
          x,
          y
        ) {
          return x + y
        }
        
        await asyncAdd(100, 200)
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(300)
    })
  })

  describe('Arrow functions with block statements', () => {
    it('should support arrow functions with block statements', async () => {
      const code = `
        let fn = (x) => {
          let doubled = x * 2
          let tripled = x * 3
          return doubled + tripled
        }
        
        fn(10)
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(50) // (10 * 2) + (10 * 3) = 20 + 30 = 50
    })

    it('should support multi-line arrow functions with multiple statements', async () => {
      const code = `
        let process = (value) => {
          let step1 = value + 10
          let step2 = step1 * 2
          let step3 = step2 - 5
          return step3
        }
        
        process(5)
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(25) // ((5 + 10) * 2) - 5 = (15 * 2) - 5 = 30 - 5 = 25
    })

    it('should support arrow functions with block and multi-line params', async () => {
      const code = `
        let fn = (
          a,
          b
        ) => {
          let sum = a + b
          let product = a * b
          return sum + product
        }
        
        fn(3, 4)
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(19) // (3 + 4) + (3 * 4) = 7 + 12 = 19
    })
  })

  describe('Chrome debugger example case', () => {
    it('should support the Chrome debugger multi-line pattern', async () => {
      // Mock chrome.debugger.sendCommand
      interpreter.setVariable('chrome', {
        debugger: {
          sendCommand: async (target, method, params) => {
            // Simulate returning a nodeId
            if (method === 'DOM.querySelector' && params.selector === 'h1') {
              return { nodeId: 123 }
            }
            return null
          }
        }
      })
      
      interpreter.setVariable('tab', { id: 456 })
      interpreter.setVariable('doc', { root: { nodeId: 789 } })
      
      const code = `
        let result = await chrome.debugger.sendCommand(
          { tabId: tab.id },
          "DOM.querySelector",
          { nodeId: doc.root.nodeId, selector: "h1" }
        )
        
        result.nodeId
      `
      
      const result = await interpreter.execute(code)
      expect(result).toBe(123)
    })
  })
})