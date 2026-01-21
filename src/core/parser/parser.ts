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
      const local = specifierPart.slice(5).trim()
      specifiers.push({
        type: 'namespace' as const,
        local,
      })
    } else if (specifierPart.startsWith('{')) {
      const items = specifierPart.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)

      for (const item of items) {
        const parts = item.split(/\s+as\s+/i)
        const local = parts[1] || parts[0] || ''
        const imported = parts[0] || ''
        specifiers.push({
          type: 'named' as const,
          local,
          imported: imported !== local ? imported : undefined,
        })
      }
    } else if (specifierPart) {
      specifiers.push({
        type: 'default' as const,
        local: specifierPart,
      })
    }

    imports.push({
      source: importPath,
      specifiers,
    })
  }

  private parseExport(line: string, exports: ModuleInfo['exports']): void {
    if (line.includes('export default')) {
      exports.push({ type: 'default' })
    } else if (line.includes('export * from ')) {
      const match = line.match(/export\s+\*\s+from\s+['"]([^'"]+)['"]/)
      if (match) {
        exports.push({
          type: 'all',
          source: match[1] || '',
        })
      }
    } else if (line.includes('export {') && line.includes(' from ')) {
      const match = line.match(/export\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/)
      if (match) {
        const items = match[1]?.split(',').map((s) => s.trim()) || []
        for (const item of items) {
          exports.push({ type: 'named', name: item, source: match[2] || '' })
        }
      }
    } else if (line.includes('export {') || line.includes('export const') || line.includes('export function')) {
      const match = line.match(/export\s+(?:const\s+)?(\w+)(?:\s*=\s*([^;{\s;]+))?/)

      if (match) {
        exports.push({
          type: 'named',
          name: match[1] || '',
        })
      }
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
