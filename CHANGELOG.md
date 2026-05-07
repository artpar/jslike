# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.4] - 2026-05-07

### Fixed
- Bind identifiers from defaulted object and array destructuring parameters in functions, async callbacks, methods, and constructors.
- Preserve nested destructuring defaults and rest parameter behavior through shared parameter binding logic.

## [1.8.3] - 2026-05-07

### Fixed
- Initialize JavaScript class instance fields, including arrow function fields that capture `this`.
- Apply inherited base class field initializers during `super(...)` and implicit subclass construction.
- Preserve native class-field initialization order across base constructors, derived fields, computed fields, and multi-level inheritance.

## [1.8.2] - 2026-05-07

### Fixed
- Prevent enhanced method suggestions from invoking strict function `caller` / `arguments` accessors or other throwing accessor properties while constructing missing-method errors.
- Keep missing-method errors best-effort when reflection traps throw during method suggestion collection.

## [1.8.1] - 2026-05-07

### Fixed
- Elide regular TypeScript imports whose local bindings are used only in type positions, matching TypeScript transpilation behavior.
- Preserve runtime binding for mixed imports, default imports, namespace imports, and TSX component imports when they are referenced in value positions.

## [1.8.0] - 2026-05-07

### Added
- TypeScript and TSX parsing for entry code and imported modules via bundled `@sveltejs/acorn-typescript`.
- Runtime support for TypeScript erasure semantics, including type aliases, interfaces, declarations, annotations, type-only imports/exports, type assertions, `as`, `satisfies`, non-null assertions, and generic call syntax.
- Runtime support for TypeScript enums and constructor parameter properties.
- `sourcePath`, `typescript`, and `tsx` execution options for parser selection and import context.

### Fixed
- Pass importer `fromPath` to `moduleResolver.resolve(modulePath, fromPath)` for static imports.
- Use resolved module paths as nested import context and cache keys to avoid relative import collisions.
- Preserve module resolver caching behavior for repeated bare imports.

## [1.7.0] - 2026-01-22

### Added
- **TaggedTemplateExpression support** - Full ES6 tagged template literal implementation
  - Supports all ES6 tagged template features including `strings.raw` property
  - Proper `this` context preservation for member expression tags
  - Full async/await support for tag functions and template expressions
  - Frozen strings and raw arrays per ES6 specification
  - Comprehensive error handling with meaningful error messages
  - 112 dedicated tests covering all use cases and edge cases
  - Integration with JSX, classes, modules, async/await, and control flow
  - Real-world patterns: SQL builders, styled-components, HTML templates, GraphQL queries
  - Resolves [GitHub issue #1](https://github.com/artpar/jslike/issues/1)

### Technical Details
- Modified `src/interpreter/interpreter.js`:
  - Added `TaggedTemplateExpression` case to `evaluate()` switch statement
  - Implemented `evaluateTaggedTemplateExpression()` method
  - Added async handler in `evaluateAsync()` method
- Test coverage: 112 new tests across 3 test files
- Zero regressions verified across 1,198 existing tests

## [1.6.3] - Previous Release

### Fixed
- Handle SpreadElement in evaluateAsync for async contexts

## [1.6.2] - Previous Release

### Fixed
- Return default export value from execute()

## [1.6.1] - Previous Release

### Added
- Support native module exports in moduleResolver

## [1.6.0] - Previous Release

### Added
- Native JSX parsing and execution support
- Full React integration capabilities

## [1.5.0] - Previous Release

### Added
- ExecutionController for pause/resume/abort execution

## [1.4.5] - Previous Release

### Added
- Top-level await support
- Improved spread operator functionality

## [1.4.4] - Previous Release

### Added
- Export ModuleResolution type for TypeScript consumers

## [1.4.3] - Previous Release

### Fixed
- Support spread operator in function and constructor calls

## [1.4.2] - Previous Release

### Fixed
- Add ./src/editor/wang-prism export path
