# @oxog/bundler - Zero-Dependency NPM Package

## Package Identity

| Field | Value |
|-------|-------|
| **NPM Package** | `@oxog/bundler` |
| **GitHub Repository** | `https://github.com/ersinkoc/bundler` |
| **Documentation Site** | `https://bundler.oxog.dev` |
| **License** | MIT |
| **Author** | Ersin Koç (ersinkoc) |

> **NO social media, Discord, email, or external links allowed.**

---

## Package Description

**One-line:** Minimal JavaScript/TypeScript bundler with plugin architecture

A zero-dependency, plugin-based JavaScript/TypeScript bundler that supports ESM and CJS output, tree shaking, code splitting, minification, source maps, CSS bundling, and asset handling. Built with micro-kernel architecture for maximum extensibility, featuring watch mode and a comprehensive plugin system. Designed for both library bundling and application builds with minimal configuration.

---

## NON-NEGOTIABLE RULES

These rules are **ABSOLUTE** and must be followed without exception.

### 1. ZERO RUNTIME DEPENDENCIES

```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```

- Implement EVERYTHING from scratch
- No lodash, no axios, no moment - nothing
- Write your own utilities, parsers, validators
- If you think you need a dependency, you don't

**Allowed devDependencies only:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0"
  }
}
```

**Allowed peerDependencies (optional):**
```json
{
  "peerDependencies": {
    "typescript": ">=5.0.0",
    "terser": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "typescript": { "optional": true },
    "terser": { "optional": true }
  }
}
```

### 2. 100% TEST COVERAGE

- Every line of code must be tested
- Every branch must be tested
- Every function must be tested
- **All tests must pass** (100% success rate)
- Use Vitest for testing
- Coverage thresholds enforced in config

### 3. MICRO-KERNEL ARCHITECTURE

All packages MUST use plugin-based architecture:

```
┌─────────────────────────────────────────────────────────┐
│                      User Code                           │
│  bundle() · watch() · defineConfig() · definePlugin()   │
├─────────────────────────────────────────────────────────┤
│                   Plugin Registry API                    │
│          use() · register() · unregister() · list()     │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│    JS    │ Resolver │  Linker  │ Optional │  Community  │
│  Parser  │          │          │ Plugins  │   Plugins   │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│                     Micro Kernel                         │
│  Dependency Graph · Plugin Lifecycle · File System      │
│  Watch Coordinator · Event Bus · Error Boundary         │
└─────────────────────────────────────────────────────────┘
```

**Kernel responsibilities (minimal):**
- Plugin registration and lifecycle
- Dependency graph construction and resolution
- Event bus for inter-plugin communication
- Error boundary and recovery
- File system abstraction
- Watch mode coordination
- Configuration management

### 4. DEVELOPMENT WORKFLOW

Create these documents **FIRST**, before any code:

1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions  
3. **TASKS.md** - Ordered task list with dependencies

Only after all three documents are complete, implement code following TASKS.md sequentially.

### 5. TYPESCRIPT STRICT MODE

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

### 6. LLM-NATIVE DESIGN

Package must be designed for both humans AND AI assistants:

- **llms.txt** file in root (< 2000 tokens)
- **Predictable API** naming (`bundle`, `watch`, `define*`, `create*`)
- **Rich JSDoc** with @example on every public API
- **15+ examples** organized by category
- **README** optimized for LLM consumption

### 7. NO EXTERNAL LINKS

- ✅ GitHub repository URL
- ✅ Custom domain (bundler.oxog.dev)
- ✅ npm package URL
- ❌ Social media (Twitter, LinkedIn, etc.)
- ❌ Discord/Slack links
- ❌ Email addresses
- ❌ Donation/sponsor links

---

## CORE FEATURES

### 1. JavaScript/ESM Parsing

Built-in JavaScript parser that handles ESM imports/exports, dynamic imports, and CommonJS require statements.

**API Example:**
```typescript
// Parser handles all module syntaxes
import { foo } from './foo';
import * as bar from './bar';
export { baz } from './baz';
const dynamic = await import('./dynamic');
const cjs = require('./cjs');
```

### 2. Module Resolution

Node.js-compatible module resolution supporting node_modules, path aliases, and custom resolution strategies.

**API Example:**
```typescript
await bundle({
  entry: 'src/index.ts',
  alias: {
    '@': './src',
    '~utils': './src/utils'
  },
  external: ['react', 'react-dom']
});
```

### 3. Multiple Output Formats

Generate ESM, CJS, and IIFE bundles from a single source.

**API Example:**
```typescript
await bundle({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs', 'iife'],
  globalName: 'MyLib' // for IIFE
});
```

### 4. Tree Shaking

Dead code elimination through static analysis of imports and exports.

**API Example:**
```typescript
await bundle({
  entry: 'src/index.ts',
  treeshake: true, // enabled by default
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false
  }
});
```

### 5. Code Splitting

Automatic or manual code splitting for optimal loading.

**API Example:**
```typescript
await bundle({
  entry: {
    main: 'src/index.ts',
    worker: 'src/worker.ts'
  },
  splitting: true,
  chunkNames: '[name]-[hash].js'
});
```

### 6. Minification

Built-in basic minification with optional terser integration for advanced optimization.

**API Example:**
```typescript
// Basic minification (zero-dep)
await bundle({ minify: true });
await bundle({ minify: 'basic' });

