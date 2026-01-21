# @oxog/bundler - Implementation Architecture

## Design Principles

1. **Zero Runtime Dependencies**: Implement everything from scratch
2. **Micro-Kernel Architecture**: Minimal core with extensible plugins
3. **LLM-Native**: Predictable API naming, comprehensive documentation
4. **100% Test Coverage**: Every line, branch, and function tested
5. **TypeScript Strict Mode**: All strict checks enabled

## Architecture Overview

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

## Core Components

### 1. Micro Kernel (kernel.ts)

**Purpose**: Central orchestration engine with minimal responsibilities

**Responsibilities**:
- Plugin registration and lifecycle management
- Hook system for plugin communication
- Dependency graph coordination
- Configuration management
- Error boundary and recovery
- File system abstraction
- Watch mode coordination

**Key Classes**:

```typescript
class Kernel<TContext = BundlerContext> {
  // Plugin management
  plugins: Map<string, Plugin<TContext>>
  use(plugin: PluginFactory<TContext>): this
  register(plugin: Plugin<TContext>): void
  unregister(name: string): void
  list(): Plugin<TContext>[]

  // Hook system
  hooks: BundlerHooks

  // Context
  context: TContext

  // Lifecycle
  async initialize(): Promise<void>
  async destroy(): Promise<void>
}

// Hook types
class SyncHook<TArgs extends any[]> { tap(name, fn): void call(...args): void }
class AsyncSeriesHook<TArgs extends any[]> { tapAsync(name, fn): void callAsync(...args): Promise<void> }
class AsyncSeriesWaterfallHook<TArgs extends any[], TResult> { tapAsync(name, fn): void callAsync(...args): Promise<TResult> }
class AsyncParallelHook<TArgs extends any[]> { tapAsync(name, fn): void callAsync(...args): Promise<void> }
```

**Design Decisions**:
- Hooks use tap pattern for extensibility
- Plugins can modify data via waterfall hooks
- Kernel maintains minimal state
- Context object shared across plugins
- Error boundary wraps all plugin operations

### 2. JavaScript/ESM Parser (core/parser.ts)

**Purpose**: Parse JavaScript/TypeScript and extract module information

**Architecture**:

```
Source Code
    ↓
Tokenizer (lexer.ts)
    ↓
AST (ast.ts)
    ↓
Scope Analyzer (scope.ts)
    ↓
Module Info
```

**Key Classes**:

```typescript
class Tokenizer {
  tokenize(code: string): Token[]
}

class Parser {
  parse(tokens: Token[]): ASTNode
}

class ScopeAnalyzer {
  analyze(ast: ASTNode): Scope
}

class ModuleParser {
  parseModule(code: string, id: string): ModuleInfo
}

interface ModuleInfo {
  imports: Import[]
  exports: Export[]
  dynamicImports: string[]
  hasSideEffects: boolean
  isPure: boolean
}

interface Import {
  source: string
  specifiers: ImportSpecifier[]
}

interface Export {
  type: 'named' | 'default' | 'all'
  name?: string
  source?: string
}
```

**Implementation Strategy**:
1. **Tokenizer**: Scan source, produce token stream
2. **Parser**: Build AST from tokens (recursive descent)
3. **Scope Analyzer**: Track variable declarations and references
4. **Module Extraction**: Extract imports/exports from AST

**Token Types**:
- Keywords: `import`, `export`, `from`, `default`, `as`, `*`
- Identifiers: variable/function names
- Literals: strings, numbers, booleans
- Operators: `=`, `.`, `,`, `;`, `(`, `)`, `{`, `}`
- Comments: single-line, multi-line

**AST Node Types**:
- Program (root)
- ImportDeclaration
- ExportNamedDeclaration
- ExportDefaultDeclaration
- ExportAllDeclaration
- VariableDeclaration
- FunctionDeclaration
- ClassDeclaration
- ExpressionStatement

### 3. Module Resolver (core/resolver.ts)

**Purpose**: Resolve module imports to file paths

**Resolution Algorithm**:

```
1. Check if external (matches external patterns)
2. Resolve path aliases (@utils → ./src/utils)
3. Check relative paths (./, ../)
4. Check node_modules
5. Try file extensions (.ts, .js, .json)
6. Check package.json (main, exports, module)
7. Check index files
```

**Key Classes**:

