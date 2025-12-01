/**
 * Result of module resolution
 */
export interface ModuleResolution {
  /** The module source code */
  code: string;
  /** The resolved module path */
  path: string;
  /** Optional metadata about the module */
  metadata?: any;
}
