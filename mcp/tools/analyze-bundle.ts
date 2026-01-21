import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export const analyzeBundle: Tool = {
  name: 'analyze-bundle',
  description: 'Provide bundle size breakdown and optimization tips',
  inputSchema: {
    type: 'object',
    properties: {
      bundleSize: {
        type: 'number',
        description: 'Bundle size in bytes',
      },
      outputPath: {
        type: 'string',
        description: 'Path to output bundle file',
      },
    },
  },
}

export async function handleAnalyzeBundle(args: any): Promise<string> {
  const { bundleSize, outputPath } = args
  const sizeKB = (bundleSize / 1024).toFixed(2)

  const tips: string[] = []
  if (bundleSize > 100 * 1024) {
    tips.push('Bundle is large (>100KB), consider code splitting')
  }
  if (bundleSize > 50 * 1024) {
    tips.push('Enable tree shaking to remove unused code')
  }
  if (bundleSize > 30 * 1024) {
    tips.push('Enable minification to reduce bundle size')
  }
  tips.push('Check bundle size regularly to monitor growth')

  return JSON.stringify({ sizeKB, tips }, null, 2)
}
