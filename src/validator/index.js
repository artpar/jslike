/**
 * WangValidator - Syntax validation for Wang/JSLike code
 */

import { parse, preprocessCode } from '../index.js';

export class WangValidator {
  /**
   * Validate code and return validation result
   * @param {string} code - The code to validate
   * @param {object} options - Validation options
   * @param {boolean} options.includeAST - Whether to include AST in result
   * @returns {object} Validation result
   */
  validate(code, options = {}) {
    try {
      // Preprocess code (handles ASI, etc.)
      const processed = preprocessCode(code);

      // Parse the code
      const ast = parse(processed);

      return {
        valid: true,
        ast: options.includeAST ? ast : undefined
      };
    } catch (error) {
      // Extract line and column from error
      const line = error.loc?.line || 1;
      const column = error.loc?.column || 0;

      // Generate suggestion for common errors
      const suggestion = this.getSuggestion(error, code);

      return {
        valid: false,
        error: {
          message: error.message,
          line,
          column,
          suggestion
        }
      };
    }
  }

  /**
   * Generate suggestions for common syntax errors
   * @param {Error} error - The parse error
   * @param {string} code - The original code
   * @returns {string|undefined} Suggestion text
   */
  getSuggestion(error, code) {
    const message = error.message.toLowerCase();

    // Common error patterns and suggestions
    if (message.includes('unexpected token')) {
      if (message.includes('}')) {
        return 'Check for missing opening brace or extra closing brace';
      }
      if (message.includes('{')) {
        return 'Check for missing closing brace or misplaced opening brace';
      }
      if (message.includes(')')) {
        return 'Check for missing opening parenthesis or extra closing parenthesis';
      }
      if (message.includes('(')) {
        return 'Check for missing closing parenthesis';
      }
      return 'Check syntax near the error location';
    }

    if (message.includes('unterminated string')) {
      return 'Add closing quote to string literal';
    }

    if (message.includes('unterminated template')) {
      return 'Add closing backtick to template literal';
    }

    if (message.includes('identifier expected')) {
      return 'Provide a valid identifier name';
    }

    if (message.includes('unexpected end of input')) {
      return 'Check for unclosed brackets, braces, or parentheses';
    }

    if (message.includes('invalid left-hand side')) {
      return 'Check that assignment target is a valid variable or property';
    }

    if (message.includes('duplicate parameter')) {
      return 'Remove duplicate parameter name in function definition';
    }

    if (message.includes('strict mode')) {
      return 'This syntax is not allowed in strict mode';
    }

    return undefined;
  }
}
