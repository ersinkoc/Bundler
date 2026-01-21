import type { ModuleInfo } from '../../types.js'

export class SimpleModuleParser {
  parseModule(code: string, id: string): ModuleInfo {
    const imports: ModuleInfo['imports'] = []
    const exports: ModuleInfo['exports'] = []
    const dynamicImports: ModuleInfo['dynamicImports'] = []

    const lines = code.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('import ')) {
        this.parseImport(trimmed, imports)
      } else if (trimmed.startsWith('export ')) {
        this.parseExport(trimmed, exports)
      } else if (trimmed.includes('import(')) {
        this.parseDynamicImport(trimmed, dynamicImports)
      }
    }

    return {
      imports,
      exports,
      dynamicImports,
      hasSideEffects: this.hasSideEffects(code),
      isPure: this.isPure(code),
    }
  }

  private parseImport(line: string, imports: ModuleInfo['imports']): void {
    const match = line.match(/^import\s+([^]*?)\s+from\s+['"]([^'"]+)['"]/)
    if (!match) return

    const specifierPart = match[1]?.trim() || ''
    const importPath = match[2] || ''

    const specifiers: ModuleInfo['imports'][0]['specifiers'] = []

    if (specifierPart.startsWith('* as ')) {
      // Namespace import: import * as foo from 'x'
      const local = specifierPart.slice(5).trim()
      specifiers.push({
        type: 'namespace' as const,
        local,
      })
    } else if (specifierPart.startsWith('{')) {
      // Named imports only: import { a, b } from 'x'
      this.parseNamedSpecifiers(specifierPart, specifiers)
    } else if (specifierPart.includes(',') && specifierPart.includes('{')) {
      // Mixed: import def, { a, b } from 'x'
      const commaIndex = specifierPart.indexOf(',')
      const defaultPart = specifierPart.slice(0, commaIndex).trim()
      const namedPart = specifierPart.slice(commaIndex + 1).trim()

      // Add default import
      if (defaultPart) {
        specifiers.push({
          type: 'default' as const,
          local: defaultPart,
        })
      }

      // Add named imports
      this.parseNamedSpecifiers(namedPart, specifiers)
    } else if (specifierPart) {
      // Default import only: import foo from 'x'
      // Check if it might be mixed (default + named)
      const mixedMatch = specifierPart.match(/^(\w+)\s*,\s*(\{[^}]+\})$/)
      if (mixedMatch) {
        specifiers.push({
          type: 'default' as const,
          local: mixedMatch[1] || '',
        })
        this.parseNamedSpecifiers(mixedMatch[2] || '', specifiers)
      } else {
        specifiers.push({
          type: 'default' as const,
          local: specifierPart,
        })
      }
    }

    imports.push({
      source: importPath,
      specifiers,
    })
  }

  private parseNamedSpecifiers(namedPart: string, specifiers: ModuleInfo['imports'][0]['specifiers']): void {
    // Remove braces and parse items
    const content = namedPart.replace(/^\{|\}$/g, '').trim()
    if (!content) return

    const items = content.split(',').map((s) => s.trim()).filter(Boolean)

    for (const item of items) {
      const parts = item.split(/\s+as\s+/i)
      const imported = parts[0]?.trim() || ''
      const local = parts[1]?.trim() || imported
      specifiers.push({
        type: 'named' as const,
        local,
        imported: imported !== local ? imported : undefined,
      })
    }
  }

  private parseExport(line: string, exports: ModuleInfo['exports']): void {
    // export default ...
    if (line.includes('export default')) {
      exports.push({ type: 'default' })
      return
    }

    // export * from 'module'
    if (line.includes('export * from ')) {
      const match = line.match(/export\s+\*\s+from\s+['"]([^'"]+)['"]/)
      if (match) {
        exports.push({
          type: 'all',
          source: match[1] || '',
        })
      }
      return
    }

    // export { a, b } from 'module' (re-export)
    if (line.includes('export {') && line.includes(' from ')) {
      const match = line.match(/export\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/)
      if (match) {
        const items = match[1]?.split(',').map((s) => s.trim()) || []
        for (const item of items) {
          // Handle "foo as bar" syntax
          const asParts = item.split(/\s+as\s+/)
          const name = asParts[asParts.length - 1]?.trim() || item
          exports.push({ type: 'named', name, source: match[2] || '' })
        }
      }
      return
    }

    // export { a, b } (local re-export)
    if (line.includes('export {')) {
      const match = line.match(/export\s+\{([^}]+)\}/)
      if (match) {
        const items = match[1]?.split(',').map((s) => s.trim()) || []
        for (const item of items) {
          // Handle "foo as bar" syntax
          const asParts = item.split(/\s+as\s+/)
          const name = asParts[asParts.length - 1]?.trim() || item
          exports.push({ type: 'named', name })
        }
      }
      return
    }

    // export function foo() / export async function foo()
    const funcMatch = line.match(/export\s+(?:async\s+)?function\s+(\w+)/)
    if (funcMatch) {
      exports.push({ type: 'named', name: funcMatch[1] || '' })
      return
    }

    // export class Foo
    const classMatch = line.match(/export\s+class\s+(\w+)/)
    if (classMatch) {
      exports.push({ type: 'named', name: classMatch[1] || '' })
      return
    }

    // export const/let/var foo = ...
    const varMatch = line.match(/export\s+(?:const|let|var)\s+(\w+)/)
    if (varMatch) {
      exports.push({ type: 'named', name: varMatch[1] || '' })
      return
    }

    // export type/interface (TypeScript)
    const typeMatch = line.match(/export\s+(?:type|interface)\s+(\w+)/)
    if (typeMatch) {
      exports.push({ type: 'named', name: typeMatch[1] || '' })
      return
    }

    // export enum (TypeScript)
    const enumMatch = line.match(/export\s+enum\s+(\w+)/)
    if (enumMatch) {
      exports.push({ type: 'named', name: enumMatch[1] || '' })
      return
    }
  }

  private parseDynamicImport(line: string, dynamicImports: ModuleInfo['dynamicImports']): void {
    const match = line.match(/import\s*\(?\s*['"]([^'"]+)['"]\s*\)/)
    if (match) {
      dynamicImports.push(match[1] || '')
    }
  }

  private hasSideEffects(code: string): boolean {
    const consoleRegex = /\bconsole\.(log|error|warn|info|debug)\(/;
    const documentRegex = /\bdocument\.(querySelector|getElementById)\(/;
    const windowRegex = /\bwindow\./;

    if (consoleRegex.test(code) || documentRegex.test(code) || windowRegex.test(code)) {
      return true;
    }

    const lines = code.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      if (trimmed.startsWith('export ')) continue;
      if (trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var ')) continue;
      if (trimmed.startsWith('function ') || trimmed.startsWith('class ')) continue;
      if (trimmed.startsWith('import ') || trimmed.startsWith('export default ')) continue;

      if (trimmed.includes('=') && !trimmed.startsWith('const ') && !trimmed.startsWith('let ') && !trimmed.startsWith('var ')) {
        return true;
      }
    }

    return false;
  }

  private isPure(code: string): boolean {
    return !this.hasSideEffects(code)
  }
}
