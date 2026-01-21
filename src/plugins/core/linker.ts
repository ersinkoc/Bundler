import type { Plugin, Kernel } from '../../types.js'
import { BundleLinker } from '../../core/linker.js'

export function linkerPlugin(options?: { format?: 'esm' | 'cjs' | 'iife', globalName?: string }): Plugin {
  return {
    name: 'linker',
    version: '1.0.0',
    install(kernel: Kernel) {
      const linker = new BundleLinker({ format: options?.format || 'esm', globalName: options?.globalName, treeshake: true })
      kernel.hooks.renderChunk.tapAsync('linker', async (args, callback) => {
        callback({ code: args.chunk.code, map: undefined })
      })
    },
  }
}
