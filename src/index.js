// Use bundled Acorn parser for zero runtime dependencies
import { parse as acornParse } from './parser.js';
import { Interpreter } from './interpreter/interpreter.js';
import { Environment, ReturnValue } from './runtime/environment.js';
import { createGlobalEnvironment } from './runtime/builtins.js';

// Helper to detect if code contains module syntax or top-level await
function containsModuleSyntax(code) {
  // Trigger module mode for:
  // 1. import/export statements
  // 2. Top-level await (await not inside a function)
  if (/^\s*(import|export)\s+/m.test(code)) {
    return true;
  }

  // Check for top-level await (simple heuristic: await at start of line or after statement)
  // This isn't perfect but handles common cases, including await in template literals
  // Also matches await after operators like || or && or = or inside parentheses
  if (/^await\s+/m.test(code) || /[;\n{(|&=]\s*await\s+/.test(code)) {
    return true;
  }

  return false;
}


export function parse(code, options = {}) {
  // Determine sourceType: use 'module' ONLY if explicitly requested or if code has imports/exports
  // Default to 'script' for better compatibility with labeled statements
  let sourceType = options.sourceType || 'script';
  if (!options.sourceType && containsModuleSyntax(code)) {
    sourceType = 'module';
  }

  // Parse with Acorn
  try {
    return acornParse(code, {
      ecmaVersion: 2022,  // Support ES2022 features (including top-level await)
      sourceType: sourceType,
      locations: true,     // Track source locations for better error messages
      allowReturnOutsideFunction: true  // Allow top-level return statements
    });
  } catch (error) {
    // Reformat error message for consistency
    throw new SyntaxError(
      `Parse error at line ${error.loc?.line || '?'}: ${error.message}`
    );
  }
}

// Helper to detect if AST contains import/export declarations
function containsModuleDeclarations(node) {
  if (!node || typeof node !== 'object') return false;

  if (node.type === 'ImportDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportDefaultDeclaration' ||
      node.type === 'ExportAllDeclaration') {
    return true;
  }

  // Check Program body for module declarations
  if (node.type === 'Program' && node.body) {
    for (const statement of node.body) {
      if (containsModuleDeclarations(statement)) return true;
    }
  }

  return false;
}

// Helper to detect if AST contains top-level await expressions
function containsTopLevelAwait(node) {
  if (!node || typeof node !== 'object') return false;

  if (node.type === 'AwaitExpression') return true;

  // Don't recurse into function bodies (they handle their own await)
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    return false;
  }

  // Check all properties
  for (const key in node) {
    if (key === 'loc' || key === 'range') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (containsTopLevelAwait(item)) return true;
      }
    } else if (typeof value === 'object') {
      if (containsTopLevelAwait(value)) return true;
    }
  }

  return false;
}

export async function execute(code, env = null, options = {}) {
  // Parse the code
  const ast = parse(code, options);

  // Create global environment if not provided
  if (!env) {
    env = createGlobalEnvironment(new Environment());
  }

  // Create interpreter with module resolver and abort signal if provided
  const interpreter = new Interpreter(env, {
    moduleResolver: options.moduleResolver,
    abortSignal: options.abortSignal
  });

  // Use async evaluation if:
  // 1. Explicitly requested module mode
  // 2. AST contains import/export declarations
  // 3. Code contains top-level await
  const needsAsync = options.sourceType === 'module' ||
                     containsModuleDeclarations(ast) ||
                     containsTopLevelAwait(ast);

  if (needsAsync) {
    const result = await interpreter.evaluateAsync(ast, env);
    return result instanceof ReturnValue ? result.value : result;
  } else {
    const result = interpreter.evaluate(ast, env);
    return result instanceof ReturnValue ? result.value : result;
  }
}

export function createEnvironment() {
  return createGlobalEnvironment(new Environment());
}

// Export utility functions for CLI tools
export const isTopLevelAwait = containsModuleSyntax;

export { Interpreter } from './interpreter/interpreter.js';
export { Environment } from './runtime/environment.js';
export { WangInterpreter, InMemoryModuleResolver } from './interpreter/index.js';

/**
 * Abstract base class for module resolution
 * Extend this class to implement custom module loading strategies
 */
export class ModuleResolver {
  /**
   * Resolve a module and return its code
   * @param {string} modulePath - The module path to resolve
   * @param {string} [fromPath] - The path of the importing module
   * @returns {Promise<ModuleResolution>} The resolved module
   */
  async resolve(modulePath, fromPath) {
    throw new Error('ModuleResolver.resolve() must be implemented by subclass');
  }

  /**
   * Check if a module exists
   * @param {string} modulePath - The module path to check
   * @param {string} [fromPath] - The path of the importing module
   * @returns {Promise<boolean>} Whether the module exists
   */
  async exists(modulePath, fromPath) {
    throw new Error('ModuleResolver.exists() must be implemented by subclass');
  }

  /**
   * List available modules
   * @param {string} [prefix] - Optional prefix to filter modules
   * @returns {Promise<string[]>} List of module paths
   */
  async list(prefix) {
    throw new Error('ModuleResolver.list() must be implemented by subclass');
  }
}

/**
 * @typedef {Object} ModuleResolution
 * @property {string} code - The module source code
 * @property {string} path - The resolved module path
 * @property {any} [metadata] - Optional metadata about the module
 */
