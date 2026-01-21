import type { Plugin, Kernel } from '../../types.js'

export function splittingPlugin(options?: any): Plugin {
  return {
    name: 'splitting',
    version: '1.0.0',
    install(kernel: Kernel) {
      kernel.hooks.renderChunk.tapAsync('splitting', async (args, callback) => {
        callback({ code: args.chunk.code, map: args.chunk.map })
      })
    },
  }
}
