/**
 * ExecutionController - Controls and monitors interpreter execution
 *
 * Provides pause/resume/abort capabilities and execution status introspection.
 * Works with async evaluation only - sync evaluation can only abort.
 */
export class ExecutionController {
  constructor() {
    this.state = 'idle';  // 'idle' | 'running' | 'paused' | 'aborted' | 'completed'
    this.pauseRequested = false;
    this.abortRequested = false;

    // Debug info
    this.stepCount = 0;
    this.currentNode = null;
    this.callStack = [];
    this.currentEnv = null;

    this._resolveResume = null;
  }

  // --- Control methods (called by user) ---

  /**
   * Request pause at next checkpoint. Only works during async evaluation.
   */
  pause() {
    if (this.state === 'running') {
      this.pauseRequested = true;
    }
  }

  /**
   * Resume execution after pause.
   */
  resume() {
    if (this.state === 'paused' && this._resolveResume) {
      this.pauseRequested = false;
      this._resolveResume();
      this._resolveResume = null;
    }
  }

  /**
   * Abort execution. Works for both sync and async evaluation.
   * If paused, will resume and then abort.
   */
  abort() {
    this.abortRequested = true;
    // Also resume if paused to allow abort to take effect
    if (this._resolveResume) {
      this._resolveResume();
      this._resolveResume = null;
    }
  }

  // --- Status (called by user) ---

  /**
   * Get current execution status with full debug information.
   * @returns {Object} Status object with state, stepCount, currentNode, callStack, and variables
   */
  getStatus() {
    return {
      state: this.state,
      stepCount: this.stepCount,
      currentNode: this.currentNode?.type || null,
      callStack: [...this.callStack],
      variables: this._getEnvironmentVariables()
    };
  }

  /**
   * Check if abort has been requested.
   * Compatible with AbortSignal interface.
   */
  get aborted() {
    return this.abortRequested;
  }

  // --- Internal methods (called by interpreter) ---

  /**
   * Mark execution as started. Called by execute().
   * @internal
   */
  _start() {
    this.state = 'running';
    this.stepCount = 0;
    this.currentNode = null;
    this.callStack = [];
    this.pauseRequested = false;
    // Note: don't reset abortRequested - allow pre-abort
  }

  /**
   * Mark execution as completed. Called by execute().
   * @internal
   */
  _complete() {
    this.state = 'completed';
  }

  /**
   * Push a function call onto the call stack.
   * @internal
   */
  _pushCall(name) {
    this.callStack.push(name);
  }

  /**
   * Pop a function call from the call stack.
   * @internal
   */
  _popCall() {
    this.callStack.pop();
  }

  /**
   * Set the current environment for variable introspection.
   * @internal
   */
  _setEnv(env) {
    this.currentEnv = env;
  }

  /**
   * Async checkpoint - yields if paused, throws if aborted.
   * Called at coarse granularity points (loops, function calls).
   * @internal
   */
  async _checkpoint(node) {
    this.stepCount++;
    this.currentNode = node;

    if (this.abortRequested) {
      this.state = 'aborted';
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    }

    if (this.pauseRequested && this.state === 'running') {
      this.state = 'paused';
      await new Promise(resolve => { this._resolveResume = resolve; });
      this.state = 'running';

      // Check abort after resume (user may have called abort while paused)
      if (this.abortRequested) {
        this.state = 'aborted';
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      }
    }
  }

  /**
   * Sync abort check - only throws if aborted, cannot pause.
   * Used in sync evaluate() path.
   * @internal
   */
  _checkAbortSync() {
    if (this.abortRequested) {
      this.state = 'aborted';
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    }
  }

  /**
   * Get all variables from current environment chain.
   * @internal
   */
  _getEnvironmentVariables() {
    if (!this.currentEnv) return {};
    const vars = {};
    let env = this.currentEnv;
    while (env) {
      if (env.vars) {
        for (const [key, value] of env.vars) {
          if (!(key in vars)) {
            vars[key] = this._serializeValue(value);
          }
        }
      }
      env = env.parent;
    }
    return vars;
  }

  /**
   * Serialize a value for status reporting.
   * @internal
   */
  _serializeValue(value) {
    if (value === undefined) return { type: 'undefined' };
    if (value === null) return { type: 'null' };
    if (typeof value === 'function' || (value && value.__isFunction)) {
      return { type: 'function', name: value.name || 'anonymous' };
    }
    if (Array.isArray(value)) {
      return { type: 'array', length: value.length };
    }
    if (typeof value === 'object') {
      return { type: 'object', preview: Object.keys(value).slice(0, 5) };
    }
    return { type: typeof value, value };
  }
}
