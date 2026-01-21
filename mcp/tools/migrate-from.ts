import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export const migrateFrom: Tool = {
  name: 'migrate-from',
  description: 'Help migrate from other bundlers',
  inputSchema: {
    type: 'object',
    properties: {
      fromBundler: {
        type: 'string',
        enum: ['rollup', 'webpack', 'esbuild', 'vite'],
        description: 'Source bundler',
      },
      configPath: {
        type: 'string',
        description: 'Path to source config file',
      },
    },
  },
}

export async function handleMigrateFrom(args: any): Promise<string> {
  const { fromBundler, configPath } = args

  const migrations: Record<string, any> = {
    rollup: {
      configMap: {
        input: 'entry',
        output: 'outDir',
        output: { file: 'outFile' },
        plugins: 'plugins',
      },
      notes: [
        '@oxog/bundler uses similar plugin system',
        'Most Rollup plugins may need adaptation',
      ],
    },
    webpack: {
      configMap: {
        entry: 'entry',
        output: { path: 'outDir' },
        module: { rules: 'transformRules' },
        plugins: 'plugins',
      },
      notes: [
        'Webpack loaders need to be replaced with plugins',
        'Use simpler configuration',
      ],
    },
    esbuild: {
      configMap: {
        entryPoints: 'entry',
        bundle: true,
        outfile: 'outFile',
        plugins: 'plugins',
      },
      notes: [
        'Similar minification options',
        'Fast build speeds maintained',
      ],
    },
    vite: {
      configMap: {
        build: { lib: 'outDir', rollupOptions: 'options' },
        plugins: 'plugins',
      },
      notes: [
        'Vite plugins may be compatible',
        'Use build.lib for library mode',
      ],
    },
  }

  const migration = migrations[fromBundler] || { configMap: {}, notes: [] }

  return JSON.stringify(migration, null, 2)
}
