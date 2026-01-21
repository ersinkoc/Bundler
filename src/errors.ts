export class BundlerError extends Error {
  code: string
  id?: string

  constructor(message: string, code: string, id?: string) {
    super(message)
    this.name = 'BundlerError'
    this.code = code
    this.id = id
    Error.captureStackTrace(this, this.constructor)
  }
}

export class EntryNotFoundError extends BundlerError {
  constructor(path: string) {
    super(`Entry file not found: ${path}`, 'ENTRY_NOT_FOUND', path)
    this.name = 'EntryNotFoundError'
  }
}

export class ParseError extends BundlerError {
  constructor(message: string, id: string) {
    super(`Parse error: ${message}`, 'PARSE_ERROR', id)
    this.name = 'ParseError'
  }
}

export class ResolveError extends BundlerError {
  constructor(importPath: string, fromPath: string) {
    super(
      `Failed to resolve "${importPath}" from "${fromPath}"`,
      'RESOLVE_ERROR',
      importPath
    )
    this.name = 'ResolveError'
  }
}

export class CircularDependencyError extends BundlerError {
  cycle: string[]

  constructor(cycle: string[]) {
    super(
      `Circular dependency detected: ${cycle.join(' → ')}`,
      'CIRCULAR_DEP'
    )
    this.name = 'CircularDependencyError'
    this.cycle = cycle
  }
}

export class PluginError extends BundlerError {
  constructor(pluginName: string, message: string) {
    super(`Plugin "${pluginName}" error: ${message}`, 'PLUGIN_ERROR')
    this.name = 'PluginError'
  }
}

export class TransformError extends BundlerError {
  constructor(message: string, id: string) {
    super(`Transform error: ${message}`, 'TRANSFORM_ERROR', id)
    this.name = 'TransformError'
  }
}

export class OutputError extends BundlerError {
  constructor(message: string, path?: string) {
    super(`Output error: ${message}`, 'OUTPUT_ERROR', path)
    this.name = 'OutputError'
  }
}

export class ConfigError extends BundlerError {
  constructor(message: string) {
    super(`Config error: ${message}`, 'CONFIG_ERROR')
    this.name = 'ConfigError'
  }
}
