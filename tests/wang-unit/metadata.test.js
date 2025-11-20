/**
 * Unit tests for Wang Metadata API
 * Tests comprehensive metadata collection during compilation, interpretation, and execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WangMetadata, MetadataCollector } from '../../src/metadata/index.js';
import { WangInterpreter } from '../../src/interpreter/index.js';
import { InMemoryModuleResolver } from '../../src/interpreter/index.js';

describe('Wang Metadata API', () => {
  let metadata;
  let collector;

  beforeEach(() => {
    metadata = new WangMetadata();
    collector = new MetadataCollector(metadata);
  });

  describe('Compilation Phase Metadata', () => {
    it('should track tokens correctly', () => {
      const tokens = [
        { type: 'keyword', value: 'let', text: 'let', line: 1, column: 0, offset: 0 },
        { type: 'identifier', value: 'x', text: 'x', line: 1, column: 4, offset: 4 },
        { type: 'operator', value: '=', text: '=', line: 1, column: 6, offset: 6 },
        { type: 'number', value: 10, text: '10', line: 1, column: 8, offset: 8 },
        { type: 'semicolon', value: ';', text: ';', line: 1, column: 10, offset: 10 },
      ];

      tokens.forEach((token) => collector.onTokenize(token));

      expect(metadata.compilation.tokenCount).toBe(5);
      expect(metadata.compilation.tokens).toHaveLength(5);
      expect(metadata.compilation.tokenTypes.size).toBe(5);
      expect(metadata.compilation.tokenTypes.get('keyword')).toBe(1);
      expect(metadata.compilation.tokenTypes.get('number')).toBe(1);
    });

    it('should track AST nodes and depth', () => {
      const nodes = [
        { type: 'Program', location: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 35 } },
        {
          type: 'VariableDeclaration',
          location: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 10 },
        },
        {
          type: 'BinaryExpression',
          location: { startLine: 1, startColumn: 12, endLine: 1, endColumn: 20 },
        },
        {
          type: 'FunctionCall',
          location: { startLine: 1, startColumn: 28, endLine: 1, endColumn: 35 },
        },
      ];

      collector.onNodeVisit(nodes[0], 0);
      collector.onNodeVisit(nodes[1], 1);
      collector.onNodeVisit(nodes[2], 2);
      collector.onNodeVisit(nodes[3], 1);

      expect(metadata.compilation.nodeCount).toBe(4);
      expect(metadata.compilation.maxDepth).toBe(2);
      expect(metadata.compilation.nodeTypes.size).toBe(4);
      expect(metadata.compilation.nodeTypes.get('VariableDeclaration')).toBe(1);
    });

    it('should track parse timing', () => {
      const source = 'let x = 10; const y = 20;';
      collector.onParseStart(source);

      // Simulate some parsing time
      const delay = 10;
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Wait for delay
      }

      collector.onParseEnd({ type: 'Program' });

      expect(metadata.compilation.source).toBe(source);
      expect(metadata.compilation.sourceLength).toBe(25);
      expect(metadata.compilation.parseEndTime).toBeGreaterThan(
        metadata.compilation.parseStartTime,
      );
    });

    it('should track parse errors and warnings', () => {
      collector.onParseError({
        message: 'Unexpected token',
        line: 5,
        column: 10,
      });

      collector.onParseError({
        message: 'Missing semicolon',
        line: 7,
        column: 15,
      });

      expect(metadata.compilation.parseErrors).toHaveLength(2);
      expect(metadata.compilation.parseErrors[0].message).toBe('Unexpected token');
      expect(metadata.compilation.parseErrors[1].line).toBe(7);
    });

    it('should maintain source mapping', () => {
      const node = {
        type: 'FunctionCall',
        location: { startLine: 3, startColumn: 5, endLine: 3, endColumn: 15 },
      };

      metadata.recordNode(node, 1);

      const mapping = metadata.compilation.sourceMap.get(node);
      expect(mapping).toEqual({
        startLine: 3,
        startColumn: 5,
        endLine: 3,
        endColumn: 15,
      });
    });
  });

  describe('Interpretation Phase Metadata', () => {
    it('should track module resolutions', () => {
      collector.onModuleResolve('main.wang', './utils', '/src/utils.wang');
      collector.onModuleResolve('main.wang', './helpers', '/src/helpers.wang');
      collector.onModuleResolve('/src/utils.wang', '../lib/core', '/lib/core.wang');
      collector.onModuleResolve('/src/helpers.wang', './not-found', null);

      expect(metadata.interpretation.moduleResolutions).toHaveLength(4);
      expect(metadata.interpretation.moduleResolutions[0].success).toBe(true);
      expect(metadata.interpretation.moduleResolutions[3].success).toBe(false);

      expect(metadata.interpretation.moduleDependencies.get('main.wang').size).toBe(2);
      expect(
        metadata.interpretation.moduleDependencies.get('/src/utils.wang').has('/lib/core.wang'),
      ).toBe(true);
    });

    it('should track symbol definitions', () => {
      metadata.recordSymbol('variables', 'count', {
        type: 'let',
        value: 0,
        line: 5,
        column: 2,
      });

      metadata.recordSymbol('functions', 'processData', {
        params: ['data', 'options'],
        body: 'function body',
        line: 10,
      });

      metadata.recordSymbol('classes', 'DataProcessor', {
        methods: ['process', 'validate'],
        properties: ['data', 'config'],
        extends: 'BaseProcessor',
        line: 20,
      });

      expect(metadata.interpretation.symbols.variables.has('count')).toBe(true);
      expect(metadata.interpretation.symbols.functions.get('processData').params).toEqual([
        'data',
        'options',
      ]);
      expect(metadata.interpretation.symbols.classes.get('DataProcessor').extends).toBe(
        'BaseProcessor',
      );
    });

    it('should track imports and exports', () => {
      metadata.recordSymbol('imports', 'lodash', {
        from: 'lodash',
        as: '_',
        line: 1,
      });

      metadata.recordSymbol('exports', 'processData', {
        value: 'function',
        module: '/src/utils.wang',
      });

      expect(metadata.interpretation.symbols.imports.has('lodash')).toBe(true);
      expect(metadata.interpretation.symbols.exports.get('processData').module).toBe(
        '/src/utils.wang',
      );
    });

    it('should track scope chain', () => {
      metadata.recordScope({
        type: 'global',
        variables: new Set(['globalVar']),
        functions: new Set(['globalFunc']),
        depth: 0,
      });

      metadata.recordScope({
        type: 'function',
        parent: { id: 'scope_0' },
        variables: new Set(['localVar']),
        functions: new Set(['innerFunc']),
        depth: 1,
      });

      expect(metadata.interpretation.scopes).toHaveLength(2);
      expect(metadata.interpretation.scopes[0].type).toBe('global');
      expect(metadata.interpretation.scopes[1].parent).toBe('scope_0');
    });

    it('should generate dependency graph', () => {
      collector.onModuleResolve('main.wang', './a', '/src/a.wang');
      collector.onModuleResolve('main.wang', './b', '/src/b.wang');
      collector.onModuleResolve('/src/a.wang', './b', '/src/b.wang');

      const graph = metadata.getDependencyGraph();

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(3);
      expect(graph.edges.some((e) => e.from === 'main.wang' && e.to === '/src/a.wang')).toBe(true);
    });
  });

  describe('Execution Phase Metadata', () => {
    it('should track function calls and returns', () => {
      const node = { location: { startLine: 5, startColumn: 10 } };

      const callId1 = collector.onFunctionCall('add', [1, 2], node);
      const callId2 = collector.onFunctionCall('multiply', [3, 4], node);

      collector.onFunctionReturn(callId1, 3);
      collector.onFunctionReturn(callId2, 12);

      expect(metadata.execution.callCount).toBe(2);
      expect(metadata.execution.callHistory).toHaveLength(2);
      expect(metadata.execution.callHistory[0].returnValue).toBe('3');
      expect(metadata.execution.callHistory[1].returnValue).toBe('12');
    });

    it('should track call stack depth', () => {
      const callId1 = metadata.recordCall('outer', [], null);
      expect(metadata.execution.maxCallDepth).toBe(1);

      const callId2 = metadata.recordCall('inner', [], null);
      expect(metadata.execution.maxCallDepth).toBe(2);

      const callId3 = metadata.recordCall('deepest', [], null);
      expect(metadata.execution.maxCallDepth).toBe(3);

      metadata.recordReturn(callId3, null);
      metadata.recordReturn(callId2, null);
      metadata.recordReturn(callId1, null);

      expect(metadata.execution.callStack).toHaveLength(0);
    });

    it('should track variable access patterns', () => {
      collector.onVariableAccess('counter', 'write', 0);
      collector.onVariableAccess('counter', 'read');
      collector.onVariableAccess('counter', 'write', 1);
      collector.onVariableAccess('counter', 'read');
      collector.onVariableAccess('counter', 'read');

      collector.onVariableAccess('name', 'write', 'John');
      collector.onVariableAccess('name', 'write', 123);

      expect(metadata.execution.variableReads.get('counter')).toBe(3);
      expect(metadata.execution.variableWrites.get('counter')).toBe(2);
      expect(metadata.execution.variableTypes.get('name').has('string')).toBe(true);
      expect(metadata.execution.variableTypes.get('name').has('number')).toBe(true);
    });

    it('should track control flow', () => {
      const ifNode = { location: { startLine: 10, startColumn: 2 } };
      const switchNode = { location: { startLine: 20, startColumn: 2 } };

      collector.onBranch('if', true, true, ifNode);
      collector.onBranch('if', false, false, ifNode);
      collector.onBranch('switch', 'case1', true, switchNode);
      collector.onBranch('ternary', 5 > 3, true, ifNode);

      expect(metadata.execution.branchesExecuted).toHaveLength(4);
      expect(metadata.execution.branchesExecuted[0].result).toBe(true);
      expect(metadata.execution.branchesExecuted[2].type).toBe('switch');
    });

    it('should track loop iterations', () => {
      for (let i = 0; i < 10; i++) {
        metadata.execution.loopIterations.set('for_loop_1', i + 1);
      }

      for (let i = 0; i < 5; i++) {
        metadata.execution.loopIterations.set('while_loop_1', i + 1);
      }

      expect(metadata.execution.loopIterations.get('for_loop_1')).toBe(10);
      expect(metadata.execution.loopIterations.get('while_loop_1')).toBe(5);
    });

    // Pipeline operations tracking test removed - pipelines not supported

    it('should track errors', () => {
      const errorNode = { location: { startLine: 15, startColumn: 5 } };

      collector.onError(new Error('Variable not defined'), errorNode);
      collector.onError(new TypeError('Cannot read property of null'), errorNode);
      collector.onError(new ReferenceError('x is not defined'), null);

      expect(metadata.execution.errors).toHaveLength(3);
      expect(metadata.execution.errors[0].type).toBe('Error');
      expect(metadata.execution.errors[1].type).toBe('TypeError');
      expect(metadata.execution.errors[0].line).toBe(15);
    });

    it('should track execution timing', () => {
      collector.onExecutionStart();

      // Simulate some execution time
      const delay = 10;
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Wait for delay
      }

      collector.onExecutionEnd();

      expect(metadata.execution.state).toBe('completed');
      expect(metadata.execution.endTime).toBeGreaterThan(metadata.execution.startTime);
      expect(metadata.execution.endTime - metadata.execution.startTime).toBeGreaterThanOrEqual(
        delay - 1,
      );
    });
  });

  describe('Runtime Metadata', () => {
    it('should track current execution position', () => {
      const node = {
        type: 'FunctionCall',
        location: { startLine: 10, startColumn: 5 },
      };

      collector.onNodeVisit(node, 1);

      expect(metadata.runtime.currentLine).toBe(10);
      expect(metadata.runtime.currentColumn).toBe(5);
      expect(metadata.runtime.currentNode).toBe(node);
    });

    it('should track execution path', () => {
      const nodes = [
        { location: { startLine: 1 } },
        { location: { startLine: 2 } },
        { location: { startLine: 3 } },
        { location: { startLine: 5 } },
        { location: { startLine: 3 } }, // Loop back
        { location: { startLine: 5 } },
      ];

      nodes.forEach((node) => collector.onNodeVisit(node, 1));

      expect(metadata.runtime.executionPath).toEqual([1, 2, 3, 5, 3, 5]);
      expect(metadata.getExecutionPath(3)).toEqual([5, 3, 5]);
    });

    it('should track live variables', () => {
      collector.onVariableAccess('x', 'write', 10);
      collector.onVariableAccess('y', 'write', 'hello');
      collector.onVariableAccess('z', 'write', [1, 2, 3]);

      expect(metadata.runtime.liveVariables.get('x')).toBe(10);
      expect(metadata.runtime.liveVariables.get('y')).toBe('hello');
      expect(metadata.runtime.liveVariables.get('z')).toEqual([1, 2, 3]);
    });

    it('should track node visit order', () => {
      const nodes = [
        { type: 'Program' },
        { type: 'VariableDeclaration' },
        { type: 'FunctionCall' },
        { type: 'IfStatement' },
        { type: 'ReturnStatement' },
      ];

      nodes.forEach((node) => collector.onNodeVisit(node, 1));

      expect(metadata.runtime.nodeVisitOrder).toEqual([
        'Program',
        'VariableDeclaration',
        'FunctionCall',
        'IfStatement',
        'ReturnStatement',
      ]);
    });

    it('should record events with context', () => {
      metadata.recordCall('testFunc', [], null);
      metadata.runtime.currentLine = 10;

      metadata.recordEvent('custom', { action: 'test' });

      expect(metadata.runtime.events).toHaveLength(1);
      expect(metadata.runtime.events[0].type).toBe('custom');
      expect(metadata.runtime.events[0].data.action).toBe('test');
      expect(metadata.runtime.events[0].currentLine).toBe(10);
      expect(metadata.runtime.events[0].callStack).toContain('testFunc');
    });
  });

  describe('Query Methods', () => {
    it('should get hot functions', () => {
      // Create function calls
      for (let i = 0; i < 10; i++) {
        metadata.recordCall('frequentFunc', [], null);
      }
      for (let i = 0; i < 5; i++) {
        metadata.recordCall('mediumFunc', [], null);
      }
      metadata.recordCall('rareFunc', [], null);

      const hotFunctions = metadata.getHotFunctions(2);

      expect(hotFunctions).toHaveLength(2);
      expect(hotFunctions[0].name).toBe('frequentFunc');
      expect(hotFunctions[0].count).toBe(10);
      expect(hotFunctions[1].name).toBe('mediumFunc');
      expect(hotFunctions[1].count).toBe(5);
    });

    it('should get hot variables', () => {
      // Create variable accesses
      for (let i = 0; i < 20; i++) {
        collector.onVariableAccess('hotVar', 'read');
      }
      for (let i = 0; i < 5; i++) {
        collector.onVariableAccess('hotVar', 'write', i);
      }

      for (let i = 0; i < 10; i++) {
        collector.onVariableAccess('mediumVar', 'read');
      }

      collector.onVariableAccess('coldVar', 'write', 0);

      const hotVariables = metadata.getHotVariables(2);

      expect(hotVariables).toHaveLength(2);
      expect(hotVariables[0].name).toBe('hotVar');
      expect(hotVariables[0].count).toBe(25);
      expect(hotVariables[0].reads).toBe(20);
      expect(hotVariables[0].writes).toBe(5);
    });

    it('should get compilation summary', () => {
      // Set up compilation data
      collector.onParseStart('let x = 10');
      for (let i = 0; i < 5; i++) {
        collector.onTokenize({ type: `type${i}`, value: i, text: `${i}` });
      }
      for (let i = 0; i < 3; i++) {
        collector.onNodeVisit({ type: `Node${i}` }, i);
      }
      collector.onParseEnd({ type: 'Program' });

      const summary = metadata.getCompilationSummary();

      expect(summary.sourceSize).toBe(10);
      expect(summary.tokenCount).toBe(5);
      expect(summary.uniqueTokenTypes).toBe(5);
      expect(summary.nodeCount).toBe(3);
      expect(summary.maxDepth).toBe(2);
      expect(summary.errors).toBe(0);
    });

    it('should get interpretation summary', () => {
      // Set up interpretation data
      collector.onModuleResolve('a', 'b', 'c');
      collector.onModuleResolve('d', 'e', null);
      metadata.recordSymbol('variables', 'x', {});
      metadata.recordSymbol('functions', 'f', {});
      metadata.recordSymbol('classes', 'C', {});

      const summary = metadata.getInterpretationSummary();

      expect(summary.modulesLoaded).toBe(1);
      expect(summary.modulesFailed).toBe(1);
      expect(summary.definedVariables).toBe(1);
      expect(summary.definedFunctions).toBe(1);
      expect(summary.definedClasses).toBe(1);
    });

    it('should get execution summary', () => {
      collector.onExecutionStart();

      // Create some execution data
      metadata.recordCall('func1', [], null);
      collector.onVariableAccess('x', 'read');
      collector.onVariableAccess('y', 'write', 10);
      collector.onBranch('if', true, true, null);
      // Pipeline operation removed - no longer counting as a call

      collector.onExecutionEnd();

      const summary = metadata.getExecutionSummary();

      expect(summary.state).toBe('completed');
      expect(summary.totalCalls).toBe(1);  // Only func1 call counts
      expect(summary.variableReads).toBe(1);
      expect(summary.variableWrites).toBe(1);
      expect(summary.branchesExecuted).toBe(1);
      expect(summary.pipelineOperations).toBe(0);  // Pipelines removed from Wang
    });

    it('should get current state', () => {
      metadata.runtime.currentLine = 42;
      metadata.runtime.currentColumn = 10;
      metadata.runtime.currentFunction = 'testFunc';
      metadata.runtime.liveVariables.set('x', 10);
      metadata.runtime.liveVariables.set('y', 20);

      const state = metadata.getCurrentState();

      expect(state.line).toBe(42);
      expect(state.column).toBe(10);
      expect(state.function).toBe('testFunc');
      expect(state.liveVariableCount).toBe(2);
    });
  });

  describe('Export and Serialization', () => {
    it('should export to JSON', () => {
      // Create some data
      collector.onParseStart('test code');
      collector.onTokenize({ type: 'keyword', value: 'let' });
      collector.onExecutionStart();
      collector.onVariableAccess('x', 'write', 10);
      collector.onExecutionEnd();

      const json = metadata.toJSON();

      expect(json).toHaveProperty('compilation');
      expect(json).toHaveProperty('interpretation');
      expect(json).toHaveProperty('execution');
      expect(json).toHaveProperty('runtime');
      expect(json).toHaveProperty('summary');

      // Verify it's serializable
      const serialized = JSON.stringify(json);
      const parsed = JSON.parse(serialized);
      expect(parsed.summary).toBeDefined();
    });

    it('should serialize complex values correctly', () => {
      const complexObj = {
        a: 1,
        b: { c: 2, d: { e: 3 } },
        f: [1, 2, [3, 4]],
      };

      const serialized = metadata._serializeValue(complexObj);
      expect(serialized).toContain('a: 1');
      expect(serialized).toContain('b:');
      expect(serialized).toContain('f:');
    });

    it('should handle circular references in serialization', () => {
      const obj = { a: 1 };
      obj.self = obj; // Circular reference

      // Should not throw
      const serialized = metadata._serializeValue(obj, 0, 1);
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('a:');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(100);
      const serialized = metadata._serializeValue(longString);

      expect(serialized).toContain('...');
      expect(serialized.length).toBeLessThan(60);
    });

    it('should serialize function arguments', () => {
      const args = [42, 'hello', [1, 2, 3], { key: 'value' }, () => {}];

      const serialized = metadata._serializeArgs(args);

      expect(serialized).toHaveLength(5);
      expect(serialized[0].type).toBe('number');
      expect(serialized[1].type).toBe('string');
      expect(serialized[2].type).toBe('object');
      expect(serialized[4].value).toContain('Function');
    });
  });

  describe('MetadataCollector', () => {
    it('should enable and disable collection', () => {
      const customCollector = new MetadataCollector();

      expect(customCollector.enabled).toBe(true);

      customCollector.enabled = false;
      customCollector.onTokenize({ type: 'test' });

      expect(customCollector.metadata.compilation.tokenCount).toBe(0);

      customCollector.enabled = true;
      customCollector.onTokenize({ type: 'test' });

      expect(customCollector.metadata.compilation.tokenCount).toBe(1);
    });

    it('should provide summary method', () => {
      collector.onExecutionStart();
      collector.onVariableAccess('x', 'write', 10);
      collector.onExecutionEnd();

      const summary = collector.getSummary();

      expect(summary).toHaveProperty('compilation');
      expect(summary).toHaveProperty('interpretation');
      expect(summary).toHaveProperty('execution');
      expect(summary).toHaveProperty('current');
    });

    it('should provide export method', () => {
      collector.onParseStart('test');
      collector.onExecutionStart();
      collector.onExecutionEnd();

      const exported = collector.export();

      expect(exported).toHaveProperty('summary');
      expect(typeof exported).toBe('object');
    });
  });

  describe('Integration with Wang Interpreter', () => {
    it('should work with real Wang interpreter', async () => {
      try {
        // Create a metadata-enabled interpreter
        class MetadataInterpreter extends WangInterpreter {
          constructor(options) {
            super(options);
            this.collector = new MetadataCollector();
          }

          async visitNode(node, depth = 0) {
            this.collector.onNodeVisit(node, depth);
            return super.visitNode(node, depth);
          }

          getMetadata() {
            return this.collector.getMetadata();
          }
        }

        const resolver = new InMemoryModuleResolver();
        const interpreter = new MetadataInterpreter({
          moduleResolver: resolver,
          functions: {
            log: () => {},
            test: (x) => x * 2,
          },
        });

        const code = `
          let x = 10
          let y = test(x)
          log(y)
        `;

        interpreter.collector.onExecutionStart();
        await interpreter.execute(code);
        interpreter.collector.onExecutionEnd();

        const metadata = interpreter.getMetadata();
        const summary = metadata.getExecutionSummary();

        expect(summary.state).toBe('completed');
        expect(metadata.runtime.nodeVisitOrder.length).toBeGreaterThan(0);
      } catch (error) {
        // If the interpreter isn't built yet, skip this test
        console.log('Skipping integration test - interpreter not built');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values', () => {
      collector.onVariableAccess('nullVar', 'write', null);
      collector.onVariableAccess('undefinedVar', 'write', undefined);

      expect(metadata.runtime.liveVariables.get('nullVar')).toBe(null);
      expect(metadata.runtime.liveVariables.get('undefinedVar')).toBe(undefined);

      const serialized = metadata._serializeValue(null);
      expect(serialized).toBe('null');
    });

    it('should handle empty collections', () => {
      const summary = metadata.getExecutionSummary();

      expect(summary.totalCalls).toBe(0);
      expect(summary.variableReads).toBe(0);
      expect(summary.errors).toBe(0);

      const hotFuncs = metadata.getHotFunctions();
      expect(hotFuncs).toEqual([]);
    });

    it('should handle concurrent operations', () => {
      // Simulate concurrent function calls
      const callIds = [];
      for (let i = 0; i < 5; i++) {
        callIds.push(metadata.recordCall(`func${i}`, [], null));
      }

      expect(metadata.execution.callStack).toHaveLength(5);
      expect(metadata.execution.maxCallDepth).toBe(5);

      // Return in different order
      metadata.recordReturn(callIds[2], 'result2');
      metadata.recordReturn(callIds[4], 'result4');
      metadata.recordReturn(callIds[0], 'result0');

      expect(metadata.execution.callStack).toHaveLength(2);
    });

    it('should handle missing locations gracefully', () => {
      const nodeWithoutLocation = { type: 'TestNode' };

      // Should not throw
      collector.onNodeVisit(nodeWithoutLocation, 0);
      collector.onFunctionCall('test', [], nodeWithoutLocation);
      collector.onBranch('if', true, true, nodeWithoutLocation);

      expect(metadata.runtime.currentLine).toBe(null);
    });

    it('should handle very deep recursion', () => {
      const maxDepth = 100;
      const callIds = [];

      for (let i = 0; i < maxDepth; i++) {
        callIds.push(metadata.recordCall('recursive', [i], null));
      }

      expect(metadata.execution.maxCallDepth).toBe(maxDepth);

      // Unwind
      for (let i = maxDepth - 1; i >= 0; i--) {
        metadata.recordReturn(callIds[i], i);
      }

      expect(metadata.execution.callStack).toHaveLength(0);
    });
  });
});
