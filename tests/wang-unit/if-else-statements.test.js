import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('If/Else Statements - JavaScript Compatibility', () => {
  const ctx = new TestContext();

  describe('Basic if/else patterns', () => {
    it('should handle simple if/else with semicolons', async () => {
      const result = await ctx.execute(`
        let result;
        if (true) result = "A";
        else result = "B";
        result
      `);
      expect(result).toBe('A');
    });

    it('should handle simple if/else without semicolons', async () => {
      const result = await ctx.execute(`
        let result;
        if (false) result = "A"
        else result = "B"
        result
      `);
      expect(result).toBe('B');
    });

    it('should handle if without else', async () => {
      const result = await ctx.execute(`
        let x = 0;
        if (true) x = 5;
        x
      `);
      expect(result).toBe(5);
    });

    it('should handle if/else with braces (regression test)', async () => {
      const result = await ctx.execute(`
        let result;
        if (true) {
          result = "A";
        } else {
          result = "B";
        }
        result
      `);
      expect(result).toBe('A');
    });

    it('should handle mixed statement terminators', async () => {
      const result = await ctx.execute(`
        let x = 3;
        let result;
        if (x === 1) result = "one";
        else if (x === 2) result = "two"
        else if (x === 3) result = "three";
        else result = "other"
        result
      `);
      expect(result).toBe('three');
    });
  });

  describe('If/else if/else chains', () => {
    it('should handle simple if/else if/else chain', async () => {
      const result = await ctx.execute(`
        let x = 2;
        let result;
        if (x === 1) result = "one";
        else if (x === 2) result = "two";
        else result = "other";
        result
      `);
      expect(result).toBe('two');
    });

    it('should handle long if/else if chain', async () => {
      const result = await ctx.execute(`
        let x = 4;
        let result;
        if (x === 1) result = "one";
        else if (x === 2) result = "two";
        else if (x === 3) result = "three";
        else if (x === 4) result = "four";
        else if (x === 5) result = "five";
        else result = "other";
        result
      `);
      expect(result).toBe('four');
    });

    it('should handle if/else if chain without final else', async () => {
      const result = await ctx.execute(`
        let x = 10;
        let result = "default";
        if (x === 1) result = "one";
        else if (x === 2) result = "two";
        else if (x === 3) result = "three";
        result
      `);
      expect(result).toBe('default');
    });
  });

  describe('Nesting scenarios', () => {
    it('should handle nested if/else inside if block', async () => {
      const result = await ctx.execute(`
        let outer = true;
        let inner = false;
        let result;
        if (outer) {
          if (inner) result = "both true";
          else result = "outer true, inner false";
        } else result = "outer false";
        result
      `);
      expect(result).toBe('outer true, inner false');
    });

    it('should handle nested if/else inside else block', async () => {
      const result = await ctx.execute(`
        let outer = false;
        let inner = true;
        let result;
        if (outer) result = "outer true";
        else {
          if (inner) result = "outer false, inner true";
          else result = "both false";
        }
        result
      `);
      expect(result).toBe('outer false, inner true');
    });

    it('should handle multiple levels of nesting with braces', async () => {
      const result = await ctx.execute(`
        let a = true, b = false, c = true;
        let result;
        if (a) {
          if (b) {
            result = "a and b";
          } else {
            if (c) result = "a and c, not b";
            else result = "only a";
          }
        } else result = "not a";
        result
      `);
      expect(result).toBe('a and c, not b');
    });
  });

  describe('Complex expressions', () => {
    it('should handle complex boolean expressions', async () => {
      const result = await ctx.execute(`
        let a = true, b = false, c = true;
        let result;
        if (a && b || c) result = "complex1";
        else result = "complex2";
        result
      `);
      expect(result).toBe('complex1');
    });

    it('should handle function calls in conditions', async () => {
      const result = await ctx.execute(`
        function isEven(n) { return n % 2 === 0; }
        let x = 6;
        let result;
        if (isEven(x)) result = "even";
        else result = "odd";
        result
      `);
      expect(result).toBe('even');
    });

    it('should handle assignment in if statement', async () => {
      const result = await ctx.execute(`
        let x;
        let assigned;
        if (assigned = 5) x = assigned;
        else x = 0;
        x
      `);
      expect(result).toBe(5);
    });

    it('should handle object property access', async () => {
      const result = await ctx.execute(`
        let obj = { flag: true, value: 42 };
        let result;
        if (obj.flag) result = obj.value;
        else result = 0;
        result
      `);
      expect(result).toBe(42);
    });
  });

  describe('Error cases', () => {
    it('should reject dangling else', async () => {
      await expect(ctx.execute(`
        else result = "dangling";
      `)).rejects.toThrow();
    });

    it('should reject double else', async () => {
      await expect(ctx.execute(`
        if (true) result = "A";
        else result = "B";
        else result = "C";
      `)).rejects.toThrow();
    });

    it('should reject else without if', async () => {
      await expect(ctx.execute(`
        let x = 5;
        else x = 10;
      `)).rejects.toThrow();
    });
  });

  describe('Original issue reproduction', () => {
    it('should handle the original gist parsing pattern', async () => {
      const result = await ctx.execute(`
        let gistData = { stats: { files: 0, forks: 0, comments: 0, stars: 0 } };
        let items = [
          { textContent: "file count: 5" },
          { textContent: "fork count: 3" },
          { textContent: "comment count: 12" },
          { textContent: "star count: 7" }
        ];
        
        items.forEach(item => {
          let text = item.textContent;
          if (text.includes('file')) gistData.stats.files = 5;
          else if (text.includes('fork')) gistData.stats.forks = 3;
          else if (text.includes('comment')) gistData.stats.comments = 12;
          else if (text.includes('star')) gistData.stats.stars = 7;
        });
        
        gistData.stats
      `);
      expect(result).toEqual({ files: 5, forks: 3, comments: 12, stars: 7 });
    });

    it('should handle complex parsing patterns with method chaining', async () => {
      const result = await ctx.execute(`
        let results = [];
        let elements = [
          { classList: { contains: (cls) => cls === "active" }, getAttribute: (attr) => "priority-high" },
          { classList: { contains: (cls) => cls === "inactive" }, getAttribute: (attr) => "priority-low" },
          { classList: { contains: (cls) => cls === "pending" }, getAttribute: (attr) => "priority-medium" }
        ];
        
        elements.forEach(element => {
          if (element.classList.contains("active")) results.push("high");
          else if (element.classList.contains("inactive")) results.push("low");
          else if (element.classList.contains("pending")) results.push("medium");
          else results.push("unknown");
        });
        
        results
      `);
      expect(result).toEqual(["high", "low", "medium"]);
    });
  });

  describe('Performance and stress tests', () => {
    it('should handle deeply nested if/else chains', async () => {
      const result = await ctx.execute(`
        let x = 50;
        let result = "default";
        
        if (x < 10) result = "< 10";
        else if (x < 20) result = "< 20";
        else if (x < 30) result = "< 30";
        else if (x < 40) result = "< 40";
        else if (x < 50) result = "< 50";
        else if (x < 60) result = "< 60";
        else if (x < 70) result = "< 70";
        else if (x < 80) result = "< 80";
        else if (x < 90) result = "< 90";
        else if (x < 100) result = "< 100";
        else result = ">= 100";
        
        result
      `);
      expect(result).toBe('< 60');
    });

    it('should handle if/else in large loops', async () => {
      const result = await ctx.execute(`
        let evens = 0, odds = 0;
        for (let i = 0; i < 100; i++) {
          if (i % 2 === 0) evens++;
          else odds++;
        }
        { evens, odds }
      `);
      expect(result).toEqual({ evens: 50, odds: 50 });
    });
  });
});