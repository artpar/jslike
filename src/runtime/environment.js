// Runtime Environment for variable scoping and storage

export class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.vars = new Map();
    this.liveBindings = new Map();
    this.consts = new Set(); // Track const variables
  }

  define(name, value, isConst = false) {
    if (this.vars.has(name) || this.liveBindings.has(name)) {
      // Allow redeclaration for non-const (REPL-style behavior)
      // But cannot redeclare a const
      if (this.consts.has(name)) {
        throw new Error(`Cannot redeclare const '${name}'`);
      }
      // Update existing variable
      this.liveBindings.delete(name);
      this.vars.set(name, value);
      if (isConst) {
        this.consts.add(name);
      }
      return value;
    }
    this.vars.set(name, value);
    if (isConst) {
      this.consts.add(name);
    }
    return value;
  }

  defineLive(name, getter, isConst = true) {
    if (this.vars.has(name) || this.liveBindings.has(name)) {
      if (this.consts.has(name)) {
        throw new Error(`Cannot redeclare const '${name}'`);
      }
      this.vars.delete(name);
    }
    this.liveBindings.set(name, getter);
    if (isConst) {
      this.consts.add(name);
    }
    return getter();
  }

  get(name) {
    if (this.liveBindings.has(name)) {
      return this.liveBindings.get(name)();
    }
    if (this.vars.has(name)) {
      return this.vars.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new ReferenceError(`Variable "${name}" is not defined`);
  }

  set(name, value) {
    if (this.vars.has(name) || this.liveBindings.has(name)) {
      // Check if trying to reassign a const variable
      if (this.consts.has(name)) {
        throw new TypeError(`Cannot reassign const variable '${name}'`);
      }
      this.liveBindings.delete(name);
      this.vars.set(name, value);
      return value;
    }
    if (this.parent) {
      return this.parent.set(name, value);
    }
    throw new ReferenceError(`Variable "${name}" is not defined`);
  }

  has(name) {
    return this.vars.has(name) || this.liveBindings.has(name) || (this.parent ? this.parent.has(name) : false);
  }

  // For let/const block scoping
  extend() {
    return new Environment(this);
  }
}

// Special control flow signals
export class ReturnValue {
  constructor(value) {
    this.value = value;
  }
}

export class BreakSignal {
  constructor() {}
}

export class ContinueSignal {
  constructor() {}
}

export class ThrowSignal {
  constructor(value) {
    this.value = value;
  }
}
