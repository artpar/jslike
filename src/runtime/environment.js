// Runtime Environment for variable scoping and storage

export class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.vars = new Map();
    this.consts = new Set(); // Track const variables
  }

  define(name, value, isConst = false) {
    if (this.vars.has(name)) {
      throw new Error(`Variable '${name}' already declared`);
    }
    this.vars.set(name, value);
    if (isConst) {
      this.consts.add(name);
    }
    return value;
  }

  get(name) {
    if (this.vars.has(name)) {
      return this.vars.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new ReferenceError(`Variable "${name}" is not defined`);
  }

  set(name, value) {
    if (this.vars.has(name)) {
      // Check if trying to reassign a const variable
      if (this.consts.has(name)) {
        throw new TypeError(`Cannot reassign const variable '${name}'`);
      }
      this.vars.set(name, value);
      return value;
    }
    if (this.parent) {
      return this.parent.set(name, value);
    }
    throw new ReferenceError(`Variable "${name}" is not defined`);
  }

  has(name) {
    return this.vars.has(name) || (this.parent ? this.parent.has(name) : false);
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
