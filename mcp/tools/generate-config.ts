import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export const generateConfig: Tool = {
  name: 'generate-config',
  description: 'Generate bundler config based on project structure',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the project directory',
      },
      framework: {
        type: 'string',
        description: 'Framework type (react, vue, vanilla, etc.)',
      },
      type: {
        type: 'string',
        description: 'Build type (library, app, cli)',
      },
    },
  },
}

export async function handleGenerateConfig(args: any): Promise<string> {
  const { projectPath, framework = 'vanilla', type = 'library' } = args

  const config = {
    entry: type === 'library' ? 'src/index.ts' : 'src/main.ts',
    outDir: 'dist',
    format: type === 'library' ? ['esm', 'cjs'] : ['esm'],
    minify: type === 'app',
    splitting: type === 'app',
    treeshake: true,
    sourcemap: true,
  }

  if (framework === 'react') {
    config.plugins = ['css', 'assets']
  }

  return JSON.stringify(config, null, 2)
}
