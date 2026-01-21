import type { Plugin, Kernel } from '../../types.js'

export function typescriptPlugin(options?: { transpileOnly?: boolean }): Plugin {
  return {
    name: 'typescript',
    version: '1.0.0',
    install(kernel: Kernel) {
      kernel.hooks.transform.tapAsync('typescript', async (args, callback) => {
        if (args.id.endsWith('.ts') || args.id.endsWith('.tsx')) {
          let code = args.code
          code = code.replace(/:\s*\w+(\[\])?(\s*=\s*)/g, '$1$2')
          code = code.replace(/interface\s+\w+\s*{[^}]*}/g, '')
          code = code.replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
          code = code.replace(/:\s*\{[^}]*\}/g, '')
          callback({ code, map: undefined })
        } else {
          callback({ code: args.code, map: undefined })
        }
      })
    },
  }
}