// Advanced minification (requires terser peer dep)
await bundle({ minify: 'full' });
await bundle({
  minify: {
    compress: true,
    mangle: true,
    format: { comments: false }
  }
});
```

### 7. Source Maps

Generate inline or external source maps for debugging.

**API Example:**
```typescript
await bundle({
  sourcemap: true,           // external .map files
  sourcemap: 'inline',       // inline in bundle
  sourcemap: 'external',     // separate .map files
  sourcemap: 'hidden'        // generate but don't reference
});
```

### 8. TypeScript Support

Built-in type stripping with optional full TypeScript support via peer dependency.

**API Example:**
```typescript
// Type stripping only (zero-dep, fast)
await bundle({
  entry: 'src/index.ts'
  // TypeScript works out of the box
});

// Full TypeScript support (requires typescript peer dep)
await bundle({
  entry: 'src/index.ts',
  typescript: {
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: 'dist/types'
  }
});
```

### 9. CSS Bundling

Built-in CSS parser and bundler with import resolution.

**API Example:**
```typescript
await bundle({
  entry: 'src/index.ts',
  plugins: [
    cssPlugin({
      inject: true,          // inject into JS
      extract: 'styles.css', // or extract to file
      modules: true,         // CSS modules support
      minify: true
    })
  ]
});
```

### 10. Asset Handling

Handle images, fonts, and other static assets.

**API Example:**
```typescript
await bundle({
  entry: 'src/index.ts',
  plugins: [
    assetsPlugin({
      include: ['**/*.png', '**/*.svg', '**/*.woff2'],
      output: 'assets',
      publicPath: '/assets/',
      inline: { maxSize: 4096 } // inline < 4KB as base64
    })
  ]
});
```

### 11. Watch Mode

File watching with incremental rebuilds.

**API Example:**
```typescript
// Simple watch
await bundle({ ...config, watch: true });

// Advanced watch with events
const watcher = await watch(config);

watcher.on('start', () => console.log('Build starting...'));
watcher.on('end', (result) => console.log('Build complete:', result));
watcher.on('error', (error) => console.error('Build failed:', error));

// Stop watching
await watcher.close();
```

### 12. Plugin System

Extensible plugin architecture for custom transformations.

**API Example:**
```typescript
import { definePlugin } from '@oxog/bundler';

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  
  install(kernel) {
    kernel.hooks.transform.tap('my-plugin', (code, id) => {
      // Transform code
      return { code, map: null };
    });
  },
  
  onInit(context) {
    console.log('Plugin initialized');
  },
  
  onDestroy() {
    console.log('Plugin destroyed');
  }
});

