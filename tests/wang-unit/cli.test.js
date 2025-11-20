import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

const execCommand = (command, args = [], input = null) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', reject);

    if (input) {
      child.stdin?.write(input);
      child.stdin?.end();
    } else if (args.includes('-')) {
      // For stdin tests, we need to close stdin even if no input
      child.stdin?.end();
    }
  });
};

describe('CLI Tools', () => {
  const tempDir = join(process.cwd(), 'temp-cli-test');
  const testFile = join(tempDir, 'test.wang');
  const invalidFile = join(tempDir, 'invalid.wang');

  beforeAll(async () => {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    // Create test files
    await writeFile(testFile, `
console.log("Hello World")
let x = 42
console.log("Result:", x * 2)
    `.trim());

    await writeFile(invalidFile, `
let x = 
    `.trim());
  });

  describe('wang-run CLI', () => {
    it('should execute a simple wang file', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-run.js', testFile]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Hello World');
      expect(result.stdout).toContain('Result: 84');
    });

    it('should execute with verbose flag', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-run.js', testFile, '--verbose']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('🚀 Executing Wang code');
      expect(result.stdout).toContain('✅ Execution completed');
      expect(result.stdout).toContain('Hello World');
    });

    it('should execute with quiet flag', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-run.js', testFile, '--quiet']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Hello World');
      expect(result.stdout).not.toContain('🚀');
      expect(result.stdout).not.toContain('✅');
    });

    it('should execute from stdin', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-run.js', '-'], 'console.log("From stdin")');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('From stdin');
    });

    it('should show help message', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-run.js', '--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Wang Language Runtime');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('--verbose');
    });

    it('should handle execution errors', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-run.js', invalidFile]);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('❌ Execution failed');
    });

    it('should handle missing file', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-run.js', 'nonexistent.wang']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });
  });

  describe('wang-validate CLI', () => {
    it('should validate a correct wang file', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-validate.js', testFile]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Valid Wang syntax');
    });

    it('should validate with AST flag', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-validate.js', testFile, '--ast']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Valid Wang syntax');
      expect(result.stdout).toContain('AST:');
    });

    it('should validate from stdin', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-validate.js', '-'], 'let x = 1');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Valid Wang syntax');
    });

    it('should show help message', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-validate.js', '--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Wang Language Validator');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('--ast');
    });

    it('should handle invalid syntax', async () => {
      const result = await execCommand('node', ['./dist/esm/cli/wang-validate.js', invalidFile]);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('❌ Invalid Wang syntax');
    });
  });

  // NPX integration tests can only run after package is published
  // Uncomment these tests after publishing to npm
  // describe('npx integration', () => {
  //   it('should work with npx wang-run', async () => {
  //     const result = await execCommand('npx', ['wang-run', testFile]);
  //     
  //     expect(result.code).toBe(0);
  //     expect(result.stdout).toContain('Hello World');
  //   });

  //   it('should work with npx wang-validate', async () => {
  //     const result = await execCommand('npx', ['wang-validate', testFile]);
  //     
  //     expect(result.code).toBe(0);
  //     expect(result.stdout).toContain('✅ Valid Wang syntax');
  //   });
  // });
});