import type { Plugin, Kernel } from '../../types.js'

export function sourcemapsPlugin(options?: any): Plugin {
  return {
    name: 'sourcemaps',
    version: '1.0.0',
    install(kernel: Kernel) {
      kernel.hooks.transform.tapAsync('sourcemaps', async (args, callback) => {
        callback({ code: args.code, map: undefined })
      })
    },
  }
}
