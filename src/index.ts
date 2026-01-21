import { KernelImpl } from './kernel.js'
import { DependencyGraph } from './core/graph.js'
import { SimpleModuleParser } from './core/parser/parser.js'
import { ModuleResolver } from './core/resolver.js'
import { BundleLinker } from './core/linker.js'
import { fsUtils } from './utils/fs.js'
import { pathUtils } from './utils/path.js'
import { resolveConfig, normalizeEntry, loadConfigFile } from './config.js'
import type { BundleConfig, BundleResult, Plugin, BundlerContext } from './types.js'
import { EntryNotFoundError } from './errors.js'

export async function bundle(configInput: BundleConfig | Partial<BundleConfig>): Promise<BundleResult> {
  const config = resolveConfig(configInput)
  const startTime = Date.now()

  const context: BundlerContext = {
    config,
    graph: new DependencyGraph(),
  }

  const kernel = new KernelImpl(context)

  await kernel.hooks.buildStart.callAsync({ config })

  const entryPaths = normalizeEntry(config.entry, config.cwd || process.cwd())

  for (const entryPath of entryPaths) {
    if (!(await fsUtils.exists(entryPath))) {
      throw new EntryNotFoundError(entryPath)
    }
  }

  const moduleParser = new SimpleModuleParser()
  const moduleResolver = new ModuleResolver({
    alias: config.alias,
    external: config.external,
    cwd: config.cwd,
  })

  const visited = new Set<string>()

  const processModule = async (id: string): Promise<void> => {
    if (visited.has(id)) {
      return
    }
    visited.add(id)

    const code = await fsUtils.readFile(id)

    const moduleInfo = moduleParser.parseModule(code, id)
    moduleInfo.code = code

    // Add module to graph before resolving dependencies
    context.graph.addModule(id, moduleInfo)

    for (const imp of moduleInfo.imports) {
      try {
        const resolvedId = moduleResolver.resolveSync(imp.source, id)
        // Only add dependency if the target module exists in the graph
        if (context.graph.modules.has(resolvedId)) {
          context.graph.addDependency(id, resolvedId)
        }
        await processModule(resolvedId)
      } catch (error) {
        // External packages
        if (!moduleResolver['isExternal'](imp.source)) {
          console.warn(`Warning: Failed to resolve "${imp.source}" from "${id}":`, error)
        }
      }
  }
  }

  for (const entry of entryPaths) {
    const moduleNode = context.graph.modules.get(entry)
    if (moduleNode) {
      moduleNode.imported = true
    }
    await processModule(entry)
  }

  const buildOrder = context.graph.getBuildOrder()

  const outputs: any[] = []
  const outDirAbsolute = pathUtils.resolve(config.cwd || process.cwd(), config.outDir)

  const formats = config.format || ['esm']

  for (const format of formats) {
    const linker = new BundleLinker({
      format,
      globalName: config.globalName,
      treeshake: !!config.treeshake,
    })

    const bundleResult = linker.link(context.graph, entryPaths, format)

    for (const [fileName, outputFile] of Object.entries(bundleResult)) {
      const outputPath = pathUtils.join(outDirAbsolute, fileName)

      await fsUtils.mkdir(outDirAbsolute)

      if (typeof outputFile.contents === 'string') {
        await fsUtils.writeFile(outputPath, outputFile.contents)
      } else {
        await fsUtils.writeFile(outputPath, new Uint8Array(outputFile.contents))
      }

      outputs.push({
        path: fileName,
        contents: outputFile.contents,
        size: outputFile.size,
        format,
      })
    }
  }

  const result: BundleResult = {
    outputs,
    duration: Date.now() - startTime,
    graph: context.graph,
    warnings: [],
  }

  await kernel.hooks.buildEnd.callAsync(result)
  await kernel.destroy()

  return result
}

export async function watch(configInput: BundleConfig | Partial<BundleConfig>) {
  throw new Error('Watch mode is not implemented yet')
}

export function defineConfig(config: BundleConfig): BundleConfig {
  return resolveConfig(config)
}

export function definePlugin<TContext = BundlerContext>(plugin: Plugin<TContext>): Plugin<TContext> {
  return plugin
}

export type { BundleConfig, BundleResult, Plugin, Chunk, OutputFile, Watcher } from './types.js'
export { KernelImpl as Kernel } from './kernel.js'
export { DependencyGraph } from './core/graph.js'
export { ModuleResolver } from './core/resolver.js'
export { BundleLinker } from './core/linker.js'
export { loadConfigFile, resolveConfig } from './config.js'
