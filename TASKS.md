# @oxog/bundler - Implementation Tasks

## Phase 1: Documentation (COMPLETED)

- [x] 1.1 Create SPECIFICATION.md
- [x] 1.2 Create IMPLEMENTATION.md
- [x] 1.3 Create TASKS.md

## Phase 2: Project Setup

- [ ] 2.1 Initialize Git repository
- [ ] 2.2 Create package.json with zero dependencies
- [ ] 2.3 Create tsconfig.json with strict mode
- [ ] 2.4 Create tsup.config.ts for bundling
- [ ] 2.5 Create vitest.config.ts with coverage
- [ ] 2.6 Create .gitignore
- [ ] 2.7 Create LICENSE (MIT)
- [ ] 2.8 Create directory structure

## Phase 3: Core Types and Errors

- [ ] 3.1 Implement src/types.ts
  - [ ] BundleConfig, BundleResult types
  - [ ] OutputFormat, SourcemapOption, MinifyOption
  - [ ] Plugin interfaces
  - [ ] Kernel interfaces
  - [ ] Watcher interfaces

- [ ] 3.2 Implement src/errors.ts
  - [ ] BundlerError base class
  - [ ] EntryNotFoundError
  - [ ] ParseError
  - [ ] ResolveError
  - [ ] CircularDependencyError
  - [ ] PluginError
  - [ ] TransformError
  - [ ] OutputError

- [ ] 3.3 Write tests for errors
  - [ ] tests/unit/errors.test.ts

## Phase 4: Utilities

- [ ] 4.1 Implement src/utils/fs.ts
  - [ ] FS class with readFile, writeFile, exists, etc.
  - [ ] FileStats interface
  - [ ] Promisified fs operations

- [ ] 4.2 Implement src/utils/path.ts
  - [ ] PathUtils class
  - [ ] Cross-platform path operations
  - [ ] Relative/absolute path handling

- [ ] 4.3 Implement src/utils/hash.ts
  - [ ] HashUtils class
  - [ ] Simple string hashing algorithm
  - [ ] File content hashing

- [ ] 4.4 Implement src/utils/sourcemap.ts
  - [ ] SourceMapGenerator class
  - [ ] SourceMapConsumer class
  - [ ] Mapping interface

- [ ] 4.5 Write tests for utilities
  - [ ] tests/unit/utils/fs.test.ts
  - [ ] tests/unit/utils/path.test.ts
  - [ ] tests/unit/utils/hash.test.ts
  - [ ] tests/unit/utils/sourcemap.test.ts

## Phase 5: Micro Kernel

- [ ] 5.1 Implement src/kernel.ts
  - [ ] Kernel class
  - [ ] Plugin registry
  - [ ] Context management

- [ ] 5.2 Implement hook system
  - [ ] SyncHook class
  - [ ] AsyncSeriesHook class
  - [ ] AsyncSeriesWaterfallHook class
  - [ ] AsyncParallelHook class

- [ ] 5.3 Implement BundlerHooks interface
  - [ ] buildStart, buildEnd hooks
  - [ ] resolve, load, transform hooks
  - [ ] renderChunk, writeBundle hooks
  - [ ] watchChange hook

- [ ] 5.4 Write tests for kernel
  - [ ] tests/unit/kernel.test.ts
  - [ ] tests/unit/hooks.test.ts

## Phase 6: Dependency Graph

- [ ] 6.1 Implement src/core/graph.ts
  - [ ] DependencyGraph class
  - [ ] ModuleNode interface
  - [ ] addModule, addDependency methods
  - [ ] getDependencies, getDependents methods
  - [ ] detectCircular method
  - [ ] getBuildOrder method (topological sort)
  - [ ] prune method

- [ ] 6.2 Write tests for dependency graph
  - [ ] tests/unit/graph.test.ts

## Phase 7: JavaScript Parser

- [ ] 7.1 Implement tokenizer
  - [ ] Token interface and types
  - [ ] Tokenizer class
  - [ ] Token types: keywords, identifiers, literals, operators