await bundle({
  plugins: [myPlugin()]
});
```

### 13. Config File Support

Load configuration from bundler.config.ts or bundler.config.js.

**API Example:**
```typescript
// bundler.config.ts
import { defineConfig } from '@oxog/bundler';

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  minify: true,
  plugins: []
});

// Or with environment-based config
export default defineConfig(({ mode, command }) => ({
  minify: mode === 'production',
  sourcemap: mode === 'development'
}));
```

### 14. CLI Interface

Full-featured command line interface.

**API Example:**
```bash
# Basic usage
npx @oxog/bundler src/index.ts

# With options
npx @oxog/bundler src/index.ts --out dist --format esm,cjs --minify

# Watch mode
npx @oxog/bundler src/index.ts --watch

# Multiple entries
npx @oxog/bundler src/index.ts src/cli.ts --out dist

# Use config file
npx @oxog/bundler --config bundler.config.ts

# Help
npx @oxog/bundler --help
```

---

## PLUGIN SYSTEM

### Plugin Interface

```typescript
/**
 * Plugin interface for extending bundler functionality.
 * 
 * @typeParam TContext - Shared context type between plugins
 * 
 * @example
 * ```typescript
 * const myPlugin = definePlugin({
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install(kernel) {
 *     kernel.hooks.transform.tap('my-plugin', (code, id) => code);
 *   }
 * });
 * ```
 */
export interface Plugin<TContext = BundlerContext> {
  /** Unique plugin identifier (kebab-case) */
  name: string;
  
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Other plugins this plugin depends on */
  dependencies?: string[];
  
  /**
   * Called when plugin is registered.
   * Use this to tap into kernel hooks.
   * @param kernel - The kernel instance
   */
  install: (kernel: Kernel<TContext>) => void;
  
  /**
   * Called after all plugins are installed.
   * @param context - Shared context object
   */
  onInit?: (context: TContext) => void | Promise<void>;
  
  /**
   * Called when plugin is unregistered.
   */
  onDestroy?: () => void | Promise<void>;
  
  /**
   * Called on error in this plugin.
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}
```

### Kernel Hooks

```typescript
/**
 * Available hooks for plugins to tap into.
 */
export interface BundlerHooks {
  /** Called before build starts */
  buildStart: SyncHook<[BuildOptions]>;
  
  /** Called after build completes */
  buildEnd: SyncHook<[BuildResult]>;
  
  /** Resolve module path */
  resolve: AsyncSeriesWaterfallHook<[ResolveArgs], ResolveResult>;
  
  /** Load module content */
  load: AsyncSeriesWaterfallHook<[LoadArgs], LoadResult>;
  
  /** Transform module content */
  transform: AsyncSeriesWaterfallHook<[TransformArgs], TransformResult>;
  
  /** Generate output chunks */
  renderChunk: AsyncSeriesWaterfallHook<[RenderChunkArgs], RenderChunkResult>;
  
  /** Write output files */
  writeBundle: AsyncParallelHook<[OutputBundle]>;
  
