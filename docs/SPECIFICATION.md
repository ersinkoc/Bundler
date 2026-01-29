# @oxog/bundler - Complete Package Specification

## Package Identity

| Field | Value |
|-------|-------|
| **NPM Package** | `@oxog/bundler` |
| **GitHub Repository** | `https://github.com/ersinkoc/bundler` |
| **Documentation Site** | `https://bundler.oxog.dev` |
| **License** | MIT |
| **Author** | Ersin Koç |

## Overview

@oxog/bundler is a zero-dependency, minimal JavaScript/TypeScript bundler with a micro-kernel plugin architecture. It provides:

- **Zero Runtime Dependencies**: Everything implemented from scratch
- **Plugin Architecture**: Extensible micro-kernel design
- **ESM & CJS Support**: Multiple output formats
- **Tree Shaking**: Dead code elimination
- **Code Splitting**: Automatic and manual chunking
- **TypeScript**: Built-in type stripping with optional full support
- **CSS Bundling**: Native CSS processing
- **Asset Handling**: Images, fonts, and static files
- **Watch Mode**: Incremental rebuilds
- **LLM-Native**: Optimized for AI assistants

## Core Features

### 1. JavaScript/ESM Parsing

Handles all JavaScript module syntaxes:
- ESM imports/exports
- Dynamic imports
- CommonJS require
- Re-exports
- Named and default exports

### 2. Module Resolution

Node.js-compatible resolution:
- `node_modules` lookup
- Relative paths
- Path aliases
- File extensions
- Index files
- Package.json `exports` field

### 3. Multiple Output Formats

- **ESM**: Native ES modules
- **CJS**: CommonJS format
- **IIFE**: Immediately Invoked Function Expression for browsers

### 4. Tree Shaking

Static analysis-based dead code elimination:
- Unused export detection
- Module side effects tracking
- `/*#__PURE__*/` annotation support
- Property read side effects configuration

### 5. Code Splitting

Automatic and manual code splitting:
- Entry point splitting
- Dynamic import chunking
- Chunk naming patterns
- Shared chunk extraction

### 6. Minification

Two-level minification:
- **Basic**: Whitespace removal, comment stripping (zero-dep)
- **Full**: Compression, variable mangling via terser (peer dep)

### 7. Source Maps

Multiple source map formats:
- External `.map` files
- Inline source maps
- Hidden source maps

### 8. TypeScript Support

Built-in type stripping:
- Fast type removal without type checking
- Optional full TypeScript support via peer dependency
- Declaration file generation

### 9. CSS Bundling

Native CSS processing:
- CSS import resolution
- CSS Modules support
- Extraction or injection
- CSS minification

### 10. Asset Handling

Static asset processing:
- Image optimization
- Font embedding
- Base64 inlining
- Public path configuration

### 11. Watch Mode

File watching with incremental builds:
- Debounced rebuilds
- Event emission
- Error handling
- Multiple entry point support

### 12. Plugin System

Extensible architecture:
- Hook-based plugin API
- Plugin dependencies
- Lifecycle management
- Core and optional plugins

## API Surface

### Main Functions

```typescript
/**
 * Bundle source files with given configuration.
 *
 * @param config - Bundle configuration
 * @returns Build result with outputs and metadata
 *
 * @example
 * ```typescript
 * const result = await bundle({
 *   entry: 'src/index.ts',
 *   outDir: 'dist',
 *   format: ['esm', 'cjs'],
 *   minify: true
 * });
 * ```
 */
export async function bundle(config: BundleConfig): Promise<BundleResult>

/**
 * Watch files and rebuild on changes.
 *
 * @param config - Bundle configuration
 * @returns Watcher instance with event listeners
 *
 * @example
 * ```typescript
 * const watcher = await watch({
 *   entry: 'src/index.ts',
 *   outDir: 'dist'
 * });
 *
 * watcher.on('end', (result) => console.log('Built!'));
 * await watcher.close();
 * ```
 */
export async function watch(config: BundleConfig): Promise<Watcher>
```

