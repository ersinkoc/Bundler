# @oxog/bundler

Minimal JavaScript/TypeScript bundler with plugin architecture.

## Installation

```bash
npm install @oxog/bundler
```

## Quick Start

```typescript
import { bundle } from "@oxog/bundler";

await bundle({
  entry: "src/index.ts",
  outDir: "dist",
  format: ["esm", "cjs"],
  treeshake: true,
});
```

## CLI

```bash
npx @oxog/bundler src/index.ts --out dist --format esm,cjs
```

## Features

- **Zero Runtime Dependencies** - Core functionality implemented from scratch
- **Plugin Architecture** - Extensible micro-kernel design
- **ESM & CJS & IIFE Support** - Multiple output formats
- **Tree Shaking** - Dead code elimination
- **Circular Dependency Detection** - Identifies and handles module cycles
- **External Dependency Support** - Exclude external packages from bundle
- **Dynamic Import Support** - Parse and handle `import()` expressions
- **Side Effect Detection** - Analyze code for side effects
- **AST-Based Parsing** - Uses Acorn for accurate import/export detection
- **Fast Build Performance** - Efficient module resolution and graph traversal
- **Watch Mode** - Incremental rebuilds
- **Path Aliases** - Custom module resolution paths
- **Multiple Entry Points** - Bundle multiple files

## Planned Features

- Code Splitting - Automatic and manual chunking (partial)
- TypeScript - Built-in type stripping and transpilation
- CSS Bundling - Native CSS processing and extraction
- Source Maps - Source map generation
- Minification - Code optimization with terser

## Configuration

Create a `bundler.config.ts` file:

```typescript
import { defineConfig } from "@oxog/bundler";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "dist",
  format: ["esm", "cjs"],
  treeshake: true,
  external: ["lodash"],
  alias: {
    "@": "./src",
  },
});
```

## Documentation

- [Specification](docs/SPECIFICATION.md)
- [Implementation Details](docs/IMPLEMENTATION.md)
- [Task List](docs/TASKS.md)

## License

MIT © 2026 Ersin Koc

## Links

- GitHub: https://github.com/ersinkoc/bundler
- Documentation: https://bundler.oxog.dev