  /** Called on watch rebuild */
  watchChange: SyncHook<[string, ChangeType]>;
}
```

### Core Plugins (Always Loaded)

| Plugin | Description |
|--------|-------------|
| `js-parser` | JavaScript/ESM parsing with import/export extraction |
| `resolver` | Node.js-compatible module resolution |
| `linker` | Bundle generation and chunk linking |

### Optional Plugins (Opt-in)

| Plugin | Description | Enable |
|--------|-------------|--------|
| `typescript` | TypeScript transpilation (type-stripping or full via peer dep) | `use(typescriptPlugin())` |
| `minifier` | Code minification (basic built-in or full via terser peer dep) | `use(minifierPlugin())` |
| `css` | CSS parsing, bundling, and modules | `use(cssPlugin())` |
| `assets` | Static asset handling (images, fonts) | `use(assetsPlugin())` |
| `sourcemaps` | Source map generation | `use(sourcemapsPlugin())` |
| `splitting` | Code splitting and chunking | `use(splittingPlugin())` |
| `treeshake` | Tree shaking and dead code elimination | `use(treeshakePlugin())` |

---

## API DESIGN

### Main Export

```typescript
import { 
  // Core functions
  bundle,
  watch,
  
  // Config helpers
  defineConfig,
  definePlugin,
  
  // Plugins
  typescriptPlugin,
  minifierPlugin,
  cssPlugin,
  assetsPlugin,
  sourcemapsPlugin,
  splittingPlugin,
  treeshakePlugin,
  
  // Types
  type BundleConfig,
  type BundleResult,
  type Plugin,
  type Watcher
} from '@oxog/bundler';

// Basic usage
const result = await bundle({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs']
});

// Watch mode
const watcher = await watch({
  entry: 'src/index.ts',
  outDir: 'dist'
});
```

### Type Definitions

```typescript
/**
 * Entry point configuration.
 * Can be a single path, array of paths, or named entries.
 * 
 * @example
 * ```typescript
 * // Single entry
 * entry: 'src/index.ts'
 * 
 * // Multiple entries
 * entry: ['src/index.ts', 'src/cli.ts']
 * 
 * // Named entries
 * entry: { main: 'src/index.ts', cli: 'src/cli.ts' }
 * ```
 */
export type Entry = string | string[] | Record<string, string>;

/**
 * Output format configuration.
 */
export type OutputFormat = 'esm' | 'cjs' | 'iife';

/**
 * Source map configuration.
 */
export type SourcemapOption = boolean | 'inline' | 'external' | 'hidden';

/**
 * Minification configuration.
 */
export type MinifyOption = boolean | 'basic' | 'full' | MinifyConfig;

export interface MinifyConfig {
  /** Enable compression (default: true) */
  compress?: boolean;
  /** Enable variable mangling (default: true) */
  mangle?: boolean;
  /** Output formatting options */
  format?: {
    /** Remove comments (default: true) */
    comments?: boolean;
    /** Preserve specific comments */
    preserveComments?: RegExp | 'license';
  };
}

/**
 * Bundle configuration options.
 */
export interface BundleConfig {
  /** Entry point(s) */
  entry: Entry;
  
  /** Output directory */
  outDir: string;
  
  /** Output formats (default: ['esm']) */
  format?: OutputFormat[];
  
  /** Global name for IIFE builds */
  globalName?: string;
  
  /** Enable minification */
  minify?: MinifyOption;
  
  /** Enable code splitting */
  splitting?: boolean;
  
  /** Enable tree shaking (default: true) */
  treeshake?: boolean | TreeshakeOptions;
  
  /** Source map generation */
  sourcemap?: SourcemapOption;
  
  /** External packages (don't bundle) */
  external?: (string | RegExp)[];
  
  /** Path aliases */
  alias?: Record<string, string>;
  
  /** Define global constants */
  define?: Record<string, string>;
  
  /** Target environment */
  target?: string | string[];
  
  /** Plugins to use */
  plugins?: Plugin[];
  
  /** TypeScript options */
  typescript?: TypeScriptOptions;
  
  /** Watch mode */
  watch?: boolean | WatchOptions;
  
  /** Output chunk naming pattern */
  chunkNames?: string;
  
  /** Output entry naming pattern */
  entryNames?: string;
  
  /** Output asset naming pattern */
  assetNames?: string;
  
  /** Public path for assets */
  publicPath?: string;
  
  /** Working directory */
  cwd?: string;
}

/**
 * Bundle result after successful build.
 */
export interface BundleResult {
  /** Generated output files */
  outputs: OutputFile[];
  
  /** Build duration in milliseconds */
  duration: number;
  
  /** Dependency graph */
  graph: DependencyGraph;
  
  /** Any warnings generated */
  warnings: Warning[];
}

/**
 * Output file information.
 */
export interface OutputFile {
  /** File path relative to outDir */
  path: string;
  
  /** File contents */
  contents: Uint8Array;
  
  /** File size in bytes */
  size: number;
  
