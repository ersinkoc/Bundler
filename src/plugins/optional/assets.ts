import type { Plugin, Kernel } from '../../types.js'

export function assetsPlugin(options?: any): Plugin {
  return {
    name: 'assets',
    version: '1.0.0',
    install(kernel: Kernel) {
      kernel.hooks.load.tapAsync('assets', async (args, callback) => {
        callback({ code: '', map: undefined })
      })
    },
  }
}
