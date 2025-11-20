import { describe, it, expect, beforeEach } from 'vitest'
import { WangInterpreter } from '../../src/interpreter/index.js'

describe('For-In Loop Tests', () => {
  let interpreter

  beforeEach(() => {
    interpreter = new WangInterpreter({
      functions: {
        push: (arr, val) => { arr.push(val); return arr },
        join: (arr, sep) => arr.join(sep)
      }
    })
  })

  it('should iterate over object properties', async () => {
    const code = `
      let obj = { a: 1, b: 2, c: 3 }
      let result = []
      for (let key in obj) {
        push(result, key)
      }
      result
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should iterate over array indices as strings', async () => {
    const code = `
      let arr = ['x', 'y', 'z']
      let indices = []
      for (let idx in arr) {
        push(indices, idx)
      }
      indices
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['0', '1', '2'])
  })

  it('should handle empty objects', async () => {
    const code = `
      let empty = {}
      let count = 0
      for (let k in empty) {
        count = count + 1
      }
      count
    `
    const result = await interpreter.execute(code)
    expect(result).toBe(0)
  })

  it('should handle nested for-in loops', async () => {
    const code = `
      let nested = {
        group1: { x: 10, y: 20 },
        group2: { z: 30 }
      }
      let values = []
      for (let group in nested) {
        for (let prop in nested[group]) {
          push(values, nested[group][prop])
        }
      }
      values
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual([10, 20, 30])
  })

  it('should work with const declaration', async () => {
    const code = `
      let obj = { foo: 'bar' }
      let keys = []
      for (const key in obj) {
        push(keys, key)
      }
      keys
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['foo'])
  })

  it('should handle break statement', async () => {
    const code = `
      let obj = { a: 1, b: 2, c: 3, d: 4 }
      let keys = []
      for (let key in obj) {
        if (key === 'c') break
        push(keys, key)
      }
      keys
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['a', 'b'])
  })

  it('should handle continue statement', async () => {
    const code = `
      let obj = { a: 1, b: 2, c: 3, d: 4 }
      let keys = []
      for (let key in obj) {
        if (key === 'b' || key === 'c') continue
        push(keys, key)
      }
      keys
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['a', 'd'])
  })

  it('should access object values correctly', async () => {
    const code = `
      let data = { x: 100, y: 200 }
      let sum = 0
      for (let prop in data) {
        sum = sum + data[prop]
      }
      sum
    `
    const result = await interpreter.execute(code)
    expect(result).toBe(300)
  })

  it('should handle null or undefined gracefully', async () => {
    const code = `
      let result = []
      let nullVal = null
      for (let k in nullVal) {
        push(result, k)
      }
      result
    `
    await expect(interpreter.execute(code)).rejects.toThrow()
  })

  it('should work with destructuring pattern', async () => {
    const code = `
      let users = { alice: 25, bob: 30 }
      let ages = []
      for (let name in users) {
        push(ages, users[name])
      }
      ages
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual([25, 30])
  })

  it('should handle objects created with Object.create', async () => {
    interpreter.setVariable('Object', Object)
    const code = `
      let parent = { inherited: 'from parent' }
      let child = Object.create(parent)
      child.own = 'child property'
      
      let props = []
      for (let prop in child) {
        push(props, prop)
      }
      props
    `
    const result = await interpreter.execute(code)
    // Should include both own and inherited properties
    expect(result).toContain('own')
    expect(result).toContain('inherited')
  })

  it('should handle for-in with complex expressions', async () => {
    const code = `
      let data = { items: { a: 1, b: 2, c: 3 } }
      let sum = 0
      for (let key in data.items) {
        sum = sum + data.items[key]
      }
      sum
    `
    const result = await interpreter.execute(code)
    expect(result).toBe(6)
  })

  it('should handle for-in with variable declaration types', async () => {
    const code = `
      let obj = { x: 1, y: 2 }
      let results = []
      
      // Test with let
      for (let k1 in obj) {
        push(results, k1)
      }
      
      // Test with const  
      for (const k2 in obj) {
        push(results, k2)
      }
      
      // Test with var
      for (var k3 in obj) {
        push(results, k3)
      }
      
      results
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['x', 'y', 'x', 'y', 'x', 'y'])
  })

  it('should work with nested for-in loops and breaks', async () => {
    const code = `
      let result = []
      for (let i in [1, 2]) {
        for (let j in [10, 20, 30]) {
          if (j === "1") break
          push(result, i + "-" + j)
        }
      }
      result
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['0-0', '1-0'])
  })

  it('should handle for-in with method calls', async () => {
    const code = `
      function getObj() {
        return { a: 10, b: 20, c: 30 }
      }
      
      let total = 0
      for (let prop in getObj()) {
        total = total + getObj()[prop]
      }
      total
    `
    const result = await interpreter.execute(code)
    expect(result).toBe(60)
  })

  it('should handle special property names', async () => {
    const code = `
      let weird = { "space key": "has space", "normal": "text" }
      let keys = []
      for (let k in weird) {
        push(keys, k)
      }
      keys
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['space key', 'normal'])
  })

  it('should iterate over string indices', async () => {
    const code = `
      let str = "abc"
      let indices = []
      for (let idx in str) {
        push(indices, idx)
      }
      indices
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['0', '1', '2'])
  })

  it('should handle dynamic property access', async () => {
    const code = `
      let obj = { dynamic: 100, static: 200 }
      let result = []
      for (let k in obj) {
        push(result, k + ":" + obj[k])
      }
      result
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['dynamic:100', 'static:200'])
  })

  it('should handle for-in with async functions', async () => {
    const code = `
      async function processKeys() {
        let obj = { a: 1, b: 2, c: 3 }
        let results = []
        
        for (let key in obj) {
          push(results, key + ":" + obj[key])
        }
        
        return results
      }
      
      await processKeys()
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['a:1', 'b:2', 'c:3'])
  })
})