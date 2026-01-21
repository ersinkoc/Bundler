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
  minify: true,
});
```

## CLI

```bash
npx @oxog/bundler src/index.ts --out dist --format esm,cjs --minify
```

## Features

- **Zero Runtime Dependencies** - Everything implemented from scratch
- **Plugin Architecture** - Extensible micro-kernel design
- **ESM & CJS & IIFE Support** - Multiple output formats
- **Circular Dependency Detection** - Identifies and handles module cycles
- **External Dependency Support** - Exclude external packages from bundle
- **Dynamic Import Support** - Parse and handle `import()` expressions
- **Side Effect Detection** - Analyze code for side effects
- **AST-Based Parsing** - Uses Acorn for accurate import/export detection
- **Fast Build Performance** - Efficient module resolution and graph traversal
- **Watch Mode** - Incremental rebuilds (experimental)
- **Asset Handling** - Images, fonts, and static files (basic support)
- **LLM-Native** - Optimized for AI assistants

## Planned Features

- Tree Shaking - Dead code elimination
- Code Splitting - Automatic and manual chunking
- TypeScript - Built-in type stripping and transpilation
- CSS Bundling - Native CSS processing and extraction
- Source Maps - Source map generation
- Minification - Code optimization with terser

## Documentation

Full documentation: https://bundler.oxog.dev

## License

MIT © 2025 Ersin Koç

## Links

- GitHub: https://github.com/ersinkoc/bundler
- Documentation: https://bundler.oxog.dev