### Config Helpers

```typescript
/**
 * Define bundler configuration with type safety.
 *
 * @param config - Configuration object or factory function
 * @returns Typed configuration
 *
 * @example
 * ```typescript
 * export default defineConfig({
 *   entry: 'src/index.ts',
 *   outDir: 'dist'
 * });
 * ```
 */
export function defineConfig(config: BundleConfig | ConfigFactory): BundleConfig

/**
 * Define a bundler plugin.
 *
 * @param plugin - Plugin definition
 * @returns Plugin function
 *
 * @example
 * ```typescript
 * const myPlugin = definePlugin({
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install(kernel) {
 *     kernel.hooks.transform.tap('my-plugin', (code) => code);
 *   }
 * });
 * ```
 */
export function definePlugin<TContext = BundlerContext>(plugin: Plugin<TContext>): Plugin<TContext>
```

### Bundle Configuration

```typescript
export interface BundleConfig {
  entry: Entry
  outDir: string
  format?: OutputFormat[]
  globalName?: string
  minify?: MinifyOption
  splitting?: boolean
  treeshake?: boolean | TreeshakeOptions
  sourcemap?: SourcemapOption
  external?: (string | RegExp)[]
  alias?: Record<string, string>
  define?: Record<string, string>
  target?: string | string[]
  plugins?: Plugin[]
  typescript?: TypeScriptOptions
  watch?: boolean | WatchOptions
  chunkNames?: string
  entryNames?: string
  assetNames?: string
  publicPath?: string
  cwd?: string
}

export type Entry = string | string[] | Record<string, string>
export type OutputFormat = 'esm' | 'cjs' | 'iife'
export type SourcemapOption = boolean | 'inline' | 'external' | 'hidden'
export type MinifyOption = boolean | 'basic' | 'full' | MinifyConfig
```

### Result Types

```typescript
export interface BundleResult {
  outputs: OutputFile[]
  duration: number
  graph: DependencyGraph
  warnings: Warning[]
}

export interface OutputFile {
  path: string
  contents: Uint8Array
  size: number
  entryPoint?: string
  format: OutputFormat
  exports?: string[]
  imports?: string[]
}

export interface Watcher {
  on<E extends WatchEvent>(event: E, handler: WatchEventHandler<E>): this
  off<E extends WatchEvent>(event: E, handler: WatchEventHandler<E>): this
  close(): Promise<void>
}

export type WatchEvent = 'start' | 'end' | 'error' | 'change'
```

## Plugin Interface

```typescript
export interface Plugin<TContext = BundlerContext> {
  name: string
  version: string
  dependencies?: string[]
  install: (kernel: Kernel<TContext>) => void
  onInit?: (context: TContext) => void | Promise<void>
  onDestroy?: () => void | Promise<void>
  onError?: (error: Error) => void
}
```

## Kernel Hooks

```typescript
export interface BundlerHooks {
  buildStart: SyncHook<[BuildOptions]>
  buildEnd: SyncHook<[BuildResult]>
  resolve: AsyncSeriesWaterfallHook<[ResolveArgs], ResolveResult>
  load: AsyncSeriesWaterfallHook<[LoadArgs], LoadResult>
  transform: AsyncSeriesWaterfallHook<[TransformArgs], TransformResult>
  renderChunk: AsyncSeriesWaterfallHook<[RenderChunkArgs], RenderChunkResult>
  writeBundle: AsyncParallelHook<[OutputBundle]>
  watchChange: SyncHook<[string, ChangeType]>
}
```

## Core Plugins

### Always Loaded

| Plugin | Description |
|--------|-------------|
| `js-parser` | JavaScript/ESM parsing |
| `resolver` | Module resolution |
| `linker` | Bundle generation |

### Optional