```typescript
class ModuleResolver {
  resolve(importPath: string, fromPath: string): string
  resolveSync(importPath: string, fromPath: string): string
}

interface ResolveOptions {
  alias: Record<string, string>
  external: (string | RegExp)[]
  extensions: string[]
  mainFields: string[]
}
```

**Resolution Strategies**:
- **Relative**: `./utils` → absolute path from importer
- **Absolute**: Already resolved, return as-is
- **Bare module**: Lookup in node_modules
- **Package**: Resolve package entry point

**Node.js Compatibility**:
- Follow Node.js ESM resolution spec
- Support package.json `exports` field
- Support package.json `main`, `module`, `browser` fields
- Handle conditional exports (import, default, node)

### 4. Dependency Graph (core/graph.ts)

**Purpose**: Track module dependencies and build order

**Key Classes**:

```typescript
class DependencyGraph {
  addModule(id: string, info: ModuleInfo): void
  addDependency(from: string, to: string): void
  getDependencies(id: string): string[]
  getDependents(id: string): string[]
  detectCircular(id: string): string[] | null
  getBuildOrder(): string[]
  prune(graph: Set<string>): void
}

interface ModuleNode {
  id: string
  info: ModuleInfo
  dependencies: Set<string>
  dependents: Set<string>
  imported: boolean
  pure: boolean
}
```

**Graph Algorithms**:
- **Topological Sort**: Determine build order
- **Cycle Detection**: Detect circular dependencies
- **Reachability Analysis**: Find transitive dependencies
- **Import Analysis**: Track which modules are imported from entry

### 5. Bundle Linker (core/linker.ts)

**Purpose**: Generate output bundles from dependency graph

**Key Classes**:

```typescript
class BundleLinker {
  link(graph: DependencyGraph, options: BundleOptions): OutputBundle
}

interface BundleOptions {
  format: OutputFormat
  globalName?: string
  treeshake: boolean
  splitting: boolean
}

interface OutputBundle {
  chunks: Map<string, Chunk>
  assets: Map<string, Asset>
}

interface Chunk {
  id: string
  code: string
  imports: string[]
  exports: string[]
  entryPoints: string[]
}
```

**Linking Process**:
1. **Chunk Generation**: Group modules into chunks
2. **Tree Shaking**: Remove unused exports
3. **Code Transformation**: Convert to target format
4. **Chunk Linking**: Add inter-chunk imports
5. **Bundle Generation**: Produce final output

**Format Transformations**:
- **ESM**: Keep imports/exports as-is
- **CJS**: Convert to require/module.exports
- **IIFE**: Wrap in IIFE with global variable

### 6. Plugin System (types.ts - Plugin Types)

**Purpose**: Extensible architecture for custom transformations

**Plugin Lifecycle**:

```
1. Plugin Registration
   ↓
2. Plugin.install(kernel)
   ↓
3. Kernel.hooks.{hook}.tap(plugin, fn)
   ↓
4. Plugin.onInit(context)
   ↓
5. Build Process (hooks fire)
   ↓
6. Plugin.onDestroy()
```

**Hook Execution Order**:

```
buildStart
    ↓
[For each module]
  resolve → load → transform
    ↓
renderChunk
    ↓
writeBundle
    ↓
buildEnd
```

**Hook Types**:
- **SyncHook**: Synchronous execution, no return value
- **AsyncSeriesHook**: Asynchronous, sequential
- **AsyncSeriesWaterfallHook**: Asynchronous, passes data through
- **AsyncParallelHook**: Asynchronous, concurrent

## Utilities

### File System (utils/fs.ts)

```typescript
class FS {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  exists(path: string): Promise<boolean>
  isFile(path: string): boolean
  isDirectory(path: string): boolean
  mkdir(path: string): Promise<void>
  readDir(path: string): Promise<string[]>
  stat(path: string): Promise<FileStats>
}

interface FileStats {
  size: number
  mtime: Date
  isFile(): boolean
  isDirectory(): boolean
}
```

### Path Utilities (utils/path.ts)

```typescript
class PathUtils {
  join(...paths: string[]): string
  dirname(path: string): string
  basename(path: string, ext?: string): string
  relative(from: string, to: string): string
  normalize(path: string): string
  resolve(...paths: string[]): string
  extname(path: string): string
  isAbsolute(path: string): boolean
}
```

### Hash Utilities (utils/hash.ts)

```typescript
class HashUtils {
  hash(content: string): string
  hashFile(path: string): Promise<string>
}
```

### Source Map Utilities (utils/sourcemap.ts)