  /** Original entry point (if applicable) */
  entryPoint?: string;
  
  /** Output format */
  format: OutputFormat;
  
  /** Exports (for entry points) */
  exports?: string[];
  
  /** Imports from other chunks */
  imports?: string[];
}

/**
 * File watcher instance.
 */
export interface Watcher {
  /** Add event listener */
  on<E extends WatchEvent>(event: E, handler: WatchEventHandler<E>): this;
  
  /** Remove event listener */
  off<E extends WatchEvent>(event: E, handler: WatchEventHandler<E>): this;
  
  /** Stop watching */
  close(): Promise<void>;
}

export type WatchEvent = 'start' | 'end' | 'error' | 'change';

/**
 * Watch mode options.
 */
export interface WatchOptions {
  /** Files/directories to watch (default: entry dependencies) */
  include?: string[];
  
  /** Files/directories to ignore */
  exclude?: string[];
  
  /** Debounce delay in ms (default: 100) */
  debounce?: number;
  
  /** Clear console on rebuild (default: false) */
  clearScreen?: boolean;
}

/**
 * TypeScript configuration options.
 */
export interface TypeScriptOptions {
  /** Path to tsconfig.json */
  tsconfig?: string;
  
  /** Generate declaration files */
  declaration?: boolean;
  
  /** Declaration output directory */
  declarationDir?: string;
  
  /** Only strip types (fast mode, no type checking) */
  transpileOnly?: boolean;
}

/**
 * Tree shaking options.
 */
export interface TreeshakeOptions {
  /** Treat all modules as having side effects (default: false) */
  moduleSideEffects?: boolean | string[] | ((id: string) => boolean);
  
  /** Assume property reads have no side effects (default: true) */
  propertyReadSideEffects?: boolean;
  
  /** Annotations to preserve (e.g., /*#__PURE__*/) */
  annotations?: boolean;
}
```

### CLI Interface

```bash
# Basic bundling
npx @oxog/bundler <entry> [options]

# Options:
#   -o, --out <dir>        Output directory (default: dist)
#   -f, --format <formats> Output formats: esm,cjs,iife (default: esm)
#   -m, --minify           Enable minification
#   -w, --watch            Enable watch mode
#   -c, --config <file>    Config file path
#   --sourcemap            Generate source maps
#   --splitting            Enable code splitting
#   --external <deps>      External dependencies (comma-separated)
#   --global-name <name>   Global name for IIFE build
#   --target <target>      Target environment
#   --no-treeshake         Disable tree shaking
#   -h, --help             Show help
#   -v, --version          Show version

# Examples:
npx @oxog/bundler src/index.ts
npx @oxog/bundler src/index.ts -o dist -f esm,cjs -m
npx @oxog/bundler src/index.ts src/cli.ts --splitting
npx @oxog/bundler --config bundler.config.ts
npx @oxog/bundler src/index.ts -w --sourcemap
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js |
| Module Format | ESM + CJS |
| Node.js Version | >= 18 |
| TypeScript Version | >= 5.0 |
| Bundle Size (core) | < 15KB gzipped |
| Bundle Size (all plugins) | < 60KB gzipped |

---

## LLM-NATIVE REQUIREMENTS

### 1. llms.txt File

Create `/llms.txt` in project root (< 2000 tokens):

```markdown
# @oxog/bundler

> Minimal JavaScript/TypeScript bundler with plugin architecture

## Install

```bash
npm install @oxog/bundler
```

## Basic Usage

```typescript
import { bundle } from '@oxog/bundler';