| Plugin | Description | Function |
|--------|-------------|----------|
| `typescript` | TypeScript transpilation | `typescriptPlugin()` |
| `minifier` | Code minification | `minifierPlugin()` |
| `css` | CSS bundling | `cssPlugin()` |
| `assets` | Asset handling | `assetsPlugin()` |
| `sourcemaps` | Source map generation | `sourcemapsPlugin()` |
| `splitting` | Code splitting | `splittingPlugin()` |
| `treeshake` | Tree shaking | `treeshakePlugin()` |

## Technical Requirements

### Dependencies

- **Runtime**: ZERO (none allowed)
- **Dev Dependencies**: typescript, vitest, @vitest/coverage-v8, tsup, @types/node, prettier, eslint
- **Peer Dependencies** (optional): typescript, terser

### Environment

- **Node.js**: >= 18
- **TypeScript**: >= 5.0
- **Module**: ESM + CJS output

### Bundle Size Targets

- **Core**: < 15KB gzipped
- **All Plugins**: < 60KB gzipped

## Error Codes

| Code | Meaning |
|------|---------|
| `ENTRY_NOT_FOUND` | Entry file doesn't exist |
| `PARSE_ERROR` | Failed to parse file |
| `RESOLVE_ERROR` | Module not found |
| `CIRCULAR_DEP` | Circular dependency detected |
| `PLUGIN_ERROR` | Plugin failed |
| `TRANSFORM_ERROR` | Transformation failed |
| `OUTPUT_ERROR` | Failed to write output |

## LLM-Native Requirements

1. **llms.txt** file in root (< 2000 tokens)
2. **Predictable API**: `bundle()`, `watch()`, `defineConfig()`, `definePlugin()`
3. **Rich JSDoc** with `@example` on every public API
4. **15+ examples** organized by category
5. **README** optimized for LLM consumption

## CLI Interface

```bash
bundler <entry> [options]

Options:
  -o, --out <dir>        Output directory (default: dist)
  -f, --format <formats> Output formats: esm,cjs,iife (default: esm)
  -m, --minify           Enable minification
  -w, --watch            Enable watch mode
  -c, --config <file>    Config file path
  --sourcemap            Generate source maps
  --splitting            Enable code splitting
  --external <deps>      External dependencies
  --global-name <name>   Global name for IIFE
  --target <target>      Target environment
  --no-treeshake         Disable tree shaking
  -h, --help             Show help
  -v, --version          Show version
```

## Testing Requirements

- **Framework**: Vitest
- **Coverage**: 100% (lines, branches, functions, statements)
- **Coverage Thresholds**: Enforced in vitest.config.ts
- **All Tests Must Pass**: No exceptions

## Distribution

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "bundler": "./dist/cli.js",
    "oxog-bundler": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./plugins": {
      "import": "./dist/plugins/index.js",
      "require": "./dist/plugins/index.cjs"
    }
  }
}
```

## Documentation Requirements

### Website

- **Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS
- **Domain**: bundler.oxog.dev
- **Code Blocks**: IDE-style with line numbers, syntax highlighting, copy button
- **Pages**: Home, Getting Started, Configuration, API, Plugins, Examples, Migration

### MCP Server

- **generate-config**: Generate bundler config
- **diagnose-error**: Analyze build errors
- **analyze-bundle**: Bundle size analysis
- **suggest-splitting**: Code splitting strategies
- **migrate-from**: Migration from other bundlers

### Examples Structure

```
examples/
├── 01-basic/          # Basic bundling
├── 02-output-formats/ # ESM/CJS/IIFE
├── 03-features/      # Tree shaking, splitting, CSS
├── 04-plugins/        # Plugin usage
├── 05-watch-mode/     # Watch mode
└── 06-real-world/     # Real projects
```

## Quality Standards

- **100% Test Coverage**: Every line, branch, and function tested
- **TypeScript Strict Mode**: All strict checks enabled
- **ESLint**: All rules passing
- **Zero Runtime Dependencies**: Only optional peer dependencies
- **Comprehensive Documentation**: JSDoc on all public APIs
- **LLM-Optimized**: Predictable naming, rich examples, llms.txt

## License

MIT License - Free for commercial and personal use