- [ ] 7.2 Implement AST
  - [ ] ASTNode types
  - [ ] Parser class (recursive descent)
  - [ ] Parse import/export statements
  - [ ] Parse variable/function declarations

- [ ] 7.3 Implement scope analyzer
  - [ ] Scope class
  - [ ] ScopeAnalyzer class
  - [ ] Track variable declarations and references

- [ ] 7.4 Implement module parser
  - [ ] ModuleInfo interface
  - [ ] ModuleParser class
  - [ ] Extract imports/exports
  - [ ] Detect side effects and pure modules

- [ ] 7.5 Write tests for parser
  - [ ] tests/unit/parser/tokenizer.test.ts
  - [ ] tests/unit/parser/ast.test.ts
  - [ ] tests/unit/parser/scope.test.ts
  - [ ] tests/unit/parser/module.test.ts

## Phase 8: Module Resolver

- [ ] 8.1 Implement src/core/resolver.ts
  - [ ] ModuleResolver class
  - [ ] ResolveOptions interface
  - [ ] resolve, resolveSync methods
  - [ ] Handle relative paths
  - [ ] Handle absolute paths
  - [ ] Handle bare modules (node_modules)
  - [ ] Support package.json (main, module, exports)
  - [ ] File extension resolution
  - [ ] Index file resolution
  - [ ] Path alias support

- [ ] 8.2 Write tests for resolver
  - [ ] tests/unit/resolver.test.ts

## Phase 9: Bundle Linker

- [ ] 9.1 Implement src/core/linker.ts
  - [ ] BundleLinker class
  - [ ] BundleOptions, OutputBundle interfaces
  - [ ] Chunk interface
  - [ ] link method
  - [ ] Generate chunks from graph
  - [ ] Transform code to ESM format
  - [ ] Transform code to CJS format
  - [ ] Transform code to IIFE format
  - [ ] Link chunks together

- [ ] 9.2 Write tests for linker
  - [ ] tests/unit/linker.test.ts

## Phase 10: Plugin System

- [ ] 10.1 Implement plugin interface
  - [ ] Plugin interface in types.ts
  - [ ] PluginFactory type
  - [ ] definePlugin function

- [ ] 10.2 Implement core plugins
  - [ ] src/plugins/core/js-parser.ts
  - [ ] src/plugins/core/resolver.ts
  - [ ] src/plugins/core/linker.ts

- [ ] 10.3 Write tests for core plugins
  - [ ] tests/unit/plugins/js-parser.test.ts
  - [ ] tests/unit/plugins/resolver.test.ts
  - [ ] tests/unit/plugins/linker.test.ts

## Phase 11: Optional Plugins

- [ ] 11.1 Implement typescript plugin
  - [ ] src/plugins/optional/typescript.ts
  - [ ] stripTypes function (zero-dep)
  - [ ] Full TypeScript transpilation (peer dep)
  - [ ] Declaration file generation

- [ ] 11.2 Implement minifier plugin
  - [ ] src/plugins/optional/minifier.ts
  - [ ] basicMinify function (zero-dep)
  - [ ] Full terser integration (peer dep)

- [ ] 11.3 Implement CSS plugin
  - [ ] src/plugins/optional/css.ts
  - [ ] parseCSS function
  - [ ] transformCSS function
  - [ ] CSS Modules support
  - [ ] CSS extraction/injection

- [ ] 11.4 Implement assets plugin
  - [ ] src/plugins/optional/assets.ts
  - [ ] isAsset function
  - [ ] loadAsset function
  - [ ] Base64 inlining
  - [ ] Public path handling

- [ ] 11.5 Implement sourcemaps plugin
  - [ ] src/plugins/optional/sourcemaps.ts
  - [ ] generateSourceMap function
  - [ ] Handle inline/external/hidden options

- [ ] 11.6 Implement splitting plugin
  - [ ] src/plugins/optional/splitting.ts
  - [ ] splitChunks function
  - [ ] Entry point splitting
  - [ ] Dynamic import chunking
  - [ ] Shared chunk extraction