```typescript
class SourceMapGenerator {
  addMapping(mapping: Mapping): void
  toString(): string
}

class SourceMapConsumer {
  getOriginalPosition(generated: Position): Position
}
```

## Plugin Implementations

### Core Plugins

#### js-parser Plugin

**Purpose**: Parse JavaScript/TypeScript modules

```typescript
export function jsParserPlugin(): Plugin {
  return {
    name: 'js-parser',
    version: '1.0.0',
    install(kernel) {
      kernel.hooks.load.tapAsync('js-parser', async (args) => {
        const parser = new ModuleParser()
        return parser.parseModule(args.code, args.id)
      })
    }
  }
}
```

#### resolver Plugin

**Purpose**: Resolve module paths

```typescript
export function resolverPlugin(options?: ResolverOptions): Plugin {
  return {
    name: 'resolver',
    version: '1.0.0',
    install(kernel) {
      const resolver = new ModuleResolver(options)
      kernel.hooks.resolve.tapAsync('resolver', async (args) => {
        return resolver.resolve(args.importPath, args.fromPath)
      })
    }
  }
}
```

#### linker Plugin

**Purpose**: Generate output bundles

```typescript
export function linkerPlugin(options?: LinkerOptions): Plugin {
  return {
    name: 'linker',
    version: '1.0.0',
    install(kernel) {
      const linker = new BundleLinker(options)
      kernel.hooks.renderChunk.tapAsync('linker', async (args) => {
        return linker.linkChunk(args.chunk, args.options)
      })
    }
  }
}
```

### Optional Plugins

#### typescript Plugin

**Purpose**: TypeScript transpilation

```typescript
export function typescriptPlugin(options?: TypeScriptOptions): Plugin {
  return {
    name: 'typescript',
    version: '1.0.0',
    install(kernel) {
      if (options?.transpileOnly) {
        kernel.hooks.transform.tapAsync('typescript', async (args) => {
          return stripTypes(args.code)
        })
      } else {
        kernel.hooks.transform.tapAsync('typescript', async (args) => {
          const ts = require('typescript')
          return ts.transpileModule(args.code, {
            compilerOptions: options?.tsconfig
              ? getTSConfig(options.tsconfig)
              : getDefaultTSConfig()
          }).outputText
        })
      }
    }
  }
}
```

#### minifier Plugin

**Purpose**: Code minification

```typescript
export function minifierPlugin(options?: MinifyOption): Plugin {
  return {
    name: 'minifier',
    version: '1.0.0',
    install(kernel) {
      kernel.hooks.renderChunk.tapAsync('minifier', async (args) => {
        if (options === 'basic' || options === true) {
          return basicMinify(args.code)
        } else if (options === 'full' || typeof options === 'object') {
          const terser = require('terser')
          return await terser.minify(args.code, options).code
        }
        return args.code
      })
    }
  }
}
```

#### css Plugin

**Purpose**: CSS bundling

```typescript
export function cssPlugin(options?: CSSOptions): Plugin {
  return {
    name: 'css',
    version: '1.0.0',
    install(kernel) {
      const cssModules = new Map<string, Map<string, string>>()

      kernel.hooks.load.tapAsync('css', async (args) => {
        if (args.id.endsWith('.css')) {
          return parseCSS(args.code, args.id, options?.modules ? cssModules : null)
        }
      })

      kernel.hooks.transform.tapAsync('css', async (args) => {
        if (args.id.endsWith('.css')) {
          return transformCSS(args.code, args.id, options)
        }
      })
    }
  }
}
```

#### assets Plugin

**Purpose**: Static asset handling

```typescript
export function assetsPlugin(options?: AssetOptions): Plugin {
  return {
    name: 'assets',
    version: '1.0.0',
    install(kernel) {
      kernel.hooks.load.tapAsync('assets', async (args) => {
        if (isAsset(args.id)) {
          return loadAsset(args.id, options)
        }
      })
    }
  }
}
```

#### sourcemaps Plugin

**Purpose**: Source map generation

```typescript
export function sourcemapsPlugin(options?: SourcemapOption): Plugin {
  return {
    name: 'sourcemaps',
    version: '1.0.0',
    install(kernel) {
      const generator = new SourceMapGenerator()
      kernel.hooks.transform.tap('sourcemaps', (result, id) => {
        if (result.map) {
          generator.addMappings(result.map)
        }
        return result
      })
      kernel.hooks.renderChunk.tap('sourcemaps', (args) => {
        if (options !== false) {
          return generateSourceMap(args.code, generator)
        }
      })
    }
  }
}
```

