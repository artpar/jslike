/**
 * Wang Metadata API
 * Comprehensive metadata collection during compilation, interpretation, and execution
 */

export class WangMetadata {
  constructor() {
    // Compilation phase metadata
    this.compilation = {
      source: '',
      sourceLength: 0,
      tokenCount: 0,
      tokens: [],
      tokenTypes: new Map(),
      nodeCount: 0,
      maxDepth: 0,
      nodeTypes: new Map(),
      parseStartTime: null,
      parseEndTime: null,
      parseErrors: [],
      sourceMap: new Map(),
    };

    // Interpretation phase metadata
    this.interpretation = {
      moduleResolutions: [],
      moduleDependencies: new Map(),
      symbols: {
        variables: new Map(),
        functions: new Map(),
        classes: new Map(),
        imports: new Map(),
        exports: new Map(),
      },
      scopes: [],
    };

    // Execution phase metadata
    this.execution = {
      state: 'idle', // idle, running, completed, failed
      startTime: null,
      endTime: null,
      callCount: 0,
      callHistory: [],
      callStack: [],
      maxCallDepth: 0,
      variableReads: new Map(),
      variableWrites: new Map(),
      variableTypes: new Map(),
      branchesExecuted: [],
      loopIterations: new Map(),
      errors: [],
    };

    // Runtime metadata (current state)
    this.runtime = {
      currentLine: null,
      currentColumn: null,
      currentNode: null,
      currentFunction: null,
      executionPath: [],
      liveVariables: new Map(),
      nodeVisitOrder: [],
      events: [],
    };

    this._callIdCounter = 0;
    this._scopeIdCounter = 0;
  }

  // Compilation methods
  recordNode(node, depth) {
    this.compilation.nodeCount++;
    this.compilation.maxDepth = Math.max(this.compilation.maxDepth, depth);

    const count = this.compilation.nodeTypes.get(node.type) || 0;
    this.compilation.nodeTypes.set(node.type, count + 1);

    if (node.location) {
      this.compilation.sourceMap.set(node, {
        startLine: node.location.startLine,
        startColumn: node.location.startColumn,
        endLine: node.location.endLine,
        endColumn: node.location.endColumn,
      });
    }
  }

  // Interpretation methods
  recordSymbol(category, name, info) {
    this.interpretation.symbols[category].set(name, info);
  }

  recordScope(scope) {
    if (!scope.id && scope.type === 'global') {
      scope.id = `scope_${this._scopeIdCounter++}`;
    } else if (!scope.id) {
      scope.id = `scope_${this._scopeIdCounter++}`;
    }

    if (scope.parent && scope.parent.id) {
      this.interpretation.scopes.push({
        ...scope,
        parent: scope.parent.id,
      });
    } else {
      this.interpretation.scopes.push({
        ...scope,
        parent: null,
      });
    }
  }

  // Execution methods
  recordCall(name, args, node) {
    const callId = `call_${this._callIdCounter++}`;

    this.execution.callCount++;
    this.execution.callStack.push(name); // Store function name, not callId
    this.execution.maxCallDepth = Math.max(
      this.execution.maxCallDepth,
      this.execution.callStack.length
    );

    const call = {
      id: callId,
      name,
      args: this._serializeArgs(args),
      line: node?.location?.startLine || null,
      column: node?.location?.startColumn || null,
      timestamp: Date.now(),
      returnValue: null,
    };

    this.execution.callHistory.push(call);
    return callId;
  }

  recordReturn(callId, value) {
    // Find the call to get its name
    const call = this.execution.callHistory.find(c => c.id === callId);
    if (call) {
      call.returnValue = this._serializeValue(value);
      // Remove from call stack by name
      const index = this.execution.callStack.indexOf(call.name);
      if (index !== -1) {
        this.execution.callStack.splice(index, 1);
      }
    }
  }

  recordEvent(type, data) {
    this.runtime.events.push({
      type,
      data,
      timestamp: Date.now(),
      currentLine: this.runtime.currentLine,
      currentColumn: this.runtime.currentColumn,
      callStack: [...this.execution.callStack],
    });
  }

  // Query methods
  getDependencyGraph() {
    const nodes = new Set();
    const edges = [];

    for (const [from, deps] of this.interpretation.moduleDependencies.entries()) {
      for (const to of deps) {
        nodes.add(to);
        edges.push({ from, to });
      }
    }

    return {
      nodes: Array.from(nodes),
      edges,
    };
  }

