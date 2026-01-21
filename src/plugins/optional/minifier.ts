import type { Plugin, Kernel } from '../../types.js'

export function minifierPlugin(options?: boolean | 'basic' | 'full'): Plugin {
  return {
    name: 'minifier',
    version: '1.0.0',
    install(kernel: Kernel) {
      kernel.hooks.transform.tapAsync('minifier', async (args, callback) => {
        if (options === true || options === 'basic') {
          let code = args.code
          code = code.replace(/\/\/.*$/gm, '')
          code = code.replace(/\/\*[\s\S]*?\*\//g, '')
          code = code.replace(/\s+/g, ' ')
          code = code.replace(/\s*([{};:,.])\s*/g, '$1')
          code = code.trim()
          callback({ code, map: undefined })
        } else {
          callback({ code: args.code, map: undefined })
        }
      })
    },
  }
}
