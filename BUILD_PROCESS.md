# JSLike Build Process

## Overview

JSLike uses a sophisticated build process that bundles all dependencies into a single self-contained grammar file. This eliminates runtime dependencies on moo and nearley, making distribution simple and installation fast.

## Build Architecture

### Step 1: Grammar Compilation
```bash
nearleyc src/grammar/jslike.ne -o src/grammar/jslike.js
```

**Input**: `src/grammar/jslike.ne` (Nearley grammar definition)
**Output**: `src/grammar/jslike.js` (Compiled grammar with CommonJS exports)

This uses the nearley compiler to convert the grammar definition into executable JavaScript.

### Step 2: ES6 Module Conversion
```bash
node scripts/fix-grammar.js
```

**Purpose**: Convert the generated CommonJS grammar to ES6 modules

**Transformations**:
- Removes IIFE wrapper `(function() { ... })()`
- Adds ES6 imports for lexer and AST
- Replaces `module.exports` with `export default`
- Fixes lexer token references to avoid reserved keyword issues

### Step 3: Runtime Bundling
```bash
node scripts/bundle-nearley-runtime.js
```

**Purpose**: Create a self-contained grammar file with zero runtime dependencies

**What gets bundled**:
1. **Moo lexer runtime** (~18KB) - Complete tokenization engine
2. **Nearley parser runtime** (~20KB) - Parser state machine
3. **AST node constructors** (~4KB) - All AST builder functions
4. **Lexer definition** (~2KB) - Token rules
5. **Generated grammar** (~28KB) - Parser rules

**Total**: ~72KB bundled grammar file

**Key Features**:
- Extracts moo and nearley from node_modules
- Wraps them in closures to avoid global namespace pollution
- Creates an `AST` namespace object for grammar rules
- Exports `nearley`, `grammar`, and `lexer` as ES6 modules

## File Structure

```
src/grammar/
├── jslike.ne              # Source grammar (tracked in git)
├── lexer.js               # Lexer definition (tracked in git)
└── jslike.js              # GENERATED & BUNDLED (tracked in git for distribution)
                           # Contains: moo + nearley + AST + lexer + grammar
```

## Dependencies

### Development Dependencies (devDependencies)
```json
{
  "nearley": "^2.20.1",  // Grammar compiler
  "moo": "^0.5.2"         // Lexer generator
}
```

These are **only needed at build time** for:
- Compiling the grammar
- Bundling the runtimes

### Runtime Dependencies
```json
{
  "dependencies": {}  // ZERO runtime dependencies!
}
```

The built grammar file includes everything needed at runtime.

## Build Commands

```bash
# Full build (recommended)
npm run build

# Build grammar only
npm run build:grammar

# Clean generated files
npm run clean
```

## How It Works

### Traditional Approach (NOT Used)
```
User installs package
  → npm installs nearley + moo
  → Application imports nearley
  → Application imports compiled grammar
  → Runtime: 2 dependencies
```

### JSLike Approach (Used)
```
Developer builds package
  → nearley compiles grammar
  → Script bundles nearley + moo into grammar
  → Grammar file is self-contained
User installs package
  → npm installs ZERO dependencies
  → Application imports bundled grammar
  → Runtime: 0 dependencies ✨
```

## Benefits

1. **No Runtime Dependencies**: End users don't need nearley or moo installed
2. **Faster Installation**: No need to download/install parser dependencies
3. **Smaller node_modules**: Eliminates ~40KB of dependencies
4. **Self-Contained**: Grammar file can be distributed standalone
5. **Offline-Friendly**: Works without npm registry access
6. **Deterministic**: Bundled code is versioned in git

## Distribution

When publishing to npm, the package includes:
- `src/` - Complete source code including bundled grammar
- `bin/` - CLI executables
- `README.md` - Documentation
- `LICENSE` - MIT license

Excluded from npm package:
- `node_modules/` - Development dependencies
- `scripts/` - Build scripts
- `examples/` - Example programs
- Source grammar files (`.ne`, lexer source)

## Verification

To verify the build is self-contained:

```bash
# Build the grammar
npm run build

# Remove node_modules
rm -rf node_modules

# Test - should still work!
node bin/jslike.js examples/simple.js
```

## Inspired By

This build process is inspired by the [Wang Language](https://github.com/artpar/wang) project, which pioneered the technique of bundling nearley and moo runtimes for CSP-safe browser execution.

## Technical Details

### Moo Bundling
```javascript
const moo = (() => {
  const module = { exports: {} };
  const exports = module.exports;

  // Moo source code here (UMD wrapper removed)

  return module.exports;
})();
```

### Nearley Bundling
```javascript
const nearley = (function() {
  // Factory function content from nearley UMD
  // Parser, Grammar, Rule classes

  return { Parser, Grammar, Rule };
})();
```

### AST Namespace
```javascript
const AST = {
  Program, Literal, Identifier,
  BinaryExpression, UnaryExpression,
  // ... all node constructors
};
```

This makes AST functions available to grammar postprocessors.

## Maintenance

When updating grammar:
1. Edit `src/grammar/jslike.ne`
2. Run `npm run build`
3. Test with examples
4. Commit both `.ne` and generated `.js`

When updating dependencies:
1. Update version in `package.json`
2. Run `npm install`
3. Run `npm run build` (re-bundles new versions)
4. Test thoroughly
5. Commit updated grammar file