await bundle({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  minify: true
});
```

## CLI

```bash
npx @oxog/bundler src/index.ts --out dist --format esm,cjs --minify
```

## API Summary

### Core Functions
- `bundle(config)` - Bundle files
- `watch(config)` - Watch and rebuild
- `defineConfig(config)` - Type-safe config
- `definePlugin(plugin)` - Create plugin

### Config Options
- `entry` - Entry point(s): string | string[] | Record<string, string>
- `outDir` - Output directory
- `format` - Output formats: 'esm' | 'cjs' | 'iife'
- `minify` - Enable minification: boolean | 'basic' | 'full'
- `splitting` - Code splitting
- `treeshake` - Tree shaking (default: true)
- `sourcemap` - Source maps: boolean | 'inline' | 'external'
- `external` - External packages
- `alias` - Path aliases
- `plugins` - Plugin array

### Plugins
- `typescriptPlugin()` - TypeScript support
- `minifierPlugin()` - Minification
- `cssPlugin()` - CSS bundling
- `assetsPlugin()` - Asset handling
- `sourcemapsPlugin()` - Source maps
- `splittingPlugin()` - Code splitting
- `treeshakePlugin()` - Tree shaking

## Common Patterns

### Library Build
```typescript
await bundle({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  external: ['react'],
  minify: true,
  sourcemap: true
});
```

### App Build with Splitting
```typescript
await bundle({
  entry: { main: 'src/main.ts', worker: 'src/worker.ts' },
  outDir: 'dist',
  format: ['esm'],
  splitting: true,
  minify: 'full'
});
```

### Watch Mode
```typescript
const watcher = await watch(config);
watcher.on('end', (result) => console.log('Built!'));
watcher.on('error', (err) => console.error(err));
```

## Errors

| Code | Meaning | Solution |
|------|---------|----------|
| `ENTRY_NOT_FOUND` | Entry file doesn't exist | Check entry path |
| `PARSE_ERROR` | Failed to parse file | Check syntax |
| `RESOLVE_ERROR` | Module not found | Check import path |
| `CIRCULAR_DEP` | Circular dependency | Refactor imports |
| `PLUGIN_ERROR` | Plugin failed | Check plugin config |

## Links

- Docs: https://bundler.oxog.dev
- GitHub: https://github.com/ersinkoc/bundler
```

### 2. API Naming Standards

Use predictable patterns LLMs can infer:

```typescript
// ✅ GOOD - Predictable
bundle()           // Main action
watch()            // Watch mode
defineConfig()     // Config factory
definePlugin()     // Plugin factory

// ❌ BAD - Unpredictable
bndl(), w(), cfg(), plg()
```

### 3. Example Organization

```
examples/
├── 01-basic/
│   ├── simple-lib/           # Minimal library bundling
│   ├── multi-entry/          # Multiple entry points
│   └── typescript/           # TypeScript project
├── 02-output-formats/
│   ├── esm-only/             # ESM output
│   ├── dual-esm-cjs/         # Dual format
│   └── iife-browser/         # IIFE for browsers
├── 03-features/
│   ├── tree-shaking/         # Dead code elimination
│   ├── code-splitting/       # Chunk splitting
│   ├── css-bundling/         # CSS handling
│   └── assets/               # Static assets
├── 04-plugins/
│   ├── using-plugins/        # Built-in plugins
│   ├── custom-plugin/        # Plugin authoring
│   └── plugin-composition/   # Multiple plugins
├── 05-watch-mode/
│   ├── basic-watch/          # Simple watching
│   └── with-server/          # Dev server integration
└── 06-real-world/
    ├── npm-package/          # NPM library build
    ├── react-library/        # React component library
    ├── cli-tool/             # CLI application
    └── monorepo/             # Monorepo setup
```

---

## DIRECTORY STRUCTURE

