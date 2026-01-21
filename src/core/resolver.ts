import * as path from 'node:path'
import * as fs from 'node:fs'
import { fsUtils } from '../utils/fs'
import { pathUtils } from '../utils/path'
import { ResolveError } from '../errors.js'

export interface ResolveOptions {
  alias?: Record<string, string>
  external?: (string | RegExp)[]
  extensions?: string[]
  mainFields?: string[]
  cwd?: string
}

export class ModuleResolver {
  private options: Required<Omit<ResolveOptions, 'external'>>

  constructor(options: ResolveOptions = {}) {
    this.options = {
      alias: options.alias || {},
      extensions: options.extensions || ['.ts', '.js', '.json', '.mjs', '.cjs'],
      mainFields: options.mainFields || ['module', 'main'],
      cwd: options.cwd || process.cwd(),
    }
  }

  resolve(importPath: string, fromPath: string): string {
    const result = this.resolveSync(importPath, fromPath)

    if (this.isExternal(importPath)) {
      return importPath
    }

    return result
  }

  resolveSync(importPath: string, fromPath: string): string {
    const resolved = this.resolveImportPath(importPath, fromPath)

    if (!resolved) {
      throw new ResolveError(importPath, fromPath)
    }

    return pathUtils.resolve(resolved)
  }

  private resolveImportPath(importPath: string, fromPath: string): string | null {
    const alias = this.matchAlias(importPath)
    if (alias) {
      return this.resolveAliasPath(alias, fromPath)
    }

    if (pathUtils.isAbsolute(importPath)) {
      return this.resolveAbsolutePath(importPath)
    }

    if (importPath.startsWith('.')) {
      return this.resolveRelativePath(importPath, fromPath)
    }

    return this.resolveBareModule(importPath, fromPath)
  }

  private matchAlias(importPath: string): string | null {
    for (const [alias, target] of Object.entries(this.options.alias)) {
      if (importPath === alias || importPath.startsWith(`${alias}/`)) {
        return importPath.replace(alias, target)
      }
    }
    return null
  }

  private resolveAliasPath(aliasPath: string, fromPath: string): string | null {
    const resolved = pathUtils.resolve(this.options.cwd, aliasPath)
    return this.resolveFileOrDirectory(resolved)
  }

  private resolveAbsolutePath(importPath: string): string | null {
    return this.resolveFileOrDirectory(importPath)
  }

  private resolveRelativePath(importPath: string, fromPath: string): string | null {
    const fromDir = pathUtils.dirname(fromPath)
    const resolved = pathUtils.resolve(fromDir, importPath)
    return this.resolveFileOrDirectory(resolved)
  }

  private resolveBareModule(importPath: string, fromPath: string): string | null {
    let currentDir = pathUtils.dirname(fromPath)

    while (true) {
      const resolved = this.resolveNodeModule(importPath, currentDir)
      if (resolved) {
        return resolved
      }

      const parentDir = pathUtils.dirname(currentDir)
      if (parentDir === currentDir) {
        break
      }
      currentDir = parentDir
    }

    return null
  }

  private resolveNodeModule(importPath: string, fromDir: string): string | null {
    const nodeModulesPath = pathUtils.join(fromDir, 'node_modules')

    if (!fsUtils.isDirectory(nodeModulesPath)) {
      return null
    }

    const parts = importPath.split('/')
    const moduleName = parts[0] || ''
    const subPath = parts.slice(1).join('/')

    const modulePath = pathUtils.join(nodeModulesPath, moduleName)

    if (subPath) {
      return this.resolveModuleSubPath(modulePath, subPath)
    }

    return this.resolvePackageMain(modulePath)
  }

  private resolveModuleSubPath(modulePath: string, subPath: string): string | null {
    const subPathAbsolute = pathUtils.join(modulePath, subPath)
    return this.resolveFileOrDirectory(subPathAbsolute)
  }

