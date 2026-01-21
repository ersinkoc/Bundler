import type { Plugin, Kernel } from '../../types.js'

export function jsParserPlugin(): Plugin {
  return {
    name: 'js-parser',
    apply(kernel: Kernel) {
      kernel.hooks.load.tapAsync('js-parser', async (args) => {
        return { code: '', map: undefined }
      })
    },
  }
}
