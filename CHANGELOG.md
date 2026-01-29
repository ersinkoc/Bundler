# Changelog

All notable changes to @oxog/bundler will be documented in this file.

## [1.0.1] - 2026-01-28

### Fixed
- Critical bug in BundleLinker where `usedExports` variable was undefined
- Entry module exports now correctly preserved in all output formats (ESM, CJS, IIFE)
- Fixed hardcoded "App" globalName in IIFE wrapper - now uses config option
- Fixed TypeScript type mismatches in index.ts
- Fixed BundleResult/OutputBundle return type mismatch
- Added missing `manualChunks` property to LinkerOptions interface

### Changed
- Moved documentation files to `docs/` folder
- Updated README with accurate feature list
- Tree shaking now listed as working feature

### Documentation
- Reorganized project documentation structure
- Updated copyright year to 2026

## [1.0.0] - 2025-01-21

### Added
- Initial release
- Zero-dependency JavaScript/TypeScript bundler
- Micro-kernel plugin architecture
- JavaScript/ESM parser
- Module resolver (Node.js compatible)
- Bundle linker (ESM, CJS, IIFE)
- Dependency graph with circular dependency detection
- Plugin system with hooks
- Core plugins: js-parser, resolver, linker
- Optional plugins: typescript, minifier, css, assets, sourcemaps, splitting, treeshake
- CLI interface
- Config file support (bundler.config.ts/js)
- Watch mode support (basic)
- LLM-native design with llms.txt

### Features
- Zero runtime dependencies (only devDependencies)
- 100% TypeScript strict mode
- Tree shaking
- Path aliases
- External packages
- Multiple output formats
- Multiple entry points
- Custom plugins