#### splitting Plugin

**Purpose**: Code splitting

```typescript
export function splittingPlugin(options?: SplittingOptions): Plugin {
  return {
    name: 'splitting',
    version: '1.0.0',
    install(kernel) {
      kernel.hooks.renderChunk.tapAsync('splitting', async (args) => {
        return splitChunks(args.chunk, args.graph, options)
      })
    }
  }
}
```

#### treeshake Plugin

**Purpose**: Tree shaking

```typescript
export function treeshakePlugin(options?: TreeshakeOptions): Plugin {
  return {
    name: 'treeshake',
    version: '1.0.0',
    install(kernel) {
      kernel.hooks.renderChunk.tapAsync('treeshake', async (args) => {
        return treeShake(args.chunk, args.graph, options)
      })
    }
  }
}
```

## Main API Functions

### bundle()

```typescript
export async function bundle(config: BundleConfig): Promise<BundleResult> {
  const startTime = Date.now()

  const kernel = new Kernel()
  kernel.use(resolverPlugin({ alias: config.alias, external: config.external }))
  kernel.use(jsParserPlugin())
  kernel.use(linkerPlugin({ format: config.format[0], globalName: config.globalName }))

  if (config.minify) kernel.use(minifierPlugin(config.minify))
  if (config.typescript) kernel.use(typescriptPlugin(config.typescript))
  if (config.css) kernel.use(cssPlugin(config.css))
  if (config.assets) kernel.use(assetsPlugin(config.assets))
  if (config.sourcemap) kernel.use(sourcemapsPlugin(config.sourcemap))
  if (config.splitting) kernel.use(splittingPlugin(config.splitting))
  if (config.treeshake) kernel.use(treeshakePlugin(config.treeshake))

  if (config.plugins) {
    for (const plugin of config.plugins) {
      kernel.use(plugin)
    }
  }

  await kernel.initialize()

  const graph = new DependencyGraph()
  const resolver = new ModuleResolver()

  const entryPaths = normalizeEntry(config.entry, config.cwd || process.cwd())
  for (const entry of entryPaths) {
    await buildGraph(entry, graph, kernel)
  }

  const buildOrder = graph.getBuildOrder()
  const outputs = await generateOutputs(graph, buildOrder, config)

  await kernel.hooks.buildEnd.call({ outputs })

  await kernel.destroy()

  return {
    outputs,
    duration: Date.now() - startTime,
    graph,
    warnings: []
  }
}
```

### watch()

```typescript
export async function watch(config: BundleConfig): Promise<Watcher> {
  const watcher = new FileWatcher(config)
  const rebuild = debounce(async () => {
    watcher.emit('start')
    try {
      const result = await bundle(config)
      watcher.emit('end', result)
    } catch (error) {
      watcher.emit('error', error)
    }
  }, config.watch?.debounce || 100)

  await watcher.watch((path, type) => {
    watcher.emit('change', { path, type })
    rebuild()
  })

  await rebuild()

  return watcher
}
```

## Testing Strategy

### Unit Tests

- Test each function and class independently
- Mock external dependencies
- Cover all branches and edge cases

### Integration Tests

- Test end-to-end build process
- Test with real fixtures
- Verify output correctness

### Coverage

- **Lines**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Statements**: 100%

## Performance Considerations

1. **Parallel Processing**: Use async/await for I/O operations
2. **Caching**: Cache parsed modules and resolved paths
3. **Incremental Builds**: Only rebuild changed files
4. **Memory Efficiency**: Use streaming for large files
5. **Tree Shaking**: Remove unused code early

## Error Handling

1. **Graceful Degradation**: Continue on non-critical errors
2. **Clear Messages**: Provide actionable error messages
3. **Error Codes**: Use standard error codes
4. **Recovery**: Attempt recovery when possible
5. **Logging**: Log errors with context

## Security Considerations

1. **Path Traversal**: Validate all paths
2. **Code Injection**: Sanitize all code transformations
3. **Dependency Confusion**: Verify resolved packages
4. **Resource Limits**: Limit memory and file size
5. **External Access**: Control file system access

## Future Extensibility

1. **Custom Resolvers**: Allow custom resolution strategies
2. **Plugin API Extensions**: Add more hooks
3. **Output Formats**: Support more formats
4. **Target Environments**: Add more targets
5. **Performance Modes**: Optimize for different scenarios
