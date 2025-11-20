// Use bundled Acorn parser for zero runtime dependencies
import { parse as acornParse } from './parser.js';
import { Interpreter } from './interpreter/interpreter.js';
import { Environment } from './runtime/environment.js';
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

// Pre-process code to fix common patterns that fail in strict mode
function preprocessCode(code) {
  // Pattern: object literal at statement level with commas
  // Example: let arr = [1,2,3]\n{ first: first(arr), last: last(arr) }
  // This fails to parse because labeled statements can't have commas
  // We need to wrap it in parentheses to make it an expression: ({ ... })

  const lines = code.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Handle array literals and parenthesized expressions at statement level
    // Add semicolon to previous line to prevent ASI issues
    // Example: let x = 10\n[a, b] parses as: let x = 10[a, b] without semicolon
    // Example: let x = 2\n({ y: 3 }) parses as: let x = 2({ y: 3 }) without semicolon
    // But don't add if previous line ends with an operator (continuing expression)
    // Note: We DON'T handle standalone `{` here because it's too ambiguous (could be a block)
    if ((trimmed.startsWith('[') || trimmed.startsWith('(')) && result.length > 0) {
      // Skip back over empty lines and comments to find the last real statement
      let targetIdx = result.length - 1;
      while (targetIdx >= 0) {
        const checkLine = result[targetIdx].trim();
        if (checkLine && !checkLine.startsWith('//') && !checkLine.startsWith('/*')) {
          break;
        }
        targetIdx--;
      }

      if (targetIdx >= 0) {
        const prevLine = result[targetIdx];
        const prevTrimmed = prevLine.trim();
        // Don't add semicolon if previous line ends with an operator, block opener, or already has semicolon
        // But / at the end might be a regex literal, not division operator
        const endsWithOperator = /[+\-*%&|^<>=!?:]$/.test(prevTrimmed);
        // Check for regex literal at end: /pattern/flags
        const endsWithRegex = /\/[gims]*$/.test(prevTrimmed);
        // Don't add if previous line looks like a control statement (if, while, etc.)
        const isControlStatement = /^\s*(if|else|for|while|do|try|catch|finally|switch|function|class)\b/.test(prevTrimmed);
        if (prevTrimmed && !prevTrimmed.endsWith(';') && !prevTrimmed.endsWith('{') &&
            !prevTrimmed.endsWith('(') && !prevTrimmed.endsWith(',') && !endsWithOperator && !isControlStatement) {
          result[targetIdx] = prevLine + ';';
        }
      }
    }

    // Handle inline object literals at statement level: { key: value, key2: value2 }
    // Pattern: line has {...} with comma and/or colon inside (object-like)
    // This needs to be wrapped in parens to avoid being parsed as a block
    const hasInlineBlock = trimmed.match(/^(.*?)\s*\{([^{}]+)\}\s*$/);
    if (hasInlineBlock && !trimmed.match(/^\s*(if|else|for|while|do|try|catch|finally|switch|function|class)\b/)) {
      const before = hasInlineBlock[1].trim();
      const inside = hasInlineBlock[2];

      // Check if inside looks like object literal (has comma and/or colon)
      const hasComma = inside.includes(',');
      const hasColon = inside.includes(':');

      // If nothing before or just await/return, and inside has object-like syntax, wrap it
      if ((!before || before.match(/^(await|return)$/)) && (hasComma || hasColon)) {
        // Check if previous line indicates we're inside an array/object (don't wrap in that case)
        if (result.length > 0) {
          const prevLine = result[result.length - 1];
          const prevTrimmed = prevLine.trim();
          // Skip wrapping if inside array or object literal
          if (prevTrimmed.endsWith(',') || prevTrimmed.endsWith('[') || prevTrimmed.endsWith('{')) {
            result.push(line);
            continue;
          }
        }

        // Add semicolon to previous line to avoid ASI issues
        // Skip back over empty lines and comments
        if (result.length > 0) {
          let targetIdx = result.length - 1;
          while (targetIdx >= 0) {
            const checkLine = result[targetIdx].trim();
            if (checkLine && !checkLine.startsWith('//') && !checkLine.startsWith('/*')) {
              break;
            }
            targetIdx--;
          }

          if (targetIdx >= 0) {
            const prevLine = result[targetIdx];
            const prevTrimmed = prevLine.trim();
            if (prevTrimmed && !prevTrimmed.endsWith(';') && !prevTrimmed.endsWith('{')) {
              result[targetIdx] = prevLine + ';';
            }
          }
        }

        // Wrap just the {...} part
        const objPart = trimmed.substring(trimmed.indexOf('{'));
        const prefix = trimmed.substring(0, trimmed.indexOf('{'));
        line = prefix + '(' + objPart + ')';
        result.push(line);
        continue;
      }
    }

    // Check if this line starts a block that looks like an object literal
    // BUT: don't wrap if previous line is a function declaration
    if (trimmed === '{' && i < lines.length - 1) {
      // Check if previous line is a function declaration
      if (result.length > 0) {
        const prevTrimmed = result[result.length - 1].trim();
        if (prevTrimmed.match(/^\s*(async\s+)?function\s*\w*\s*\([^)]*\)\s*$/) ||
            prevTrimmed.match(/\)\s*=>\s*$/) ||
            prevTrimmed.match(/\s+(if|else|for|while|do|try|catch|finally|switch)\s*\([^)]*\)\s*$/)) {
          // This is a function/control structure body, not an object literal
          result.push(line);
          continue;
        }
      }

      // Look ahead to see if block contains colons and commas (object literal pattern)
      let blockLines = [line];
      let j = i + 1;
      let braceCount = 1;
      let hasColon = false;
      let hasComma = false;

      // Collect the block
      while (j < lines.length && braceCount > 0) {
        const nextLine = lines[j];
        blockLines.push(nextLine);

        // Count braces (simple heuristic, not perfect but good enough)
        for (const char of nextLine) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        // Check for object literal indicators
        if (nextLine.includes(':')) hasColon = true;
        if (nextLine.includes(',')) hasComma = true;

        j++;
        if (braceCount === 0) break;
      }

      // If block looks like object literal (has both : and ,), wrap in parens
      if (hasColon && hasComma) {
        // Check if previous line needs a semicolon to avoid ASI issues
        // (wrapping in parens can cause previous expression to be treated as function call)
        // Skip back over empty lines and comments to find the last real statement
        if (result.length > 0) {
          let targetIdx = result.length - 1;
          while (targetIdx >= 0) {
            const checkLine = result[targetIdx].trim();
            if (checkLine && !checkLine.startsWith('//') && !checkLine.startsWith('/*')) {
              // Found a non-empty, non-comment line
              break;
            }
            targetIdx--;
          }

          if (targetIdx >= 0) {
            const targetLine = result[targetIdx];
            const targetTrimmed = targetLine.trim();
            // Add semicolon if line doesn't end with one
            // Note: Even if it ends with }, we need semicolon (could be object literal)
            // Only skip if it ends with ; or { (block statement opener)
            if (targetTrimmed && !targetTrimmed.endsWith(';') && !targetTrimmed.endsWith('{')) {
              result[targetIdx] = targetLine + ';';
            }
          }
        }

        result.push('(' + blockLines[0]);
        for (let k = 1; k < blockLines.length - 1; k++) {
          result.push(blockLines[k]);
        }
        // Add closing paren after closing brace
        const lastLine = blockLines[blockLines.length - 1];
        result.push(lastLine.replace('}', '})'));

        // Skip the lines we already processed
        i = j - 1;
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

export function parse(code, options = {}) {
  // Pre-process code to handle patterns that fail in strict mode
  const processedCode = preprocessCode(code);

  // Determine sourceType: use 'module' ONLY if explicitly requested or if code has imports/exports
  // Default to 'script' for better compatibility with labeled statements
  let sourceType = options.sourceType || 'script';
  if (!options.sourceType && containsModuleSyntax(processedCode)) {
    sourceType = 'module';
  }

  // Parse with Acorn
  try {
    return acornParse(processedCode, {
      ecmaVersion: 2022,  // Support ES2022 features (including top-level await)
      sourceType: sourceType,
      locations: false     // Don't track source locations (faster)
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

  // Create a child environment for user code to allow shadowing of built-ins
  // This prevents conflicts when user code declares variables with same names as stdlib functions
  const userEnv = env.extend();

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
    const result = await interpreter.evaluateAsync(ast, userEnv);
    return result;
  } else {
    const result = interpreter.evaluate(ast, userEnv);
    return result;
  }
}

export function createEnvironment() {
  return createGlobalEnvironment(new Environment());
}

// Export utility functions for CLI tools
export { preprocessCode };
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