  private resolvePackageMain(packagePath: string): string | null {
    const packageJsonPath = pathUtils.join(packagePath, 'package.json')

    if (fsUtils.isFile(packageJsonPath)) {
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(packageJsonContent)

        if (packageJson.exports) {
          const resolved = this.resolvePackageExports(packagePath, packageJson.exports, '.')
          if (resolved) {
            return resolved
          }
        }

        for (const mainField of this.options.mainFields) {
          if (packageJson[mainField]) {
            const mainPath = pathUtils.join(packagePath, packageJson[mainField])
            const resolved = this.resolveFileOrDirectory(mainPath)
            if (resolved) {
              return resolved
            }
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    return this.resolveFileWithExtensions(pathUtils.join(packagePath, 'index'))
  }

  private resolvePackageExports(packagePath: string, exports: any, subPath: string): string | null {
    if (typeof exports === 'string') {
      const resolved = pathUtils.join(packagePath, exports)
      return this.resolveFileOrDirectory(resolved)
    }

    if (Array.isArray(exports)) {
      for (const exp of exports) {
        if (typeof exp === 'string') {
          const resolved = pathUtils.join(packagePath, exp)
          const result = this.resolveFileOrDirectory(resolved)
          if (result) {
            return result
          }
        }
      }
      return null
    }

    if (typeof exports === 'object') {
      const exportKeys = Object.keys(exports)

      for (const key of exportKeys) {
        if (key === subPath || (key.endsWith('*') && subPath.startsWith(key.slice(0, -1)))) {
          const exportValue = exports[key]
          if (typeof exportValue === 'string') {
            const resolved = exportValue.replace('*', subPath.slice(key.length - 1))
            const result = this.resolveFileOrDirectory(pathUtils.join(packagePath, resolved))
            if (result) {
              return result
            }
          } else if (typeof exportValue === 'object') {
            const defaultExport = (exportValue as any).default
            if (typeof defaultExport === 'string') {
              const resolved = pathUtils.join(packagePath, defaultExport)
              const result = this.resolveFileOrDirectory(resolved)
              if (result) {
                return result
              }
            }
          }
        }
      }

      if (exports['.']) {
        const dotExport = exports['.']
        if (typeof dotExport === 'string') {
          const resolved = pathUtils.join(packagePath, dotExport)
          const result = this.resolveFileOrDirectory(resolved)
          if (result) {
            return result
          }
        }
      }
    }

    return null
  }

  private resolveFileOrDirectory(filePath: string): string | null {
    if (fsUtils.isFile(filePath)) {
      return filePath
    }

    if (fsUtils.isDirectory(filePath)) {
      return this.resolveDirectory(filePath)
    }

    return this.resolveFileWithExtensions(filePath)
  }

  private resolveDirectory(dirPath: string): string | null {
    const packageJsonPath = pathUtils.join(dirPath, 'package.json')

    if (fsUtils.isFile(packageJsonPath)) {
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(packageJsonContent)

        if (packageJson.exports) {
          const resolved = this.resolvePackageExports(dirPath, packageJson.exports, '.')
          if (resolved) {
            return resolved
          }
        }

        for (const mainField of this.options.mainFields) {
          if (packageJson[mainField]) {
            const mainPath = pathUtils.join(dirPath, packageJson[mainField])
            const resolved = this.resolveFileOrDirectory(mainPath)
            if (resolved) {
              return resolved
            }
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    const indexPath = pathUtils.join(dirPath, 'index')
    return this.resolveFileWithExtensions(indexPath)
  }

  private resolveFileWithExtensions(filePath: string): string | null {
    for (const ext of this.options.extensions) {
      const withExt = filePath + ext
      if (fsUtils.isFile(withExt)) {
        return withExt
      }
    }
    return null
  }

  private isExternal(importPath: string): boolean {
    for (const external of (this.options as ResolveOptions).external || []) {
      if (typeof external === 'string') {
        if (importPath === external || importPath.startsWith(`${external}/`)) {
          return true
        }
      } else if (external instanceof RegExp) {
        if (external.test(importPath)) {
          return true
        }
      }
    }
    return false
  }
}