  getHotFunctions(limit = 10) {
    const callCounts = new Map();

    for (const call of this.execution.callHistory) {
      const count = callCounts.get(call.name) || 0;
      callCounts.set(call.name, count + 1);
    }

    return Array.from(callCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getHotVariables(limit = 10) {
    const varCounts = new Map();

    for (const [name, reads] of this.execution.variableReads.entries()) {
      const writes = this.execution.variableWrites.get(name) || 0;
      varCounts.set(name, {
        name,
        reads,
        writes,
        count: reads + writes,
      });
    }

    return Array.from(varCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getCompilationSummary() {
    return {
      sourceSize: this.compilation.sourceLength,
      tokenCount: this.compilation.tokenCount,
      uniqueTokenTypes: this.compilation.tokenTypes.size,
      nodeCount: this.compilation.nodeCount,
      maxDepth: this.compilation.maxDepth,
      errors: this.compilation.parseErrors.length,
      parseTime: this.compilation.parseEndTime - this.compilation.parseStartTime,
    };
  }

  getInterpretationSummary() {
    const successful = this.interpretation.moduleResolutions.filter(r => r.success).length;
    const failed = this.interpretation.moduleResolutions.filter(r => !r.success).length;

    return {
      modulesLoaded: successful,
      modulesFailed: failed,
      definedVariables: this.interpretation.symbols.variables.size,
      definedFunctions: this.interpretation.symbols.functions.size,
      definedClasses: this.interpretation.symbols.classes.size,
      imports: this.interpretation.symbols.imports.size,
      exports: this.interpretation.symbols.exports.size,
    };
  }

  getExecutionSummary() {
    const varReads = Array.from(this.execution.variableReads.values()).reduce((a, b) => a + b, 0);
    const varWrites = Array.from(this.execution.variableWrites.values()).reduce((a, b) => a + b, 0);

    return {
      state: this.execution.state,
      executionTime: this.execution.endTime - this.execution.startTime,
      totalCalls: this.execution.callCount,
      maxCallDepth: this.execution.maxCallDepth,
      variableReads: varReads,
      variableWrites: varWrites,
      branchesExecuted: this.execution.branchesExecuted.length,
      pipelineOperations: 0, // Pipelines not supported in Wang
      errors: this.execution.errors.length,
    };
  }

  getCurrentState() {
    return {
      line: this.runtime.currentLine,
      column: this.runtime.currentColumn,
      function: this.runtime.currentFunction,
      liveVariableCount: this.runtime.liveVariables.size,
      callStackDepth: this.execution.callStack.length,
    };
  }

  getExecutionPath(last = null) {
    if (last === null) {
      return this.runtime.executionPath;
    }
    return this.runtime.executionPath.slice(-last);
  }

  // Serialization
  toJSON() {
    return {
      compilation: {
        ...this.compilation,
        tokenTypes: Array.from(this.compilation.tokenTypes.entries()),
        nodeTypes: Array.from(this.compilation.nodeTypes.entries()),
        sourceMap: null, // Skip source map in JSON
      },
      interpretation: {
        ...this.interpretation,
        moduleDependencies: Array.from(this.interpretation.moduleDependencies.entries()),
        symbols: {
          variables: Array.from(this.interpretation.symbols.variables.entries()),
          functions: Array.from(this.interpretation.symbols.functions.entries()),
          classes: Array.from(this.interpretation.symbols.classes.entries()),
          imports: Array.from(this.interpretation.symbols.imports.entries()),
          exports: Array.from(this.interpretation.symbols.exports.entries()),
        },
      },
      execution: {
        ...this.execution,
        variableReads: Array.from(this.execution.variableReads.entries()),
        variableWrites: Array.from(this.execution.variableWrites.entries()),
        variableTypes: Array.from(this.execution.variableTypes.entries()).map(([k, v]) => [
          k,
          Array.from(v),
        ]),
        loopIterations: Array.from(this.execution.loopIterations.entries()),
      },
      runtime: {
        ...this.runtime,
        liveVariables: Array.from(this.runtime.liveVariables.entries()),
      },
      summary: {
        compilation: this.getCompilationSummary(),
        interpretation: this.getInterpretationSummary(),
        execution: this.getExecutionSummary(),
        current: this.getCurrentState(),
      },
    };
  }

  _serializeValue(value, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) {
      return '...';
    }

    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;

    if (type === 'string') {
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    }

    if (type === 'number' || type === 'boolean') {
      return String(value);
    }

    if (type === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }

    if (Array.isArray(value)) {
      const items = value.slice(0, 10).map(v => this._serializeValue(v, depth + 1, maxDepth));
      return `[${items.join(', ')}${value.length > 10 ? ', ...' : ''}]`;
    }

    if (type === 'object') {
      const entries = Object.entries(value).slice(0, 10);
      const items = entries.map(([k, v]) => `${k}: ${this._serializeValue(v, depth + 1, maxDepth)}`);
      return `{ ${items.join(', ')}${Object.keys(value).length > 10 ? ', ...' : ''} }`;
    }

    return String(value);
  }

  _serializeArgs(args) {
    return args.map(arg => ({
      type: typeof arg,
      value: this._serializeValue(arg),
    }));
  }
}

export class MetadataCollector {
  constructor(metadata = null) {
    this.metadata = metadata || new WangMetadata();
    this.enabled = true;
  }

  // Compilation events
  onTokenize(token) {
    if (!this.enabled) return;

    this.metadata.compilation.tokenCount++;
    this.metadata.compilation.tokens.push(token);

    const count = this.metadata.compilation.tokenTypes.get(token.type) || 0;
    this.metadata.compilation.tokenTypes.set(token.type, count + 1);
  }

  onParseStart(source) {
    if (!this.enabled) return;

    this.metadata.compilation.source = source;
    this.metadata.compilation.sourceLength = source.length;
    this.metadata.compilation.parseStartTime = Date.now();
  }

  onParseEnd(ast) {
    if (!this.enabled) return;

    this.metadata.compilation.parseEndTime = Date.now();
  }

  onParseError(error) {
    if (!this.enabled) return;

    this.metadata.compilation.parseErrors.push(error);
  }

  onNodeVisit(node, depth) {
    if (!this.enabled) return;

    this.metadata.recordNode(node, depth);

    // Update runtime state
    if (node.location) {
      this.metadata.runtime.currentLine = node.location.startLine;
      this.metadata.runtime.currentColumn = node.location.startColumn;
      this.metadata.runtime.currentNode = node;
      this.metadata.runtime.executionPath.push(node.location.startLine);
    } else {
      this.metadata.runtime.currentLine = null;
      this.metadata.runtime.currentColumn = null;
      this.metadata.runtime.currentNode = node;
    }

    this.metadata.runtime.nodeVisitOrder.push(node.type);
  }

  // Interpretation events
  onModuleResolve(from, specifier, resolved) {
    if (!this.enabled) return;

    this.metadata.interpretation.moduleResolutions.push({
      from,
      specifier,
      resolved,
      success: resolved !== null,
    });

    if (resolved) {
      if (!this.metadata.interpretation.moduleDependencies.has(from)) {
        this.metadata.interpretation.moduleDependencies.set(from, new Set());
      }
      this.metadata.interpretation.moduleDependencies.get(from).add(resolved);
    }
  }

  // Execution events
  onExecutionStart() {
    if (!this.enabled) return;

    this.metadata.execution.state = 'running';
    this.metadata.execution.startTime = Date.now();
  }

  onExecutionEnd() {
    if (!this.enabled) return;

    this.metadata.execution.state = 'completed';
    this.metadata.execution.endTime = Date.now();
  }

  onFunctionCall(name, args, node) {
    if (!this.enabled) return '';

    return this.metadata.recordCall(name, args, node);
  }

  onFunctionReturn(callId, value) {
    if (!this.enabled) return;

    this.metadata.recordReturn(callId, value);
  }

  onVariableAccess(name, type, value = undefined) {
    if (!this.enabled) return;

    if (type === 'read') {
      const count = this.metadata.execution.variableReads.get(name) || 0;
      this.metadata.execution.variableReads.set(name, count + 1);
    } else if (type === 'write') {
      const count = this.metadata.execution.variableWrites.get(name) || 0;
      this.metadata.execution.variableWrites.set(name, count + 1);

      // Track variable types
      const valueType = typeof value;
      if (!this.metadata.execution.variableTypes.has(name)) {
        this.metadata.execution.variableTypes.set(name, new Set());
      }
      this.metadata.execution.variableTypes.get(name).add(valueType);

      // Update live variables
      this.metadata.runtime.liveVariables.set(name, value);
    }
  }

  onBranch(type, condition, taken, node) {
    if (!this.enabled) return;

    this.metadata.execution.branchesExecuted.push({
      type,
      condition,
      taken,
      result: taken,
      line: node?.location?.startLine || null,
      column: node?.location?.startColumn || null,
    });
  }

  onError(error, node) {
    if (!this.enabled) return;

    this.metadata.execution.errors.push({
      type: error.constructor.name,
      message: error.message,
      line: node?.location?.startLine || null,
      column: node?.location?.startColumn || null,
      timestamp: Date.now(),
    });
  }

  // Utility methods
  getSummary() {
    return {
      compilation: this.metadata.getCompilationSummary(),
      interpretation: this.metadata.getInterpretationSummary(),
      execution: this.metadata.getExecutionSummary(),
      current: this.metadata.getCurrentState(),
    };
  }

  export() {
    return this.metadata.toJSON();
  }

  getMetadata() {
    return this.metadata;
  }
}

// Export for integration with interpreter
export { WangMetadata as default };
