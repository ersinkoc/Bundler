import type { Plugin, Kernel } from '../../types.js'

export function cssPlugin(options?: any): Plugin {
  return {
    name: 'css',
    version: '1.0.0',
    install(kernel: Kernel) {
      kernel.hooks.transform.tapAsync('css', async (args, callback) => {
        callback({ code: args.code, map: undefined })
      })
    },
  }
}