```
bundler/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Website deploy only
├── src/
│   ├── index.ts                    # Main entry, public exports
│   ├── kernel.ts                   # Micro kernel core
│   ├── types.ts                    # Type definitions
│   ├── errors.ts                   # Custom error classes
│   ├── config.ts                   # Config loading & validation
│   ├── cli.ts                      # CLI implementation
│   ├── core/
│   │   ├── graph.ts                # Dependency graph
│   │   ├── resolver.ts             # Module resolution
│   │   ├── parser.ts               # JS/TS parser
│   │   ├── linker.ts               # Bundle linking
│   │   └── watcher.ts              # File watching
│   ├── utils/
│   │   ├── fs.ts                   # File system helpers
│   │   ├── path.ts                 # Path utilities
│   │   ├── hash.ts                 # Content hashing
│   │   └── sourcemap.ts            # Source map utilities
│   └── plugins/
│       ├── index.ts                # Plugin exports
│       ├── core/
│       │   ├── js-parser.ts        # JavaScript parser plugin
│       │   ├── resolver.ts         # Module resolver plugin
│       │   └── linker.ts           # Linker plugin
│       └── optional/
│           ├── typescript.ts       # TypeScript plugin
│           ├── minifier.ts         # Minification plugin
│           ├── css.ts              # CSS plugin
│           ├── assets.ts           # Assets plugin
│           ├── sourcemaps.ts       # Source maps plugin
│           ├── splitting.ts        # Code splitting plugin
│           └── treeshake.ts        # Tree shaking plugin
├── tests/
│   ├── unit/
│   │   ├── kernel.test.ts
│   │   ├── parser.test.ts
│   │   ├── resolver.test.ts
│   │   ├── linker.test.ts
│   │   └── plugins/
│   ├── integration/
│   │   ├── bundle.test.ts
│   │   ├── watch.test.ts
│   │   └── cli.test.ts
│   └── fixtures/
│       ├── simple-lib/
│       ├── typescript-lib/
│       ├── with-css/
│       └── circular-deps/
├── examples/
│   ├── 01-basic/
│   ├── 02-output-formats/
│   ├── 03-features/
│   ├── 04-plugins/
│   ├── 05-watch-mode/
│   └── 06-real-world/
├── website/
│   ├── public/
│   │   ├── CNAME                   # bundler.oxog.dev
│   │   └── llms.txt                # Copied from root
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── mcp/
│   ├── index.ts                    # MCP server entry
│   ├── tools/
│   │   ├── generate-config.ts
│   │   ├── diagnose-error.ts
│   │   ├── analyze-bundle.ts
│   │   ├── suggest-splitting.ts
│   │   └── migrate-from.ts
│   └── package.json
├── llms.txt
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── .gitignore
```

---

## MCP SERVER

The package includes an MCP server for AI-assisted bundler operations.

### Tools

| Tool | Description |
|------|-------------|
| `generate-config` | Generate bundler config based on project structure |
| `diagnose-error` | Analyze build errors and suggest fixes |
| `analyze-bundle` | Provide bundle size breakdown and optimization tips |
| `suggest-splitting` | Recommend code splitting strategies |
| `migrate-from` | Help migrate from rollup/webpack/esbuild |

### MCP Server Implementation

```typescript
// mcp/index.ts
import { createServer, Tool } from '@modelcontextprotocol/sdk';
import { generateConfig } from './tools/generate-config';
import { diagnoseError } from './tools/diagnose-error';
import { analyzeBundle } from './tools/analyze-bundle';
import { suggestSplitting } from './tools/suggest-splitting';
import { migrateFrom } from './tools/migrate-from';

const server = createServer({
  name: '@oxog/bundler-mcp',
  version: '1.0.0',
  tools: [
    generateConfig,
    diagnoseError,
    analyzeBundle,
    suggestSplitting,
    migrateFrom
  ]
});

server.start();
```

---

## WEBSITE REQUIREMENTS

### Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Syntax Highlighting**: Prism React Renderer
- **Icons**: Lucide React
- **Domain**: bundler.oxog.dev

### IDE-Style Code Blocks

All code blocks MUST have:
- Line numbers (muted, non-selectable)
- Syntax highlighting
- Header bar with filename/language
- Copy button with "Copied!" feedback
- Rounded corners, subtle border
- Dark/light theme support

### Required Pages

1. **Home** - Hero, features, install, example
2. **Getting Started** - Installation, basic usage, CLI
3. **Configuration** - All config options
4. **API Reference** - Complete documentation
5. **Plugins** - Built-in and custom plugins
6. **Examples** - Organized by category
7. **Playground** - Interactive bundler (optional)
8. **Migration** - From webpack/rollup/esbuild

### Footer

