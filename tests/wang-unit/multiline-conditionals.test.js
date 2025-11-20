import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';
import { InMemoryModuleResolver } from '../../src/resolvers/memory.js';

describe('Multiline Conditionals', () => {
  let interpreter;

  beforeEach(() => {
    const resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({ moduleResolver: resolver });
  });

  describe('Multiline if conditions', () => {
    it('should handle multiline logical OR in parentheses', async () => {
      const code = `
        let text = "match results"
        let href = "/sports"
        let found = false
        
        if (text && href && (
          text.includes('result') || 
          text.includes('fixture') || 
          text.includes('match') ||
          text.includes('schedule')
        )) {
          found = true
        }
        
        found
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(true);
    });

    it('should handle multiline logical AND conditions', async () => {
      const code = `
        let value = 10
        let isValid = false
        
        if (value > 0 
            && value < 20 
            && value % 2 === 0) {
          isValid = true
        }
        
        isValid
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(true);
    });

    it('should handle complex nested multiline conditions', async () => {
      const code = `
        let user = { age: 25, role: "admin", active: true }
        let allowed = false
        
        if ((user.age >= 18 && user.age <= 65) && (
          user.role === "admin" || 
          user.role === "moderator" || 
          (user.role === "user" && user.active)
        )) {
          allowed = true
        }
        
        allowed
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(true);
    });

    it('should handle multiline conditions with method chaining', async () => {
      const code = `
        let items = ["apple", "banana", "apricot"]
        let hasMatch = false
        
        if (items && items.length > 0 && (
          items[0].toLowerCase().startsWith('a') ||
          items[1].toLowerCase().startsWith('a') ||
          items[2].toLowerCase().startsWith('a')
        )) {
          hasMatch = true
        }
        
        hasMatch
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(true);
    });
  });

  describe('Multiline ternary operators', () => {
    it('should handle multiline ternary expressions', async () => {
      const code = `
        let value = 75
        
        let category = value > 100 
          ? "high" 
          : value > 50 
            ? "medium"
            : "low"
        
        category
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe("medium");
    });

    it('should handle nested multiline ternary with complex conditions', async () => {
      const code = `
        let score = 85
        let bonus = 10
        
        let grade = (score + bonus) >= 90
          ? "A"
          : (score + bonus) >= 80
            ? "B"
            : (score + bonus) >= 70
              ? "C"
              : "F"
        
        grade
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe("A");
    });
  });

  describe('Multiline for loops', () => {
    it('should handle multiline for loop conditions', async () => {
      const code = `
        let sum = 0
        
        for (
          let i = 0;
          i < 5;
          i++
        ) {
          sum += i
        }
        
        sum
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(10);
    });

    it('should handle multiline for-of loops', async () => {
      const code = `
        let items = [1, 2, 3]
        let total = 0
        
        for (
          let item 
          of 
          items
        ) {
          total += item
        }
        
        total
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(6);
    });

    it('should handle multiline for-in loops', async () => {
      const code = `
        let obj = { a: 1, b: 2, c: 3 }
        let keys = []
        
        for (
          let key 
          in 
          obj
        ) {
          keys.push(key)
        }
        
        keys.join(',')
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe("a,b,c");
    });
  });

  describe('Multiline while loops', () => {
    it('should handle multiline while conditions', async () => {
      const code = `
        let count = 0
        let sum = 0
        
        while (
          count < 3 &&
          sum < 10
        ) {
          sum += 2
          count++
        }
        
        sum
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(6);
    });

    it('should handle multiline do-while conditions', async () => {
      const code = `
        let count = 0
        let result = 0
        
        do {
          result += 10
          count++
        } while (
          count < 3 &&
          result < 25
        )
        
        result
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(30); // Continues until count=3 or result>=25, so 3 iterations = 30
    });
  });

  describe('Multiline parenthesized expressions', () => {
    it('should handle multiline expressions in parentheses', async () => {
      const code = `
        let result = (
          10 + 
          20 + 
          30
        ) * 2
        
        result
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(120);
    });

    it('should handle multiline logical expressions in variable assignments', async () => {
      const code = `
        let a = true
        let b = false
        let c = true
        
        let result = (
          a &&
          !b &&
          c
        )
        
        result
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(true);
    });
  });

  describe('Multiline arithmetic expressions', () => {
    it('should handle multiline arithmetic operations', async () => {
      const code = `
        let result = 10 +
          20 -
          5 *
          2 /
          5
        
        result
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(28); // 10 + 20 - (5 * 2 / 5) = 10 + 20 - 2 = 28
    });

    it('should handle multiline comparison chains', async () => {
      const code = `
        let a = 5
        let b = 10
        let c = 15
        
        let result = a < b 
          && b < c
          && a < c
        
        result
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(true);
    });
  });

  describe('Real-world use cases', () => {
    it('should handle complex form validation scenario', async () => {
      const code = `
        let email = "user@example.com"
        let password = "secure123"
        let age = 25
        let termsAccepted = true
        
        let isValid = (
          email && email.includes('@') && email.includes('.') &&
          password && password.length >= 8 &&
          age >= 18 && age <= 120 &&
          termsAccepted === true
        )
        
        isValid
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(true);
    });

    it('should handle URL filtering scenario', async () => {
      const code = `
        let links = [
          { text: "Match Results", href: "/sports/results" },
          { text: "Home Page", href: "/" },
          { text: "Fixture List", href: "/sports/fixtures" }
        ]
        
        let sportsLinks = []
        
        for (let link of links) {
          if (link.text && link.href && (
            link.text.toLowerCase().includes('result') || 
            link.text.toLowerCase().includes('fixture') || 
            link.text.toLowerCase().includes('match') ||
            link.text.toLowerCase().includes('schedule')
          )) {
            sportsLinks.push(link)
          }
        }
        
        sportsLinks.length
      `;

      const result = await interpreter.execute(code);
      expect(result).toBe(2);
    });
  });
});