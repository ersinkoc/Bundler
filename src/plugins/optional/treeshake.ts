import type { Plugin, Kernel } from '../../types.js'

export function treeshakePlugin(options?: any): Plugin {
  return {
    name: 'treeshake',
    version: '1.0.0',
    install(kernel: Kernel) {
      kernel.hooks.renderChunk.tapAsync('treeshake', async (args, callback) => {
        callback({ code: args.chunk.code, map: args.chunk.map })
      })
    },
  }
}
