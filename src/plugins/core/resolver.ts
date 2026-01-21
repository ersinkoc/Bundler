import type { Plugin, Kernel } from '../../types.js'
import { ModuleResolver } from '../../core/resolver.js'

export function resolverPlugin(options?: { alias?: Record<string, string>, external?: (string | RegExp)[] }): Plugin {
  return {
    name: 'resolver',
    version: '1.0.0',
    install(kernel: Kernel) {
      const resolver = new ModuleResolver(options)
      kernel.hooks.resolve.tapAsync('resolver', async (args, callback) => {
        callback({ id: resolver.resolveSync(args.importPath, args.fromPath), external: false })
      })
    },
  }
}
