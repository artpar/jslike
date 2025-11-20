/**
 * InMemoryModuleResolver compatibility for Wang tests
 */

export class InMemoryModuleResolver {
  constructor() {
    this.modules = new Map();
  }

  addModule(name, code) {
    this.modules.set(name, code);
  }

  async resolve(name) {
    return this.modules.get(name);
  }
}
