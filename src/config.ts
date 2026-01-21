import * as path from 'node:path'
import { fsUtils } from './utils/fs'
import { pathUtils } from './utils/path'
import type { BundleConfig, Entry } from './types'
import { ConfigError } from './errors'

export async function loadConfigFile(cwd: string = process.cwd()): Promise<BundleConfig | null> {
  const configPaths = [
    path.join(cwd, 'bundler.config.ts'),
    path.join(cwd, 'bundler.config.js'),
    path.join(cwd, 'bundler.config.mjs'),
  ]

  for (const configPath of configPaths) {
    if (await fsUtils.exists(configPath)) {
      try {
        const module = await import(configPath)
        return module.default || module
      } catch (error) {
        throw new ConfigError(`Failed to load config from ${configPath}: ${error}`)
      }
    }
  }

  return null
}

export function normalizeConfig(config: Partial<BundleConfig>): BundleConfig {
  return {
    entry: config.entry || 'src/index.ts',
    outDir: config.outDir || 'dist',
    format: config.format || ['esm'],
    minify: config.minify || false,
    splitting: config.splitting || false,
    treeshake: config.treeshake !== undefined ? config.treeshake : true,
    sourcemap: config.sourcemap || false,
    external: config.external || [],
    alias: config.alias || {},
    define: config.define || {},
    target: config.target || 'es2022',
    plugins: config.plugins || [],
    typescript: config.typescript || undefined,
    watch: config.watch || false,
    chunkNames: config.chunkNames || '[name]-[hash].js',
    entryNames: config.entryNames || '[name].js',
    assetNames: config.assetNames || '[name].[ext]',
    publicPath: config.publicPath || '',
    cwd: config.cwd || process.cwd(),
  }
}

export function validateConfig(config: BundleConfig): void {
  if (!config.entry) {
    throw new ConfigError('Entry point is required')
  }

  if (!config.outDir) {
    throw new ConfigError('Output directory is required')
  }

  if (!config.format || config.format.length === 0) {
    throw new ConfigError('At least one output format is required')
  }

  const validFormats = ['esm', 'cjs', 'iife'] as const
  for (const format of config.format) {
    if (!validFormats.includes(format)) {
      throw new ConfigError(`Invalid format: ${format}. Must be one of ${validFormats.join(', ')}`)
    }
  }
}

export function resolveConfig(config: BundleConfig | Partial<BundleConfig> | (() => BundleConfig)): BundleConfig {
  const resolved = typeof config === 'function' ? config() : config
  const normalized = normalizeConfig(resolved)
  validateConfig(normalized)
  return normalized
}

export function normalizeEntry(entry: Entry, cwd: string): string[] {
  if (typeof entry === 'string') {
    return [pathUtils.resolve(cwd, entry)]
  }

  if (Array.isArray(entry)) {
    return entry.map((e) => pathUtils.resolve(cwd, e as string))
  }

  return Object.entries(entry).map(([name, pathValue]) => pathUtils.resolve(cwd, pathValue as string))
}