- [ ] 11.7 Implement treeshake plugin
  - [ ] src/plugins/optional/treeshake.ts
  - [ ] treeShake function
  - [ ] Unused export detection
  - [ ] Dead code elimination

- [ ] 11.8 Create plugin exports
  - [ ] src/plugins/index.ts

- [ ] 11.9 Write tests for optional plugins
  - [ ] tests/unit/plugins/typescript.test.ts
  - [ ] tests/unit/plugins/minifier.test.ts
  - [ ] tests/unit/plugins/css.test.ts
  - [ ] tests/unit/plugins/assets.test.ts
  - [ ] tests/unit/plugins/sourcemaps.test.ts
  - [ ] tests/unit/plugins/splitting.test.ts
  - [ ] tests/unit/plugins/treeshake.test.ts

## Phase 12: Configuration

- [ ] 12.1 Implement src/config.ts
  - [ ] normalizeConfig function
  - [ ] validateConfig function
  - [ ] loadConfigFile function
  - [ ] resolveConfig function

- [ ] 12.2 Write tests for config
  - [ ] tests/unit/config.test.ts

## Phase 13: Main API

- [ ] 13.1 Implement src/index.ts
  - [ ] bundle function
  - [ ] watch function
  - [ ] defineConfig function
  - [ ] definePlugin function
  - [ ] Export all public APIs

- [ ] 13.2 Implement src/cli.ts
  - [ ] CLI entry point
  - [ ] Argument parsing
  - [ ] Help output
  - [ ] Version output

- [ ] 13.3 Write tests for main API
  - [ ] tests/integration/bundle.test.ts
  - [ ] tests/integration/watch.test.ts
  - [ ] tests/integration/cli.test.ts

## Phase 14: Test Fixtures

- [ ] 14.1 Create test fixtures
  - [ ] tests/fixtures/simple-lib/
  - [ ] tests/fixtures/typescript-lib/
  - [ ] tests/fixtures/with-css/
  - [ ] tests/fixtures/circular-deps/
  - [ ] tests/fixtures/multi-entry/
  - [ ] tests/fixtures/with-dynamic-imports/

## Phase 15: Ensure 100% Coverage

- [ ] 15.1 Run coverage report
- [ ] 15.2 Review uncovered lines
- [ ] 15.3 Add tests for uncovered code
- [ ] 15.4 Verify all thresholds met
  - [ ] Lines: 100%
  - [ ] Branches: 100%
  - [ ] Functions: 100%
  - [ ] Statements: 100%

## Phase 16: Examples

- [ ] 16.1 Create 01-basic examples
  - [ ] examples/01-basic/simple-lib/
  - [ ] examples/01-basic/multi-entry/
  - [ ] examples/01-basic/typescript/

- [ ] 16.2 Create 02-output-formats examples
  - [ ] examples/02-output-formats/esm-only/
  - [ ] examples/02-output-formats/dual-esm-cjs/
  - [ ] examples/02-output-formats/iife-browser/

- [ ] 16.3 Create 03-features examples
  - [ ] examples/03-features/tree-shaking/
  - [ ] examples/03-features/code-splitting/
  - [ ] examples/03-features/css-bundling/
  - [ ] examples/03-features/assets/

- [ ] 16.4 Create 04-plugins examples
  - [ ] examples/04-plugins/using-plugins/
  - [ ] examples/04-plugins/custom-plugin/
  - [ ] examples/04-plugins/plugin-composition/

- [ ] 16.5 Create 05-watch-mode examples
  - [ ] examples/05-watch-mode/basic-watch/
  - [ ] examples/05-watch-mode/with-server/

- [ ] 16.6 Create 06-real-world examples
  - [ ] examples/06-real-world/npm-package/
  - [ ] examples/06-real-world/react-library/
  - [ ] examples/06-real-world/cli-tool/
  - [ ] examples/06-real-world/monorepo/

## Phase 17: LLM-Native Files