- Package name
- MIT License
- © 2025 Ersin Koç
- GitHub link only

---

## GITHUB ACTIONS

Single workflow file: `.github/workflows/deploy.yml`

```yaml
name: Deploy Website

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Build package
        run: npm run build
      
      - name: Build website
        working-directory: ./website
        run: |
          npm ci
          npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## CONFIG FILES

### package.json

```json
{
  "name": "@oxog/bundler",
  "version": "1.0.0",
  "description": "Minimal JavaScript/TypeScript bundler with plugin architecture",
  "type": "module",
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
      "import": {
        "types": "./dist/plugins/index.d.ts",
        "default": "./dist/plugins/index.js"
      },
      "require": {
        "types": "./dist/plugins/index.d.cts",
        "default": "./dist/plugins/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test:coverage"
  },
  "keywords": [
    "bundler",
    "build",
    "esm",
    "cjs",
    "typescript",
    "treeshake",
    "minify",
    "rollup-alternative",
    "esbuild-alternative",
    "zero-config",
    "code-splitting",
    "css-bundler"
  ],
  "author": "Ersin Koç",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ersinkoc/bundler.git"
  },
  "bugs": {
    "url": "https://github.com/ersinkoc/bundler/issues"
  },
  "homepage": "https://bundler.oxog.dev",
  "engines": {
    "node": ">=18"
  },
  "peerDependencies": {
    "typescript": ">=5.0.0",
    "terser": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "typescript": { "optional": true },
    "terser": { "optional": true }
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "terser": "^5.0.0"
  }
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/plugins/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  shims: true,
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'website/',
        'examples/',
        'mcp/',
        '*.config.*',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

---

## IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Create SPECIFICATION.md with complete spec
- [ ] Create IMPLEMENTATION.md with architecture
- [ ] Create TASKS.md with ordered task list
- [ ] All three documents reviewed and complete

### During Implementation
- [ ] Follow TASKS.md sequentially
- [ ] Write tests before or with each feature
- [ ] Maintain 100% coverage throughout
- [ ] JSDoc on every public API with @example
- [ ] Create examples as features are built

### Package Completion
- [ ] All tests passing (100%)
- [ ] Coverage at 100% (lines, branches, functions)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Package builds without errors
- [ ] CLI works correctly

### LLM-Native Completion
- [ ] llms.txt created (< 2000 tokens)
- [ ] llms.txt copied to website/public/
- [ ] README first 500 tokens optimized
- [ ] All public APIs have JSDoc + @example
- [ ] 15+ examples in organized folders
- [ ] package.json has 12 keywords
- [ ] API uses standard naming patterns

### MCP Server Completion
- [ ] All 5 tools implemented
- [ ] Tools tested and working
- [ ] MCP server documented

### Website Completion
- [ ] All pages implemented
- [ ] IDE-style code blocks with line numbers
- [ ] Copy buttons working
- [ ] Dark/Light theme toggle
- [ ] CNAME file with bundler.oxog.dev
- [ ] Mobile responsive
- [ ] Footer with Ersin Koç, MIT, GitHub only

### Final Verification
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] Website builds without errors
- [ ] All examples run successfully
- [ ] README is complete and accurate
- [ ] CLI `--help` works

---

## BEGIN IMPLEMENTATION

Start by creating **SPECIFICATION.md** with the complete package specification based on everything above.

Then create **IMPLEMENTATION.md** with architecture decisions, including:
- JavaScript parser architecture (tokenizer, AST, scope analysis)
- Module resolution algorithm
- Dependency graph structure
- Bundle linking strategy
- Plugin hook system design
- Watch mode implementation

Then create **TASKS.md** with ordered, numbered tasks.

Only after all three documents are complete, begin implementing code by following TASKS.md sequentially.

**Remember:**
- This package will be published to npm
- It must be production-ready
- Zero runtime dependencies (only optional peer deps for TypeScript and terser)
- 100% test coverage
- Professionally documented
- LLM-native design
- Beautiful documentation website
- Working MCP server
