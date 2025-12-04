/**
 * WangInterpreter compatibility adapter for JSLike
 * Maps Wang's interpreter API to JSLike's API
 */

import { execute, createEnvironment } from '../index.js';

export class WangInterpreter {
  constructor(options = {}) {
    this.options = options;
    this.moduleResolver = options.moduleResolver;
    this.functions = options.functions || {};
    // Create a persistent environment for setVariable support
    this.persistentEnv = null;
  }

  setVariable(name, value) {
    // If persistent environment doesn't exist, create it
    if (!this.persistentEnv) {
      this.persistentEnv = createEnvironment();

      // Add custom functions
      for (const [funcName, func] of Object.entries(this.functions)) {
        if (this.persistentEnv.has(funcName)) {
          this.persistentEnv.set(funcName, func);
        } else {
          this.persistentEnv.define(funcName, func);
        }
      }
    }

    // Set the variable in persistent environment
    if (this.persistentEnv.has(name)) {
      this.persistentEnv.set(name, value);
    } else {
      this.persistentEnv.define(name, value);
    }
  }

  // Alias for setVariable - specifically for binding functions
  bindFunction(name, func) {
    return this.setVariable(name, func);
  }

  // Expose global context for accessing variables after execution
  get globalContext() {
    return {
      variables: this.persistentEnv?.vars || new Map()
    };
  }

  createExecutionEnvironment() {
    // Create fresh environment for each execution
    const env = createEnvironment();

    // Add custom functions to environment, overriding built-ins if needed
    for (const [name, func] of Object.entries(this.functions)) {
      // Use set() to override existing variables instead of define()
      if (env.has(name)) {
        env.set(name, func);
      } else {
        env.define(name, func);
      }
    }

    return env;
  }

  async execute(code, initialEnv = undefined, userOptions = {}) {
    // Use provided environment, persistent environment, or create fresh one
    const env = initialEnv || this.persistentEnv || this.createExecutionEnvironment();

    // Setup console capture if withMetadata option is enabled
    const withMetadata = userOptions.withMetadata || false;
    const capturedLogs = [];

    if (withMetadata) {
      // Override log/warn/error functions to capture calls
      const createCapture = (type) => {
        return (...args) => {
          capturedLogs.push({
            type,
            args,
            timestamp: Date.now()
          });
          // Still output to console
          console[type](...args);
          return undefined;
        };
      };

      env.set('log', createCapture('log'));
      env.set('warn', createCapture('warn'));
      env.set('error', createCapture('error'));
    }

    // Check if code contains top-level return statements
    // Need to detect `return` at start of line, but NOT inside function bodies
    // Simple heuristic: check if braces are balanced before the return statement
    const hasTopLevelReturn = this.hasTopLevelReturn(code);

    // Prepare execution options
    const options = {
      moduleResolver: this.moduleResolver,
      executionController: userOptions.executionController
      // sourceType will be auto-detected from code
    };

    let result;
    if (hasTopLevelReturn) {
      // Wrap code in async IIFE to support top-level return statements
      const wrappedCode = `(async function() { ${code} })()`;
      try {
        result = await execute(wrappedCode, env, options);
      } catch (error) {
        throw error;
      }
    } else {
      // Execute directly - JSLike returns last evaluated expression
      try {
        result = await execute(code, env, options);
      } catch (error) {
        throw error;
      }
    }

    // Return result with metadata if requested
    if (withMetadata) {
      return {
        result,
        metadata: {
          logs: capturedLogs
        }
      };
    }

    return result;
  }

  hasTopLevelReturn(code) {
    const lines = code.split('\n');
    let braceDepth = 0;

    for (const line of lines) {
      // Check if this line has a return statement at the start (ignoring whitespace)
      const trimmed = line.trim();
      if (trimmed.startsWith('return ') || trimmed === 'return') {
        // If we're at brace depth 0, it's a top-level return
        if (braceDepth === 0) {
          return true;
        }
      }

      // Count braces on this line (after checking for return)
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }
    }

    return false;
  }

  async executeModule(code) {
    // Same as execute for now - modules are handled by execute()
    return await this.execute(code);
  }
}

export class InMemoryModuleResolver {
  constructor() {
    this.modules = new Map();
  }

  addModule(name, code, metadata) {
    this.modules.set(name, { code, metadata });
  }

  async resolve(modulePath, fromPath) {
    const module = this.modules.get(modulePath);
    if (!module) {
      return null;
    }
    return {
      code: typeof module === 'string' ? module : module.code,
      path: modulePath,
      metadata: module.metadata
    };
  }

  async exists(modulePath, fromPath) {
    return this.modules.has(modulePath);
  }

  async list(prefix) {
    const paths = Array.from(this.modules.keys());
    if (prefix) {
      return paths.filter(p => p.startsWith(prefix));
    }
    return paths;
  }
}
