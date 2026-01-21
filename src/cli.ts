#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { resolveConfig, loadConfigFile } from './config.js'

interface CLIOptions {
  entry?: string[]
  out?: string
  format?: string
  minify?: boolean
  watch?: boolean
  config?: string
  sourcemap?: boolean
  splitting?: boolean
  external?: string
  globalName?: string
  target?: string
  noTreeshake?: boolean
  help?: boolean
  version?: boolean
}

export async function runCLI(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      out: { type: 'string', short: 'o' },
      format: { type: 'string', short: 'f' },
      minify: { type: 'boolean', short: 'm' },
      watch: { type: 'boolean', short: 'w' },
      config: { type: 'string', short: 'c' },
      sourcemap: { type: 'boolean' },
      splitting: { type: 'boolean' },
      external: { type: 'string' },
      globalName: { type: 'string' },
      target: { type: 'string' },
      noTreeshake: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
    allowPositionals: true,
  })

  const options = values as CLIOptions
  const entry = positionals

  if (options.help) {
    showHelp()
    return
  }

  if (options.version) {
    showVersion()
    return
  }

  const { bundle } = await import('./index.js')

  let config: any = {}

  if (options.config) {
    const fileConfig = await loadConfigFile(process.cwd())
    if (fileConfig) {
      config = fileConfig
    }
  }

  if (entry.length > 0) {
    config.entry = entry.length === 1 ? entry[0] : entry
  }

  if (options.out) {
    config.outDir = options.out
  }

  if (options.format) {
    const formats = options.format.split(',')
    config.format = formats.filter(f => ['esm', 'cjs', 'iife'].includes(f)) as ('esm' | 'cjs' | 'iife')[]
  }

  if (options.minify) {
    config.minify = true
  }

  if (options.watch) {
    config.watch = true
  }

  if (options.sourcemap) {
    config.sourcemap = true
  }

  if (options.splitting) {
    config.splitting = true
  }

  if (options.external) {
    config.external = options.external.split(',') as string[] as (string | RegExp)[]
  }

  if (options.globalName) {
    config.globalName = options.globalName
  }

  if (options.target) {
    config.target = options.target
  }

  if (options.noTreeshake) {
    config.treeshake = false
  }

  try {
    const result = await bundle(config)
    console.log(`✓ Built ${result.outputs.length} files in ${result.duration}ms`)
  } catch (error) {
    console.error('✗ Build failed:', error)
    process.exit(1)
  }
}

function showHelp(): void {
  console.log(`
@oxog/bundler - Minimal JavaScript/TypeScript bundler

Usage:
  bundler <entry> [options]
  bundler --config <file>

Options:
  -o, --out <dir>        Output directory (default: dist)
  -f, --format <formats> Output formats: esm,cjs,iife (default: esm)
  -m, --minify           Enable minification
  -w, --watch            Enable watch mode
  -c, --config <file>    Config file path
      --sourcemap        Generate source maps
      --splitting        Enable code splitting
      --external <deps>  External dependencies (comma-separated)
      --global-name <name> Global name for IIFE build
      --target <target>  Target environment
      --no-treeshake     Disable tree shaking
  -h, --help             Show help
  -v, --version          Show version

Examples:
  bundler src/index.ts
  bundler src/index.ts -o dist -f esm,cjs -m
  bundler src/index.ts src/cli.ts --splitting
  bundler --config bundler.config.ts
  bundler src/index.ts -w --sourcemap

For more information: https://bundler.oxog.dev
`)
}

function showVersion(): void {
  const packageJson = JSON.parse(`{"version":"1.0.0"}`)
  console.log(`@oxog/bundler v${packageJson.version}`)
}

runCLI(process.argv.slice(2))
