# @oxog/bundler

Minimal JavaScript/TypeScript bundler with plugin architecture.

## Installation

```bash
npm install @oxog/bundler
```

## Quick Start

```typescript
import { bundle } from '@oxog/bundler'

await bundle({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  minify: true
})
```

## CLI

```bash
npx @oxog/bundler src/index.ts --out dist --format esm,cjs --minify
```

## Features

- **Zero Runtime Dependencies** - Everything implemented from scratch
- **Plugin Architecture** - Extensible micro-kernel design
- **ESM & CJS Support** - Multiple output formats
- **Tree Shaking** - Dead code elimination
- **Code Splitting** - Automatic and manual chunking
- **TypeScript** - Built-in type stripping
- **CSS Bundling** - Native CSS processing
- **Asset Handling** - Images, fonts, and static files
- **Watch Mode** - Incremental rebuilds
- **LLM-Native** - Optimized for AI assistants

## Documentation

Full documentation: https://bundler.oxog.dev

## License

MIT © 2025 Ersin Koç

## Links

- GitHub: https://github.com/ersinkoc/bundler
- Documentation: https://bundler.oxog.dev
