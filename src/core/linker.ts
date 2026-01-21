import type {
  Chunk,
  OutputBundle,
  OutputFormat,
  Export,
  ModuleInfo,
} from '../types.js'
import { DependencyGraph } from '.'

export interface LinkerOptions {
  format: OutputFormat
  globalName?: string
  treeshake?: boolean
}

export class BundleLinker {
  private options: LinkerOptions

  constructor(options: LinkerOptions) {
    this.options = options
  }

  link(graph: DependencyGraph, entryPoints: string[], format: 'esm' | 'cjs' | 'iife'): OutputBundle {
    const chunks = new Map<string, Chunk>()

    const buildOrder = graph.getBuildOrder()

    const entryChunk = this.generateChunk(graph, entryPoints, buildOrder)
    chunks.set(entryChunk.id, entryChunk)

    const fileName = 'main.js'

    return {
      [fileName]: {
        path: fileName,
        contents: entryChunk.code,
        size: entryChunk.code.length,
      }
    }
  }

  private generateChunk(graph: DependencyGraph, entryPoints: string[], buildOrder: string[]): Chunk {
    const modules = buildOrder.filter((id) => entryPoints.includes(id) || this.isImported(id, graph))

    let code = ''
    const imports: string[] = []
    const exports: Export[] = []

    for (const moduleId of modules) {
      const module = graph.modules.get(moduleId)
      if (!module) continue

      const moduleInfoWithCode = { ...module.info, code: module.code }
      const moduleCode = this.transformModule(moduleId, moduleInfoWithCode)

      if (this.options.format === 'esm') {
        code += moduleCode + '\n'
        exports.push(...module.info.exports.filter((e) => e.type === 'named'))
      } else if (this.options.format === 'cjs') {
        code += moduleCode + '\n'
        exports.push(...module.info.exports.filter((e) => e.type === 'named'))
      } else if (this.options.format === 'iife') {
        code += moduleCode + '\n'
      }
    }

    if (this.options.format === 'iife' && this.options.globalName) {
      code = this.wrapInIIFE(code, this.options.globalName)
    }

    return {
      id: 'main',
      code: code.trim(),
      fileName: 'main.js',
      modules: new Map<string, ModuleInfo>(),
      imports,
      exports,
      isEntry: true,
    }
  }

  private isImported(moduleId: string, graph: DependencyGraph): boolean {
    const module = graph.modules.get(moduleId)
    if (!module) return false
    return module.imported || module.dependents.size > 0
  }

  private transformModule(moduleId: string, moduleInfo: any): string {
    let code = ''

    if (this.options.format === 'esm') {
      code = this.transformToESM(moduleId, moduleInfo)
    } else if (this.options.format === 'cjs') {
      code = this.transformToCJS(moduleId, moduleInfo)
    } else if (this.options.format === 'iife') {
      code = this.transformToIIFE(moduleId, moduleInfo)
    }

    return code
  }

  private transformToESM(moduleId: string, moduleInfo: any): string {
    let code = ''

    for (const imp of moduleInfo.imports) {
      const importCode = this.generateImportStatement(imp.source, imp.specifiers)
      code += importCode + '\n'
    }

    code += moduleInfo.code || ''

    return code
  }

  private transformToCJS(moduleId: string, moduleInfo: any): string {
    let code = ''

    for (const imp of moduleInfo.imports) {
      const importCode = this.generateCJSImport(imp.source, imp.specifiers)
      code += importCode + '\n'
    }

    code += moduleInfo.code || ''

    for (const exp of moduleInfo.exports) {
      if (exp.type === 'default') {
        code += `\nmodule.exports.default = default_export`
      } else if (exp.type === 'named') {
        code += `\nexports.${exp.name} = ${exp.name}`
      } else if (exp.type === 'all') {
        code += `\nObject.assign(exports, require('${exp.source}'))`
      }
    }

    return code
  }

  private transformToIIFE(moduleId: string, moduleInfo: any): string {
    let code = ''

    for (const imp of moduleInfo.imports) {
      const importCode = this.generateIIFEImport(imp.source, imp.specifiers)
      code += importCode + '\n'
    }

    code += moduleInfo.code || ''

    return code
  }

  private generateImportStatement(source: string, specifiers: any[]): string {
    if (specifiers.length === 0) {
      return `import '${source}'`
    }

    const namedSpecifiers = specifiers.filter((s) => s.type === 'named')
    const defaultSpec = specifiers.find((s) => s.type === 'default')
    const namespaceSpec = specifiers.find((s) => s.type === 'namespace')

    if (namespaceSpec) {
      return `import * as ${namespaceSpec.local} from '${source}'`
    }

    const parts: string[] = []

    if (defaultSpec) {
      parts.push(defaultSpec.local)
    }

    if (namedSpecifiers.length > 0) {
      const named = namedSpecifiers.map((s) => s.imported ? `${s.imported} as ${s.local}` : s.local)
      parts.push(`{ ${named.join(', ')} }`)
    }

    return `import ${parts.join(', ')} from '${source}'`
  }

  private generateCJSImport(source: string, specifiers: any[]): string {
    const defaultSpec = specifiers.find((s) => s.type === 'default')
    const namespaceSpec = specifiers.find((s) => s.type === 'namespace')
    const namedSpecifiers = specifiers.filter((s) => s.type === 'named')

    if (namespaceSpec) {
      return `const ${namespaceSpec.local} = require('${source}')`
    }

    if (defaultSpec) {
      return `const { default: ${defaultSpec.local} } = require('${source}')`
    }

    if (namedSpecifiers.length > 0) {
      const named = namedSpecifiers.map((s) => s.imported ? `${s.imported}: ${s.local}` : s.local)
      return `const { ${named.join(', ')} } = require('${source}')`
    }

    return `require('${source}')`
  }

  private generateIIFEImport(source: string, specifiers: any[]): string {
    return `/* IIFE import: ${source} */`
  }

  private wrapInIIFE(code: string, globalName: string): string {
    return `(function() {\n  'use strict';\n  ${code.split('\n').join('\n  ')}\n  return { ${globalName} };\n})()`
  }
}
