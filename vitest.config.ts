import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        '**/src/index.ts',
        '**/src/config.ts',
        '**/src/kernel.ts',
        '**/src/errors.ts',
        '**/src/core/graph.ts',
        '**/src/core/linker.ts',
        '**/src/core/resolver.ts',
        '**/src/core/parser/ast-parser.ts',
        '**/src/plugins/optional/treeshake.ts',
        '**/src/utils/fs.ts',
        '**/src/utils/path.ts',
      ],
      all: false,
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 94,
        branches: 86,
        statements: 80,
      },
    },
  },
});
