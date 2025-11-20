import { Environment, ReturnValue, BreakSignal, ContinueSignal, ThrowSignal } from '../runtime/environment.js';
import { parse as acornParse } from '../parser.js';
import { createMethodNotFoundError } from '../errors/enhanced-error.js';

export class Interpreter {
  constructor(globalEnv, options = {}) {
    this.globalEnv = globalEnv;
    this.moduleResolver = options.moduleResolver;
    this.moduleCache = new Map();  // Cache loaded modules
    this.moduleExports = {};  // Track exports in current module
    this.abortSignal = options.abortSignal;
  }

  // Check if execution should be aborted
  checkAbortSignal() {
    if (this.abortSignal && this.abortSignal.aborted) {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    }
  }

  // Async evaluation for async functions - handles await expressions
  async evaluateAsync(node, env) {
    if (!node) return undefined;

    // Check for abort signal before evaluating
    this.checkAbortSignal();

    // Handle await expressions by actually awaiting the promise
    if (node.type === 'AwaitExpression') {
      const promise = await this.evaluateAsync(node.argument, env);
      return await promise;
    }

    // For block statements, evaluate each statement async
    if (node.type === 'BlockStatement') {
      let result = undefined;
      for (const statement of node.body) {
        result = await this.evaluateAsync(statement, env);
        if (result instanceof ReturnValue || result instanceof ThrowSignal ||
            result instanceof BreakSignal || result instanceof ContinueSignal) {
          return result;
        }
      }
      return result;
    }

    // For expression statements, evaluate the expression async
    if (node.type === 'ExpressionStatement') {
      return await this.evaluateAsync(node.expression, env);
    }

    // For variable declarations with await in init
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        const value = declarator.init
          ? await this.evaluateAsync(declarator.init, env)
          : undefined;

        const isConst = node.kind === 'const';
        if (declarator.id.type === 'Identifier') {
          env.define(declarator.id.name, value, isConst);
        } else if (declarator.id.type === 'ObjectPattern') {
          this.bindObjectPattern(declarator.id, value, env, isConst);
        } else if (declarator.id.type === 'ArrayPattern') {
          this.bindArrayPattern(declarator.id, value, env, isConst);
        }
      }
      return undefined;
    }

    // For Program nodes (evaluate all statements async)
    if (node.type === 'Program') {
      let result = undefined;
      for (const statement of node.body) {
        result = await this.evaluateAsync(statement, env);
        // Handle top-level return and throw
        if (result instanceof ReturnValue || result instanceof ThrowSignal) {
          return result;
        }
      }
      return result;
    }

    // For import declarations (always async)
    if (node.type === 'ImportDeclaration') {
      return await this.evaluateImportDeclaration(node, env);
    }

    // For export declarations
    if (node.type === 'ExportNamedDeclaration') {
      return this.evaluateExportNamedDeclaration(node, env);
    }

    if (node.type === 'ExportDefaultDeclaration') {
      return this.evaluateExportDefaultDeclaration(node, env);
    }

    // For return statements with await
    if (node.type === 'ReturnStatement') {
      const value = node.argument ? await this.evaluateAsync(node.argument, env) : undefined;
      return new ReturnValue(value);
    }

    // For binary/unary expressions that might contain awaits
    if (node.type === 'BinaryExpression') {
      const left = await this.evaluateAsync(node.left, env);
      const right = await this.evaluateAsync(node.right, env);
      return this.evaluateBinaryExpressionValues(node.operator, left, right);
    }

    // For call expressions (might be calling async functions)
    if (node.type === 'CallExpression') {
      let thisContext = undefined;
      let callee;
      let objectName = null;
      let methodName = null;

      if (node.callee.type === 'MemberExpression') {
        thisContext = await this.evaluateAsync(node.callee.object, env);
        const prop = node.callee.computed
          ? await this.evaluateAsync(node.callee.property, env)
          : node.callee.property.name;
        callee = thisContext[prop];

        // Capture names for enhanced error messages
        methodName = prop;
        objectName = this.getExpressionName(node.callee.object);
      } else {
        callee = await this.evaluateAsync(node.callee, env);
      }

      // Handle optional call - if optional and callee is null/undefined, return undefined
      if (node.optional && (callee === null || callee === undefined)) {
        return undefined;
      }

      const args = [];
      for (const arg of node.arguments) {
        args.push(await this.evaluateAsync(arg, env));
      }

      if (typeof callee === 'function') {
        if (thisContext !== undefined) {
          return await callee.call(thisContext, ...args);
        }
        return await callee(...args);
      } else if (callee && callee.__isFunction) {
        return await this.callUserFunction(callee, args, env, thisContext);
      }

      // Throw enhanced error for member expression calls
      if (objectName && methodName) {
        throw createMethodNotFoundError(objectName, methodName, thisContext);
      }

      throw new TypeError(`${node.callee.name || 'Expression'} is not a function`);
    }

    // For chain expressions (optional chaining)
    if (node.type === 'ChainExpression') {
      return await this.evaluateAsync(node.expression, env);
    }

    // For member expressions in async context
    if (node.type === 'MemberExpression') {
      const obj = await this.evaluateAsync(node.object, env);

      // Handle optional chaining
      if (node.optional && (obj === null || obj === undefined)) {
        return undefined;
      }

      if (obj === null || obj === undefined) {
        throw new TypeError(`Cannot read property of ${obj}`);
      }

      const prop = node.computed
        ? await this.evaluateAsync(node.property, env)
        : node.property.name;

      return obj[prop];
    }

    // For template literals with await expressions
    if (node.type === 'TemplateLiteral') {
      let result = '';
      for (let i = 0; i < node.quasis.length; i++) {
        result += node.quasis[i].value.cooked || node.quasis[i].value.raw;
        if (i < node.expressions.length) {
          const exprValue = await this.evaluateAsync(node.expressions[i], env);
          result += String(exprValue);
        }
      }
      return result;
    }

    // For logical expressions with async operands (await support)
    if (node.type === 'LogicalExpression') {
      const left = await this.evaluateAsync(node.left, env);

      if (node.operator === '&&') {
        return left ? await this.evaluateAsync(node.right, env) : left;
      } else if (node.operator === '||') {
        return left ? left : await this.evaluateAsync(node.right, env);
      } else if (node.operator === '??') {
        return left !== null && left !== undefined ? left : await this.evaluateAsync(node.right, env);
      }

      throw new Error(`Unknown logical operator: ${node.operator}`);
    }

    // For try-catch-finally with async operations
    if (node.type === 'TryStatement') {
      let result;

      try {
        result = await this.evaluateAsync(node.block, env);

        if (result instanceof ThrowSignal) {
          throw result.value;
        }
      } catch (error) {
        if (node.handler) {
          const catchEnv = new Environment(env);
          if (node.handler.param) {
            catchEnv.define(node.handler.param.name, error);
          }
          result = await this.evaluateAsync(node.handler.body, catchEnv);
        } else {
          throw error;
        }
      } finally {
        if (node.finalizer) {
          const finalResult = await this.evaluateAsync(node.finalizer, env);
          // If finally block throws or returns, it overrides the try/catch result
          if (finalResult instanceof ThrowSignal || finalResult instanceof ReturnValue) {
            return finalResult;
          }
        }
      }

      return result;
    }

    // For new expressions (async constructors)
    if (node.type === 'NewExpression') {
      const result = this.evaluateNewExpression(node, env);
      // If it's a promise, await it
      if (result && typeof result.then === 'function') {
        return await result;
      }
      return result;
    }

    // For everything else, delegate to sync evaluate
    return this.evaluate(node, env);
  }

  evaluate(node, env) {
    if (!node) return undefined;

    // Check for abort signal before evaluating
    this.checkAbortSignal();

    switch (node.type) {
      case 'Program':
        return this.evaluateProgram(node, env);

      case 'Literal':
        // Handle regex literals
        if (node.regex) {
          return new RegExp(node.regex.pattern, node.regex.flags);
        }
        return node.value;

      case 'Identifier':
        return env.get(node.name);

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node, env);

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node, env);

      case 'UpdateExpression':
        return this.evaluateUpdateExpression(node, env);

      case 'AwaitExpression':
        return this.evaluateAwaitExpression(node, env);

      case 'AssignmentExpression':
        return this.evaluateAssignmentExpression(node, env);

      case 'LogicalExpression':
        return this.evaluateLogicalExpression(node, env);

      case 'ConditionalExpression':
        return this.evaluateConditionalExpression(node, env);

      case 'CallExpression':
        return this.evaluateCallExpression(node, env);

      case 'MemberExpression':
        return this.evaluateMemberExpression(node, env);

      case 'ChainExpression':
        return this.evaluateChainExpression(node, env);

      case 'ArrayExpression':
        return this.evaluateArrayExpression(node, env);

      case 'ObjectExpression':
        return this.evaluateObjectExpression(node, env);

      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        return this.evaluateFunctionExpression(node, env);

      case 'NewExpression':
        return this.evaluateNewExpression(node, env);

      case 'ThisExpression':
        return this.evaluateThisExpression(node, env);

      case 'Super':
        return this.evaluateSuperExpression(node, env);

      case 'SequenceExpression':
        return this.evaluateSequenceExpression(node, env);

      case 'VariableDeclaration':
        return this.evaluateVariableDeclaration(node, env);

      case 'FunctionDeclaration':
        return this.evaluateFunctionDeclaration(node, env);

      case 'ImportDeclaration':
        return this.evaluateImportDeclaration(node, env);

      case 'ExportNamedDeclaration':
        return this.evaluateExportNamedDeclaration(node, env);

      case 'ExportDefaultDeclaration':
        return this.evaluateExportDefaultDeclaration(node, env);

      case 'BlockStatement':
        return this.evaluateBlockStatement(node, env);

      case 'ExpressionStatement':
        return this.evaluate(node.expression, env);

      case 'ReturnStatement':
        return new ReturnValue(node.argument ? this.evaluate(node.argument, env) : undefined);

      case 'IfStatement':
        return this.evaluateIfStatement(node, env);

      case 'WhileStatement':
        return this.evaluateWhileStatement(node, env);

      case 'DoWhileStatement':
        return this.evaluateDoWhileStatement(node, env);

      case 'ForStatement':
        return this.evaluateForStatement(node, env);

      case 'ForInStatement':
        return this.evaluateForInStatement(node, env);

      case 'ForOfStatement':
        return this.evaluateForOfStatement(node, env);

      case 'BreakStatement':
        return new BreakSignal();

      case 'ContinueStatement':
        return new ContinueSignal();

      case 'ThrowStatement':
        return new ThrowSignal(this.evaluate(node.argument, env));

      case 'TryStatement':
        return this.evaluateTryStatement(node, env);

      case 'SwitchStatement':
        return this.evaluateSwitchStatement(node, env);

      case 'EmptyStatement':
        return undefined;

      // ES6+ Features
      case 'TemplateLiteral':
        return this.evaluateTemplateLiteral(node, env);

      case 'ClassDeclaration':
        return this.evaluateClassDeclaration(node, env);

      case 'ClassExpression':
        return this.evaluateClassExpression(node, env);

      case 'MethodDefinition':
        return this.evaluateMethodDefinition(node, env);

      case 'SpreadElement':
        return this.evaluateSpreadElement(node, env);

      case 'RestElement':
        return this.evaluateRestElement(node, env);

      case 'ObjectPattern':
        return this.evaluateObjectPattern(node, env);

      case 'ArrayPattern':
        return this.evaluateArrayPattern(node, env);

      case 'AssignmentPattern':
        return this.evaluateAssignmentPattern(node, env);

      case 'Property':
        return this.evaluateProperty(node, env);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  evaluateProgram(node, env) {
    let result = undefined;
    for (let i = 0; i < node.body.length; i++) {
      const statement = node.body[i];
      const isLast = i === node.body.length - 1;

      // Special case: Last statement is a BlockStatement that looks like object literal
      // Handle both shorthand { x, y } and full syntax { key: value, key2: value2 }
      if (isLast && statement.type === 'BlockStatement') {
        const objLiteral = this.tryConvertBlockToObjectLiteral(statement, env);
        if (objLiteral !== null) {
          return objLiteral;
        }
      }

      const statementResult = this.evaluate(statement, env);
      if (statementResult instanceof ReturnValue || statementResult instanceof ThrowSignal) {
        return statementResult;
      }
      result = statementResult;
    }
    return result;
  }

  // Try to convert a BlockStatement to an object literal
  // Returns null if the block doesn't look like an object literal
  tryConvertBlockToObjectLiteral(block, env) {
    if (block.body.length === 0) return null;

    // Check if it's shorthand syntax: { x, y }
    if (block.body.length === 1 && block.body[0].type === 'ExpressionStatement') {
      const expr = block.body[0].expression;

      // SequenceExpression of Identifiers: { x, y, z }
      if (expr.type === 'SequenceExpression' &&
          expr.expressions.every(e => e.type === 'Identifier')) {
        const obj = {};
        for (const identifier of expr.expressions) {
          obj[identifier.name] = env.get(identifier.name);
        }
        return obj;
      }

      // Single Identifier: { x }
      if (expr.type === 'Identifier') {
        const obj = {};
        obj[expr.name] = env.get(expr.name);
        return obj;
      }
    }

    // Check if it's labeled statements that look like object properties
    // Example: { first: first(arr), last: last(arr) }
    // This gets parsed as LabeledStatements in script mode
    const allLabeled = block.body.every(stmt => stmt.type === 'LabeledStatement');
    if (!allLabeled) return null;

    // Convert labeled statements to object properties
    const obj = {};
    for (const stmt of block.body) {
      const label = stmt.label.name;

      // The body of LabeledStatement should be ExpressionStatement
      if (stmt.body.type !== 'ExpressionStatement') {
        return null; // Not an object literal pattern
      }

      const value = this.evaluate(stmt.body.expression, env);
      obj[label] = value;
    }

    return obj;
  }

  evaluateBinaryExpression(node, env) {
    const left = this.evaluate(node.left, env);
    const right = this.evaluate(node.right, env);
    return this.evaluateBinaryExpressionValues(node.operator, left, right);
  }

  evaluateBinaryExpressionValues(operator, left, right) {
    switch (operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '**': return left ** right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '==': return left == right;
      case '!=': return left != right;
      case '===': return left === right;
      case '!==': return left !== right;
      case '&': return left & right;
      case '|': return left | right;
      case '^': return left ^ right;
      case '<<': return left << right;
      case '>>': return left >> right;
      case '>>>': return left >>> right;
      case 'in': {
        // Check right operand is not null/undefined
        if (right === null || right === undefined) {
          throw new TypeError(
            'Cannot use "in" operator to search for property in null or undefined'
          );
        }
        // Coerce left operand to string/symbol for property key
        const key = String(left);
        return key in Object(right);
      }
      case 'instanceof': {
        // Check right operand is a constructor function or JSLike function
        if (typeof right !== 'function' && !(right && right.__isFunction)) {
          throw new TypeError(
            'Right-hand side of instanceof is not a constructor'
          );
        }
        // Primitives (null/undefined) always return false
        if (left === null || left === undefined) {
          return false;
        }
        // Special case: check if left is a JSLike function and right is Function constructor
        if (right === Function && left && left.__isFunction) {
          return true;
        }
        // Use JavaScript's instanceof for native objects
        if (typeof right === 'function') {
          return left instanceof right;
        }
        // For JSLike functions, check prototype chain
        return false;
      }
      default:
        throw new Error(`Unknown binary operator: ${operator}`);
    }
  }

  evaluateUnaryExpression(node, env) {
    const argument = this.evaluate(node.argument, env);

    switch (node.operator) {
      case '+': return +argument;
      case '-': return -argument;
      case '!': return !argument;
      case '~': return ~argument;
      case 'typeof':
        // JSLike functions should report as 'function'
        if (argument && argument.__isFunction) {
          return 'function';
        }
        return typeof argument;
      case 'void': return undefined;
      case 'delete':
        if (node.argument.type === 'MemberExpression') {
          const obj = this.evaluate(node.argument.object, env);
          const prop = node.argument.computed
            ? this.evaluate(node.argument.property, env)
            : node.argument.property.name;
          return delete obj[prop];
        }
        return true;
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  evaluateUpdateExpression(node, env) {
    if (node.argument.type === 'Identifier') {
      const name = node.argument.name;
      const current = env.get(name);
      // Wang feature: treat null/undefined as 0 for increment/decrement
      const numericCurrent = (current === null || current === undefined) ? 0 : Number(current);
      const newValue = node.operator === '++' ? numericCurrent + 1 : numericCurrent - 1;
      env.set(name, newValue);
      return node.prefix ? newValue : numericCurrent;
    } else if (node.argument.type === 'MemberExpression') {
      const obj = this.evaluate(node.argument.object, env);

      // Check for null/undefined object
      if (obj === null || obj === undefined) {
        throw new TypeError(
          `Cannot read properties of ${obj} (reading '${
            node.argument.computed
              ? this.evaluate(node.argument.property, env)
              : node.argument.property.name
          }')`
        );
      }

      const prop = node.argument.computed
        ? this.evaluate(node.argument.property, env)
        : node.argument.property.name;

      // Get current value and convert to number
      let current = obj[prop];
      // Wang feature: treat null/undefined as 0 for increment/decrement
      const numericCurrent = (current === null || current === undefined) ? 0 : Number(current);
      const newValue = node.operator === '++' ? numericCurrent + 1 : numericCurrent - 1;
      obj[prop] = newValue;

      return node.prefix ? newValue : numericCurrent;
    }
    throw new Error('Invalid update expression target');
  }

  evaluateAwaitExpression(node, env) {
    // Evaluate the argument (should be a Promise)
    const promise = this.evaluate(node.argument, env);

    // Return the promise - the caller must handle it
    // This is a simplified implementation that relies on the runtime being async
    return promise;
  }

  evaluateAssignmentExpression(node, env) {
    const value = this.evaluate(node.right, env);

    if (node.left.type === 'Identifier') {
      const name = node.left.name;

      if (node.operator === '=') {
        if (env.has(name)) {
          env.set(name, value);
        } else {
          env.define(name, value);
        }
        return value;
      } else {
        const current = env.get(name);
        const newValue = this.applyCompoundAssignment(node.operator, current, value);
        env.set(name, newValue);
        return newValue;
      }
    } else if (node.left.type === 'MemberExpression') {
      const obj = this.evaluate(node.left.object, env);
      const prop = node.left.computed
        ? this.evaluate(node.left.property, env)
        : node.left.property.name;

      if (node.operator === '=') {
        obj[prop] = value;
        return value;
      } else {
        const newValue = this.applyCompoundAssignment(node.operator, obj[prop], value);
        obj[prop] = newValue;
        return newValue;
      }
    }

    throw new Error('Invalid assignment target');
  }

  applyCompoundAssignment(operator, left, right) {
    // For numeric operators, coerce undefined to 0 (like JavaScript does for += with numbers)
    // But keep undefined for string concatenation
    const isNumericOp = operator !== '+=';
    const leftVal = (isNumericOp && left === undefined) ? 0 : left;

    switch (operator) {
      case '+=':
        // Special case: undefined + number should coerce undefined to 0
        if (left === undefined && typeof right === 'number') {
          return 0 + right;
        }
        return left + right;
      case '-=': return leftVal - right;
      case '*=': return leftVal * right;
      case '/=': return leftVal / right;
      case '%=': return leftVal % right;
      default: throw new Error(`Unknown assignment operator: ${operator}`);
    }
  }

  evaluateLogicalExpression(node, env) {
    const left = this.evaluate(node.left, env);

    if (node.operator === '&&') {
      return left ? this.evaluate(node.right, env) : left;
    } else if (node.operator === '||') {
      return left ? left : this.evaluate(node.right, env);
    } else if (node.operator === '??') {
      return left !== null && left !== undefined ? left : this.evaluate(node.right, env);
    }

    throw new Error(`Unknown logical operator: ${node.operator}`);
  }

  evaluateConditionalExpression(node, env) {
    const test = this.evaluate(node.test, env);
    return test
      ? this.evaluate(node.consequent, env)
      : this.evaluate(node.alternate, env);
  }

  evaluateCallExpression(node, env) {
    //  Determine thisContext for method calls
    let thisContext = undefined;
    let callee;
    let objectName = null;
    let methodName = null;

    if (node.callee.type === 'MemberExpression') {
      // For method calls like obj.method(), set this to obj
      thisContext = this.evaluate(node.callee.object, env);
      const prop = node.callee.computed
        ? this.evaluate(node.callee.property, env)
        : node.callee.property.name;
      callee = thisContext[prop];

      // Capture names for enhanced error messages
      methodName = prop;
      objectName = this.getExpressionName(node.callee.object);
    } else {
      callee = this.evaluate(node.callee, env);
    }

    // Handle optional call - if optional and callee is null/undefined, return undefined
    if (node.optional && (callee === null || callee === undefined)) {
      return undefined;
    }

    const args = node.arguments.map(arg => this.evaluate(arg, env));

    if (typeof callee === 'function') {
      // Native JavaScript function or class method
      if (thisContext !== undefined) {
        return callee.call(thisContext, ...args);
      }
      return callee(...args);
    } else if (callee && callee.__isFunction) {
      // User-defined function - pass thisContext
      return this.callUserFunction(callee, args, env, thisContext);
    }

    // Throw enhanced error for member expression calls
    if (objectName && methodName) {
      throw createMethodNotFoundError(objectName, methodName, thisContext);
    }

    throw new TypeError(`${node.callee.name || 'Expression'} is not a function`);
  }

  // Helper to get a readable name for an expression (for error messages)
  getExpressionName(node) {
    if (!node) return 'object';

    switch (node.type) {
      case 'Identifier':
        return node.name;
      case 'ThisExpression':
        return 'this';
      case 'MemberExpression':
        const objName = this.getExpressionName(node.object);
        const propName = node.computed ? '[...]' : node.property.name;
        return `${objName}.${propName}`;
      default:
        return 'object';
    }
  }

  callUserFunction(func, args, callingEnv, thisContext = undefined) {
    // Extract metadata if function is wrapped
    const metadata = func.__metadata || func;
    const funcEnv = new Environment(metadata.closure);

    // Bind 'this' if provided (for method calls)
    if (thisContext !== undefined) {
      funcEnv.define('this', thisContext);
    }

    // Bind parameters
    for (let i = 0; i < metadata.params.length; i++) {
      const param = metadata.params[i];

      if (param.type === 'Identifier') {
        // Simple parameter: function(x)
        funcEnv.define(param.name, args[i]);
      } else if (param.type === 'AssignmentPattern') {
        // Default parameter: function(x = defaultValue)
        const value = args[i] !== undefined ? args[i] : this.evaluate(param.right, funcEnv);
        funcEnv.define(param.left.name, value);
      } else if (param.type === 'RestElement') {
        // Rest parameter: function(...rest)
        funcEnv.define(param.argument.name, args.slice(i));
        break; // Rest element must be last
      } else if (param.type === 'ObjectPattern') {
        // Destructuring parameter: function({a, b})
        this.bindObjectPattern(param, args[i], funcEnv);
      } else if (param.type === 'ArrayPattern') {
        // Array destructuring parameter: function([a, b])
        this.bindArrayPattern(param, args[i], funcEnv);
      } else {
        // Fallback for simple parameter names
        funcEnv.define(param.name, args[i]);
      }
    }

    // Execute function body
    // If async, use async evaluation and return a promise
    if (metadata.async) {
      return (async () => {
        if (metadata.expression) {
          // Arrow function with expression body
          const result = await this.evaluateAsync(metadata.body, funcEnv);
          // If the result is a ThrowSignal, throw the error
          if (result instanceof ThrowSignal) {
            throw result.value;
          }
          return result;
        } else {
          // Block statement body
          const result = await this.evaluateAsync(metadata.body, funcEnv);
          if (result instanceof ReturnValue) {
            return result.value;
          }
          // If the result is a ThrowSignal, throw the error
          if (result instanceof ThrowSignal) {
            throw result.value;
          }
          return undefined;
        }
      })();
    } else {
      // Synchronous evaluation for non-async functions
      if (metadata.expression) {
        const result = this.evaluate(metadata.body, funcEnv);
        // If the result is a ThrowSignal, throw the error
        if (result instanceof ThrowSignal) {
          throw result.value;
        }
        return result;
      } else {
        const result = this.evaluate(metadata.body, funcEnv);
        if (result instanceof ReturnValue) {
          return result.value;
        }
        // If the result is a ThrowSignal, throw the error
        if (result instanceof ThrowSignal) {
          throw result.value;
        }
        return undefined;
      }
    }
  }

  evaluateMemberExpression(node, env) {
    const obj = this.evaluate(node.object, env);

    // Handle optional chaining - if optional and obj is null/undefined, return undefined
    if (node.optional && (obj === null || obj === undefined)) {
      return undefined;
    }

    if (obj === null || obj === undefined) {
      throw new TypeError(`Cannot read property of ${obj}`);
    }

    const prop = node.computed
      ? this.evaluate(node.property, env)
      : node.property.name;

    return obj[prop];
  }

  evaluateChainExpression(node, env) {
    // ChainExpression is a wrapper for optional chaining expressions
    // It contains the actual expression (MemberExpression or CallExpression with optional: true)
    // We just evaluate the inner expression, which will handle the optional logic
    return this.evaluate(node.expression, env);
  }

  evaluateArrayExpression(node, env) {
    const result = [];
    for (const elem of node.elements) {
      if (!elem) {
        // Hole in array [1, , 3]
        result.push(undefined);
      } else if (elem.type === 'SpreadElement') {
        // Spread syntax [...arr]
        const spreadValue = this.evaluate(elem.argument, env);
        if (Array.isArray(spreadValue)) {
          result.push(...spreadValue);
        } else if (typeof spreadValue[Symbol.iterator] === 'function') {
          result.push(...spreadValue);
        } else {
          throw new TypeError('Spread syntax requires an iterable');
        }
      } else {
        result.push(this.evaluate(elem, env));
      }
    }
    return result;
  }

  evaluateObjectExpression(node, env) {
    const obj = {};
    for (const prop of node.properties) {
      if (prop.type === 'SpreadElement') {
        // Object spread {...other}
        const spreadValue = this.evaluate(prop.argument, env);
        if (typeof spreadValue === 'object' && spreadValue !== null) {
          Object.assign(obj, spreadValue);
        }
      } else {
        // Regular property or shorthand
        const key = prop.key.type === 'Identifier' && !prop.computed
          ? prop.key.name
          : this.evaluate(prop.key, env);

        // Handle shorthand properties {x} => {x: x}
        const value = prop.value ? this.evaluate(prop.value, env) : env.get(key);

        // Handle method shorthand: method() {}
        if (prop.method && prop.value.type === 'FunctionExpression') {
          obj[key] = (...args) => {
            const funcValue = this.evaluate(prop.value, env);
            return this.callUserFunction(funcValue, args, env);
          };
        } else {
          obj[key] = value;
        }
      }
    }
    return obj;
  }

  evaluateFunctionExpression(node, env) {
    const funcMetadata = {
      __isFunction: true,
      params: node.params,
      body: node.body,
      closure: env,
      expression: node.type === 'ArrowFunctionExpression' && node.expression,
      async: node.async || false
    };

    // Wrap in actual JavaScript function so it can be called by native code
    const interpreter = this;

    // Create async or sync wrapper based on function type
    // Note: using regular function (not arrow) to capture 'this' for method calls
    const wrappedFunc = funcMetadata.async
      ? async function(...args) {
          return await interpreter.callUserFunction(funcMetadata, args, funcMetadata.closure, this);
        }
      : function(...args) {
          return interpreter.callUserFunction(funcMetadata, args, funcMetadata.closure, this);
        };

    // Preserve metadata for JSLike's internal use
    wrappedFunc.__isFunction = true;
    wrappedFunc.__metadata = funcMetadata;

    return wrappedFunc;
  }

  evaluateNewExpression(node, env) {
    const constructor = this.evaluate(node.callee, env);
    const args = node.arguments.map(arg => this.evaluate(arg, env));

    // Handle user-defined functions (including async and arrow functions)
    if (constructor && constructor.__isFunction) {
      const result = this.callUserFunction(constructor, args, env);
      // If result is a promise (async function), return it directly
      // The async context will handle it
      if (result && typeof result.then === 'function') {
        return result.then(res => {
          if (res && typeof res === 'object') {
            return res;
          }
          return {};
        });
      }
      // If the function returns an object, use it; otherwise create a new object
      if (result && typeof result === 'object') {
        return result;
      }
      // For arrow/async functions that don't return an object, create one
      return {};
    }

    if (typeof constructor === 'function') {
      // For native functions and classes, try to construct
      // Arrow functions and async functions can't be constructed with 'new' in JavaScript,
      // but if they return an object, we can use that
      try {
        return new constructor(...args);
      } catch (err) {
        // If construction fails (e.g., arrow function, async function),
        // try calling it normally and see if it returns an object
        if (err.message && err.message.includes('not a constructor')) {
          const result = constructor(...args);
          // If result is a promise, handle it
          if (result && typeof result.then === 'function') {
            return result.then(res => {
              if (res && typeof res === 'object') {
                return res;
              }
              throw new TypeError(`Type mismatch in new expression: ${node.callee.name || 'Expression'} is not a constructor`);
            });
          }
          if (result && typeof result === 'object') {
            return result;
          }
          throw new TypeError(`Type mismatch in new expression: ${node.callee.name || 'Expression'} is not a constructor`);
        }
        throw err;
      }
    }

    throw new TypeError(`Type mismatch in new expression: ${node.callee.name || 'Expression'} is not a constructor`);
  }

  evaluateThisExpression(node, env) {
    try {
      return env.get('this');
    } catch (e) {
      // 'this' not defined in current scope
      return undefined;
    }
  }

  evaluateSuperExpression(node, env) {
    // Super is used in class methods to access parent class
    try {
      return env.get('super');
    } catch (e) {
      throw new ReferenceError("'super' keyword is unexpected here");
    }
  }

  evaluateSequenceExpression(node, env) {
    let result;
    for (const expr of node.expressions) {
      result = this.evaluate(expr, env);
    }
    return result;
  }

  evaluateVariableDeclaration(node, env) {
    const isConst = node.kind === 'const';

    for (const declarator of node.declarations) {
      const value = declarator.init
        ? this.evaluate(declarator.init, env)
        : undefined;

      // Handle destructuring patterns
      if (declarator.id.type === 'ObjectPattern') {
        this.bindObjectPattern(declarator.id, value, env, isConst);
      } else if (declarator.id.type === 'ArrayPattern') {
        this.bindArrayPattern(declarator.id, value, env, isConst);
      } else {
        env.define(declarator.id.name, value, isConst);
      }
    }
    return undefined;
  }

  bindObjectPattern(pattern, value, env, isConst = false) {
    if (value === null || value === undefined) {
      throw new TypeError('Cannot destructure undefined or null');
    }

    for (const prop of pattern.properties) {
      if (prop.type === 'RestElement') {
        // Handle rest properties {...rest}
        const assignedKeys = pattern.properties
          .filter(p => p.type !== 'RestElement')
          .map(p => p.key.name || p.key.value);
        const restObj = {};
        for (const key in value) {
          if (!assignedKeys.includes(key)) {
            restObj[key] = value[key];
          }
        }
        env.define(prop.argument.name, restObj, isConst);
      } else {
        const key = prop.key.name || prop.key.value;
        const propValue = value[key];

        if (prop.value.type === 'Identifier') {
          env.define(prop.value.name, propValue, isConst);
        } else if (prop.value.type === 'AssignmentPattern') {
          // Handle default values
          const finalValue = propValue !== undefined
            ? propValue
            : this.evaluate(prop.value.right, env);
          env.define(prop.value.left.name, finalValue, isConst);
        } else if (prop.value.type === 'ObjectPattern') {
          this.bindObjectPattern(prop.value, propValue, env, isConst);
        } else if (prop.value.type === 'ArrayPattern') {
          this.bindArrayPattern(prop.value, propValue, env, isConst);
        }
      }
    }
  }

  bindArrayPattern(pattern, value, env, isConst = false) {
    if (!Array.isArray(value)) {
      throw new TypeError('Cannot destructure non-iterable');
    }

    for (let i = 0; i < pattern.elements.length; i++) {
      const element = pattern.elements[i];
      if (!element) continue; // Hole in pattern [a, , c]

      if (element.type === 'RestElement') {
        // Handle rest elements [...rest]
        const restValues = value.slice(i);
        env.define(element.argument.name, restValues, isConst);
        break;
      } else if (element.type === 'Identifier') {
        env.define(element.name, value[i], isConst);
      } else if (element.type === 'AssignmentPattern') {
        // Handle default values
        const finalValue = value[i] !== undefined
          ? value[i]
          : this.evaluate(element.right, env);
        env.define(element.left.name, finalValue, isConst);
      } else if (element.type === 'ObjectPattern') {
        this.bindObjectPattern(element, value[i], env, isConst);
      } else if (element.type === 'ArrayPattern') {
        this.bindArrayPattern(element, value[i], env, isConst);
      }
    }
  }

  evaluateFunctionDeclaration(node, env) {
    const funcMetadata = {
      __isFunction: true,
      params: node.params,
      body: node.body,
      closure: env,
      expression: false,
      async: node.async || false
    };

    // Wrap in actual JavaScript function so it can be called by native code
    const interpreter = this;

    // Create async or sync wrapper based on function type
    // Note: using regular function (not arrow) to capture 'this' for method calls
    const wrappedFunc = funcMetadata.async
      ? async function(...args) {
          return await interpreter.callUserFunction(funcMetadata, args, funcMetadata.closure, this);
        }
      : function(...args) {
          return interpreter.callUserFunction(funcMetadata, args, funcMetadata.closure, this);
        };

    // Preserve metadata for JSLike's internal use
    wrappedFunc.__isFunction = true;
    wrappedFunc.__metadata = funcMetadata;

    env.define(node.id.name, wrappedFunc);
    return undefined;
  }

  async evaluateImportDeclaration(node, env) {
    // Get module path from import source
    const modulePath = node.source.value;

    // Check if module resolver is configured
    if (!this.moduleResolver) {
      throw new Error('Module resolver not configured - cannot import modules');
    }

    // Check if module is already cached
    let moduleExports;
    if (this.moduleCache.has(modulePath)) {
      moduleExports = this.moduleCache.get(modulePath);
    } else {
      // Resolve and load module code
      const resolution = await this.moduleResolver.resolve(modulePath);
      if (!resolution) {
        throw new Error(`Cannot find module '${modulePath}'`);
      }

      // Handle both old (string) and new (ModuleResolution) formats
      const moduleCode = typeof resolution === 'string' ? resolution : resolution.code;

      // Parse and execute module in its own environment
      const moduleAst = acornParse(moduleCode, {
        ecmaVersion: 2020,
        sourceType: 'module',
        locations: false
      });
      const moduleEnv = new Environment(this.globalEnv);

      // Create a new interpreter for the module with shared module cache
      const moduleInterpreter = new Interpreter(this.globalEnv, {
        moduleResolver: this.moduleResolver
      });
      moduleInterpreter.moduleCache = this.moduleCache;  // Share cache

      // Execute module and collect exports
      await moduleInterpreter.evaluateAsync(moduleAst, moduleEnv);

      // Cache the module exports
      moduleExports = moduleInterpreter.moduleExports;
      this.moduleCache.set(modulePath, moduleExports);
    }

    // Import specified bindings into current environment
    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportSpecifier') {
        // Named import: import { foo, bar } from "module"
        const importedName = specifier.imported.name;
        const localName = specifier.local.name;

        if (!(importedName in moduleExports)) {
          throw new Error(`Module '${modulePath}' has no export '${importedName}'`);
        }

        env.define(localName, moduleExports[importedName]);
      } else if (specifier.type === 'ImportDefaultSpecifier') {
        // Default import: import foo from "module"
        const localName = specifier.local.name;

        if (!('default' in moduleExports)) {
          throw new Error(`Module '${modulePath}' has no default export`);
        }

        env.define(localName, moduleExports.default);
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        // Namespace import: import * as foo from "module"
        const localName = specifier.local.name;
        env.define(localName, moduleExports);
      }
    }

    return undefined;
  }

  evaluateExportNamedDeclaration(node, env) {
    // Handle export with declaration: export function foo() {} or export const x = 42
    if (node.declaration) {
      const result = this.evaluate(node.declaration, env);

      // Register exported names
      if (node.declaration.type === 'FunctionDeclaration') {
        // export function foo() {}
        const name = node.declaration.id.name;
        this.moduleExports[name] = env.get(name);
      } else if (node.declaration.type === 'VariableDeclaration') {
        // export const x = 42, y = 10
        for (const declarator of node.declaration.declarations) {
          const name = declarator.id.name;
          this.moduleExports[name] = env.get(name);
        }
      } else if (node.declaration.type === 'ClassDeclaration') {
        // export class Foo {}
        const name = node.declaration.id.name;
        this.moduleExports[name] = env.get(name);
      }

      return result;
    }

    // Handle export list: export { foo, bar }
    if (node.specifiers && node.specifiers.length > 0) {
      for (const specifier of node.specifiers) {
        const exportedName = specifier.exported.name;
        const localName = specifier.local.name;
        this.moduleExports[exportedName] = env.get(localName);
      }
    }

    return undefined;
  }

  evaluateExportDefaultDeclaration(node, env) {
    // Evaluate the default export expression/declaration
    let value;

    if (node.declaration.type === 'FunctionDeclaration' || node.declaration.type === 'ClassDeclaration') {
      // export default function foo() {} or export default class Foo {}
      value = this.evaluate(node.declaration, env);
      // If it has a name, it's also defined in the environment
      if (node.declaration.id) {
        value = env.get(node.declaration.id.name);
      }
    } else {
      // export default expression
      value = this.evaluate(node.declaration, env);
    }

    // Register as default export
    this.moduleExports.default = value;

    return undefined;
  }

  evaluateBlockStatement(node, env) {
    const blockEnv = new Environment(env);
    let result;

    for (const statement of node.body) {
      result = this.evaluate(statement, blockEnv);
      if (result instanceof ReturnValue ||
          result instanceof BreakSignal ||
          result instanceof ContinueSignal ||
          result instanceof ThrowSignal) {
        return result;
      }
    }

    return result;
  }

  evaluateIfStatement(node, env) {
    const test = this.evaluate(node.test, env);

    if (test) {
      return this.evaluate(node.consequent, env);
    } else if (node.alternate) {
      return this.evaluate(node.alternate, env);
    }

    return undefined;
  }

  evaluateWhileStatement(node, env) {
    let result;

    while (this.evaluate(node.test, env)) {
      result = this.evaluate(node.body, env);

      if (result instanceof BreakSignal) {
        break;
      }
      if (result instanceof ContinueSignal) {
        continue;
      }
      if (result instanceof ReturnValue || result instanceof ThrowSignal) {
        return result;
      }
    }

    return undefined;
  }

  evaluateDoWhileStatement(node, env) {
    let result;

    do {
      result = this.evaluate(node.body, env);

      if (result instanceof BreakSignal) {
        break;
      }
      if (result instanceof ContinueSignal) {
        continue;
      }
      if (result instanceof ReturnValue || result instanceof ThrowSignal) {
        return result;
      }
    } while (this.evaluate(node.test, env));

    return undefined;
  }

  evaluateForStatement(node, env) {
    const forEnv = new Environment(env);
    let result;

    if (node.init) {
      this.evaluate(node.init, forEnv);
    }

    while (!node.test || this.evaluate(node.test, forEnv)) {
      result = this.evaluate(node.body, forEnv);

      if (result instanceof BreakSignal) {
        break;
      }
      if (result instanceof ContinueSignal) {
        if (node.update) {
          this.evaluate(node.update, forEnv);
        }
        continue;
      }
      if (result instanceof ReturnValue || result instanceof ThrowSignal) {
        return result;
      }

      if (node.update) {
        this.evaluate(node.update, forEnv);
      }
    }

    return undefined;
  }

  evaluateForInStatement(node, env) {
    const forEnv = new Environment(env);
    const obj = this.evaluate(node.right, forEnv);
    let result;

    // Check for null or undefined - JavaScript throws TypeError
    if (obj === null || obj === undefined) {
      throw new TypeError(`Cannot use 'in' operator to iterate over ${obj}`);
    }

    // Get the variable name from the declaration
    const varName = node.left.declarations[0].id.name;

    // Define the variable once before the loop
    forEnv.define(varName, undefined);

    for (const key in obj) {
      // Update the variable value for each iteration
      forEnv.set(varName, key);
      result = this.evaluate(node.body, forEnv);

      if (result instanceof BreakSignal) {
        break;
      }
      if (result instanceof ContinueSignal) {
        continue;
      }
      if (result instanceof ReturnValue || result instanceof ThrowSignal) {
        return result;
      }
    }

    return undefined;
  }

  evaluateForOfStatement(node, env) {
    const forEnv = new Environment(env);
    const iterable = this.evaluate(node.right, forEnv);
    let result;

    const declarator = node.left.declarations[0];
    const isConst = node.left.kind === 'const';

    for (const value of iterable) {
      // Create a new child environment for each iteration to handle const properly
      const iterEnv = forEnv.extend();

      // Bind the value using the appropriate pattern
      if (declarator.id.type === 'Identifier') {
        iterEnv.define(declarator.id.name, value, isConst);
      } else if (declarator.id.type === 'ArrayPattern') {
        this.bindArrayPattern(declarator.id, value, iterEnv, isConst);
      } else if (declarator.id.type === 'ObjectPattern') {
        this.bindObjectPattern(declarator.id, value, iterEnv, isConst);
      }

      result = this.evaluate(node.body, iterEnv);

      if (result instanceof BreakSignal) {
        break;
      }
      if (result instanceof ContinueSignal) {
        continue;
      }
      if (result instanceof ReturnValue || result instanceof ThrowSignal) {
        return result;
      }
    }

    return undefined;
  }

  evaluateTryStatement(node, env) {
    let result;

    try {
      result = this.evaluate(node.block, env);

      if (result instanceof ThrowSignal) {
        throw result.value;
      }
    } catch (error) {
      if (node.handler) {
        const catchEnv = new Environment(env);
        if (node.handler.param) {
          catchEnv.define(node.handler.param.name, error);
        }
        result = this.evaluate(node.handler.body, catchEnv);
      } else {
        throw error;
      }
    } finally {
      if (node.finalizer) {
        const finalResult = this.evaluate(node.finalizer, env);
        // If finally block throws or returns, it overrides the try/catch result
        if (finalResult instanceof ThrowSignal || finalResult instanceof ReturnValue) {
          return finalResult;
        }
      }
    }

    return result;
  }

  evaluateSwitchStatement(node, env) {
    const discriminant = this.evaluate(node.discriminant, env);
    let matched = false;
    let result;

    for (const switchCase of node.cases) {
      // Check if this case matches (or if we're in fall-through mode)
      if (!matched && switchCase.test) {
        const testValue = this.evaluate(switchCase.test, env);
        if (testValue === discriminant) {
          matched = true;
        }
      } else if (!switchCase.test) {
        // Default case
        matched = true;
      }

      // Execute consequent if matched
      if (matched) {
        for (const statement of switchCase.consequent) {
          result = this.evaluate(statement, env);

          if (result instanceof BreakSignal) {
            return undefined;
          }
          if (result instanceof ReturnValue || result instanceof ThrowSignal) {
            return result;
          }
        }
      }
    }

    return undefined;
  }

  // ===== ES6+ Feature Implementations =====

  evaluateTemplateLiteral(node, env) {
    let result = '';
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked || node.quasis[i].value.raw;
      if (i < node.expressions.length) {
        const exprValue = this.evaluate(node.expressions[i], env);
        result += String(exprValue);
      }
    }
    return result;
  }

  evaluateClassDeclaration(node, env) {
    const className = node.id.name;
    const classFunc = this.createClass(node, env);
    env.define(className, classFunc);
    return undefined;
  }

  evaluateClassExpression(node, env) {
    return this.createClass(node, env);
  }

  createClass(node, env) {
    const className = node.id ? node.id.name : 'AnonymousClass';
    const superClass = node.superClass ? this.evaluate(node.superClass, env) : null;
    const interpreter = this; // Capture interpreter reference

    // Find constructor
    let constructor = null;
    const methods = {};
    const staticMethods = {};

    for (const member of node.body.body) {
      if (member.type === 'MethodDefinition') {
        const methodName = member.key.name || member.key.value;
        const methodFunc = this.createMethodFunction(member.value, env, className);

        if (member.kind === 'constructor') {
          constructor = methodFunc;
        } else if (member.static) {
          staticMethods[methodName] = methodFunc;
        } else {
          methods[methodName] = methodFunc;
        }
      }
    }

    // Create class constructor function
    const classConstructor = function(...args) {
      // Create instance
      const instance = Object.create(classConstructor.prototype);

      // Call constructor - super() must be called explicitly inside constructor
      if (constructor) {
        const result = interpreter.callMethodFunction(constructor, instance, args, env, superClass);
        // Only use the returned object if it's an explicit return of an object (not the instance)
        if (result && result.__explicitReturn && result.value && typeof result.value === 'object' && result.value !== instance) {
          return result.value;
        }
      } else if (superClass) {
        // If no constructor defined but has superClass, implicitly call super()
        // Call the superClass constructor properly - it's a classConstructor function
        superClass.call(instance, ...args);
      }

      return instance;
    };

    // Store the constructor method on the classConstructor for super() to access
    if (constructor) {
      classConstructor.__constructor = constructor;
    }

    // Set up prototype chain
    if (superClass) {
      classConstructor.prototype = Object.create(superClass.prototype);
      classConstructor.prototype.constructor = classConstructor;
    }

    // Add methods to prototype
    for (const [name, method] of Object.entries(methods)) {
      classConstructor.prototype[name] = function(...args) {
        const result = interpreter.callMethodFunction(method, this, args, env);
        // Unwrap explicit return marker
        if (result && result.__explicitReturn) {
          return result.value;
        }
        return result;
      };
    }

    // Add static methods
    for (const [name, method] of Object.entries(staticMethods)) {
      classConstructor[name] = function(...args) {
        const result = interpreter.callMethodFunction(method, classConstructor, args, env);
        // Unwrap explicit return marker
        if (result && result.__explicitReturn) {
          return result.value;
        }
        return result;
      };
    }

    classConstructor.__className = className;
    return classConstructor;
  }

  createMethodFunction(funcNode, env, className) {
    const func = {
      __isFunction: true,
      __params: funcNode.params,
      __body: funcNode.body,
      __env: env,
      __className: className
    };
    return func;
  }

  callMethodFunction(methodFunc, thisContext, args, env, superClass = null) {
    const funcEnv = new Environment(methodFunc.__env || env);

    // Bind 'this'
    funcEnv.define('this', thisContext);

    // Bind 'super' if superClass exists
    if (superClass) {
      // Create a super function that calls the parent constructor
      const superFunc = (...superArgs) => {
        // Call the parent constructor method if it exists
        if (superClass.__constructor) {
          this.callMethodFunction(superClass.__constructor, thisContext, superArgs, env, null);
        }
        // Otherwise, call superClass as a regular constructor (for native/external classes)
        else {
          // For native constructors like Error, we need to use Reflect.construct
          // to properly initialize the instance properties
          const tempInstance = Reflect.construct(superClass, superArgs, thisContext.constructor);
          // Copy properties from the temp instance to our thisContext
          Object.getOwnPropertyNames(tempInstance).forEach(name => {
            thisContext[name] = tempInstance[name];
          });
        }
        return undefined;
      };
      // Store both the function and mark it as super
      superFunc.__isSuperConstructor = true;
      superFunc.__superClass = superClass;
      funcEnv.define('super', superFunc);
    }

    // Bind parameters
    for (let i = 0; i < methodFunc.__params.length; i++) {
      const param = methodFunc.__params[i];

      if (param.type === 'Identifier') {
        // Simple parameter: function(x)
        funcEnv.define(param.name, args[i]);
      } else if (param.type === 'AssignmentPattern') {
        // Default parameter: function(x = defaultValue)
        const value = args[i] !== undefined ? args[i] : this.evaluate(param.right, funcEnv);
        funcEnv.define(param.left.name, value);
      } else if (param.type === 'RestElement') {
        // Rest parameter: function(...rest)
        funcEnv.define(param.argument.name, args.slice(i));
        break; // Rest element must be last
      } else if (param.type === 'ObjectPattern') {
        // Destructuring parameter: function({a, b})
        this.bindObjectPattern(param, args[i], funcEnv);
      } else if (param.type === 'ArrayPattern') {
        // Array destructuring parameter: function([a, b])
        this.bindArrayPattern(param, args[i], funcEnv);
      } else {
        // Fallback for simple parameter names
        funcEnv.define(param.name, args[i]);
      }
    }

    const result = this.evaluate(methodFunc.__body, funcEnv);

    if (result instanceof ReturnValue) {
      // Mark that this was an explicit return for constructor handling
      return { __explicitReturn: true, value: result.value };
    }

    // If the result is a ThrowSignal, throw the error
    if (result instanceof ThrowSignal) {
      throw result.value;
    }

    // Return implicit result (for arrow function expressions)
    return result;
  }

  evaluateMethodDefinition(node, env) {
    // This is handled by class creation
    return undefined;
  }

  evaluateSpreadElement(node, env) {
    const arg = this.evaluate(node.argument, env);
    if (Array.isArray(arg)) {
      return { __spread: true, __values: arg };
    }
    if (typeof arg === 'object' && arg !== null) {
      return { __spread: true, __values: Object.entries(arg) };
    }
    throw new TypeError('Spread syntax requires an iterable');
  }

  evaluateRestElement(node, env) {
    // Handled during parameter binding
    return undefined;
  }

  evaluateObjectPattern(node, env) {
    // Handled during destructuring
    return undefined;
  }

  evaluateArrayPattern(node, env) {
    // Handled during destructuring
    return undefined;
  }

  evaluateAssignmentPattern(node, env) {
    // Handled during parameter binding with defaults
    return undefined;
  }

  evaluateProperty(node, env) {
    // Already handled in evaluateObjectExpression
    return undefined;
  }
}