- [ ] 17.1 Create llms.txt
  - [ ] Installation instructions
  - [ ] Basic usage
  - [ ] CLI examples
  - [ ] API summary
  - [ ] Common patterns
  - [ ] Error codes

- [ ] 17.2 Optimize README.md
  - [ ] First 500 tokens optimized for LLMs
  - [ ] Clear, predictable API documentation
  - [ ] Rich examples

## Phase 18: MCP Server

- [ ] 18.1 Initialize MCP server
  - [ ] mcp/package.json
  - [ ] mcp/index.ts

- [ ] 18.2 Implement MCP tools
  - [ ] mcp/tools/generate-config.ts
  - [ ] mcp/tools/diagnose-error.ts
  - [ ] mcp/tools/analyze-bundle.ts
  - [ ] mcp/tools/suggest-splitting.ts
  - [ ] mcp/tools/migrate-from.ts

- [ ] 18.3 Write tests for MCP server
  - [ ] mcp/tools/*.test.ts

## Phase 19: Website

- [ ] 19.1 Setup website project
  - [ ] website/package.json
  - [ ] website/vite.config.ts
  - [ ] website/tsconfig.json

- [ ] 19.2 Create website components
  - [ ] website/src/components/CodeBlock.tsx
  - [ ] website/src/components/Header.tsx
  - [ ] website/src/components/Footer.tsx
  - [ ] website/src/components/Navigation.tsx

- [ ] 19.3 Create website pages
  - [ ] website/src/pages/Home.tsx
  - [ ] website/src/pages/GettingStarted.tsx
  - [ ] website/src/pages/Configuration.tsx
  - [ ] website/src/pages/API.tsx
  - [ ] website/src/pages/Plugins.tsx
  - [ ] website/src/pages/Examples.tsx
  - [ ] website/src/pages/Migration.tsx

- [ ] 19.4 Create website assets
  - [ ] website/public/CNAME (bundler.oxog.dev)
  - [ ] website/public/llms.txt

- [ ] 19.5 Configure deployment
  - [ ] .github/workflows/deploy.yml

## Phase 20: Finalization

- [ ] 20.1 Run all tests
- [ ] 20.2 Run type check
- [ ] 20.3 Run lint
- [ ] 20.4 Build package
- [ ] 20.5 Test CLI
- [ ] 20.6 Build website
- [ ] 20.7 Verify all examples
- [ ] 20.8 Update CHANGELOG.md
- [ ] 20.9 Final review

## Task Dependencies

```
Phase 1 (Documentation)
  ↓
Phase 2 (Project Setup)
  ↓
Phase 3 (Types & Errors) → Phase 4 (Utilities)
                          ↓
                    Phase 5 (Kernel)
                          ↓
Phase 6 (Dependency Graph) ← Phase 4
Phase 7 (Parser) ← Phase 4
Phase 8 (Resolver) ← Phase 4
Phase 9 (Linker) ← Phase 6
         ↓
Phase 10 (Plugin System) ← Phase 5,6,7,8,9
         ↓
Phase 11 (Optional Plugins) ← Phase 10
         ↓
Phase 12 (Configuration) ← Phase 3
         ↓
Phase 13 (Main API) ← Phase 5,6,7,8,9,10,11,12
         ↓
Phase 14 (Test Fixtures)
         ↓
Phase 15 (100% Coverage) ← Phase 3-14
         ↓
Phase 16 (Examples) ← Phase 13
         ↓
Phase 17 (LLM-Native) ← Phase 16
Phase 18 (MCP Server) ← Phase 13
Phase 19 (Website) ← Phase 17
         ↓
Phase 20 (Finalization) ← All phases
```

## Success Criteria

Each phase is complete when:
- All tasks in the phase are checked
- All tests pass
- Coverage is maintained at 100%
- Code follows TypeScript strict mode
- ESLint passes without errors
- Public APIs have JSDoc with @example

## Notes

- Follow TASKS.md sequentially
- Write tests before or with each feature
- Maintain 100% coverage throughout
- Zero runtime dependencies (only devDependencies)
- All tests must pass before proceeding
- Do not skip phases or tasks
