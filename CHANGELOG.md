# Changelog

All notable changes to @oxog/bundler will be documented in this file.

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
- MCP server for AI-assisted operations

### Features
- Zero runtime dependencies (only devDependencies)
- 100% TypeScript strict mode
- Tree shaking
- Code splitting
- Minification (basic built-in, full via terser peer dep)
- Source maps
- TypeScript type stripping (fast mode)
- CSS bundling
- Asset handling
- Path aliases
- External packages
- Multiple output formats
- Multiple entry points
- Custom plugins

### Documentation
- SPECIFICATION.md - Complete package specification
- IMPLEMENTATION.md - Architecture and design decisions
- TASKS.md - Ordered task list
- README.md - User documentation
- llms.txt - LLM-optimized documentation (< 2000 tokens)
- Examples in examples/ directory
