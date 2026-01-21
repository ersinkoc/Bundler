import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export const suggestSplitting: Tool = {
  name: 'suggest-splitting',
  description: 'Recommend code splitting strategies',
  inputSchema: {
    type: 'object',
    properties: {
      entryPoints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Entry point file paths',
      },
    },
  },
}

export async function handleSuggestSplitting(args: any): Promise<string> {
  const { entryPoints = [] } = args

  const strategies: any[] = []

  if (entryPoints.length > 1) {
    strategies.push({
      type: 'entry-split',
      description: 'Use entry point splitting for multiple entry files',
      config: `entry: { ${entryPoints.map((e: string) => `"${e.split('/').pop()?.replace('.ts', '')}": "${e}"`).join(', ')} }`,
    })
  }

  strategies.push({
    type: 'dynamic-imports',
    description: 'Use dynamic imports for code splitting',
    config: "// Replace 'import { foo } from \"./foo\"' with:\nconst foo = await import('./foo')",
  })

  strategies.push({
    type: 'vendor-chunk',
    description: 'Extract vendor code into separate chunk',
    config: "plugins: ['splitting-plugin']",
  })

  return JSON.stringify({ strategies }, null, 2)
}
