import { KernelImpl } from "./kernel.js";
import { DependencyGraph } from "./core/graph.js";
import { ASTModuleParser } from "./core/parser/ast-parser.js";
import { ModuleResolver } from "./core/resolver.js";
import { BundleLinker } from "./core/linker.js";
import { fsUtils } from "./utils/fs.js";
import { pathUtils } from "./utils/path.js";
import { resolveConfig, normalizeEntry, loadConfigFile } from "./config.js";
import type {
  BundleConfig,
  BundleResult,
  Plugin,
  BundlerContext,
  OutputFormat,
} from "./types.js";
import { EntryNotFoundError } from "./errors.js";
import { treeshakePlugin } from "./plugins/optional/treeshake.js";

const parseCache = new Map<
  string,
  { code: string; info: any; mtime: number }
>();

export async function bundle(
  configInput: BundleConfig | Partial<BundleConfig>,
): Promise<BundleResult> {
  const config = resolveConfig(configInput);
  const startTime = Date.now();

  const context: BundlerContext = {
    config,
    graph: new DependencyGraph(),
  };

  const kernel = new KernelImpl(context);

  // Load plugins
  if (config.treeshake !== false) {
    kernel.use(treeshakePlugin());
  }

  await kernel.initialize();
  await kernel.hooks.buildStart.callAsync({ config });

  const entryPaths = normalizeEntry(config.entry, config.cwd || process.cwd());

  for (const entryPath of entryPaths) {
    if (!(await fsUtils.exists(entryPath))) {
      throw new EntryNotFoundError(entryPath);
    }
  }

  const moduleParser = new ASTModuleParser();
  const moduleResolver = new ModuleResolver({
    alias: config.alias,
    external: config.external,
    cwd: config.cwd,
  });

  const visited = new Set<string>();

  const processModule = async (id: string): Promise<void> => {
    if (visited.has(id)) {
      return;
    }
    visited.add(id);

    const code = await fsUtils.readFile(id);

    const moduleInfo = moduleParser.parseModule(code, id);
    moduleInfo.code = code;

    context.graph.addModule(id, moduleInfo);

    for (const imp of moduleInfo.imports) {
      try {
        const resolvedId = moduleResolver.resolveSync(imp.source, id);
        await processModule(resolvedId);
        context.graph.addDependency(id, resolvedId);
      } catch (error) {
        if (!moduleResolver["isExternal"](imp.source)) {
          console.warn(
            `Warning: Failed to resolve "${imp.source}" from "${id}":`,
            error,
          );
        }
      }
    }
  };

  for (const entry of entryPaths) {
    const moduleNode = context.graph.modules.get(entry);
    if (moduleNode) {
      moduleNode.imported = true;
    }
    await processModule(entry);
  }

  const buildOrder = context.graph.getBuildOrder();

  const outputs: any[] = [];
  const outDirAbsolute = pathUtils.resolve(
    config.cwd || process.cwd(),
    config.outDir,
  );

  const formats = config.format
    ? Array.isArray(config.format)
      ? config.format
      : [config.format]
    : ["esm"];

  for (const format of formats) {
    const linker = new BundleLinker({
      format: format as OutputFormat,
      globalName: config.globalName,
      treeshake: !!config.treeshake,
      manualChunks:
        typeof config.splitting === "object"
          ? (config.splitting as any).manualChunks
          : undefined,
    });

    const bundleResult = linker.link(
      context.graph,
      entryPaths,
      format as "esm" | "cjs" | "iife",
    );

    for (const [fileName, outputFile] of Object.entries(bundleResult)) {
      const initialCode =
        typeof outputFile.contents === "string" ? outputFile.contents : "";
      const transformedResult = await kernel.hooks.renderChunk.callAsync(
        initialCode,
        {
          code: initialCode,
          graph: context.graph,
          format,
        },
      );

      if (typeof transformedResult === "string") {
        outputFile.contents = transformedResult;
      }

      const outputPath = pathUtils.join(outDirAbsolute, fileName);

      await fsUtils.mkdir(outDirAbsolute);

      if (typeof outputFile.contents === "string") {
        await fsUtils.writeFile(outputPath, outputFile.contents);
      } else {
        await fsUtils.writeFile(
          outputPath,
          new Uint8Array(outputFile.contents),
        );
      }

      outputs.push({
        path: fileName,
        contents: outputFile.contents,
        size: outputFile.size,
        format,
      });
    }
  }

  const result: BundleResult = {
    outputs,
    duration: Date.now() - startTime,
    graph: context.graph,
    warnings: [],
  };

  await kernel.hooks.buildEnd.callAsync(result);
  await kernel.destroy();

  return result;
}

export async function watch(configInput: BundleConfig | Partial<BundleConfig>) {
  const config = resolveConfig(configInput);

  const fs = await import("node:fs");
  const chokidar = await import("chokidar").catch(() => null);

  if (!chokidar) {
    throw new Error(
      "chokidar is required for watch mode. Install it with: npm install chokidar",
    );
  }

  const context: BundlerContext = {
    config,
    graph: new DependencyGraph(),
  };

  const kernel = new KernelImpl(context);

  let watcherInstance: any;

  const rebuild = async () => {
    console.log("Rebuilding...");
    try {
      const startTime = Date.now();
      const result = await bundle(config);
      console.log(
        `✓ Built ${result.outputs.length} files in ${result.duration}ms`,
      );
    } catch (error) {
      console.error("✗ Build failed:", error);
    }
  };

  const startWatching = async () => {
    const entryPaths = normalizeEntry(
      config.entry,
      config.cwd || process.cwd(),
    );

    const watchPaths = [...entryPaths];

    if (fs.existsSync(pathUtils.join(config.cwd || process.cwd(), "src"))) {
      watchPaths.push(pathUtils.join(config.cwd || process.cwd(), "src"));
    }

    watcherInstance = chokidar.watch(watchPaths, {
      ignored: /(node_modules|\.git|dist)/,
      persistent: true,
      ignoreInitial: true,
    });

    watcherInstance.on("change", async (path: string) => {
      console.log(`File changed: ${path}`);
      await rebuild();
    });

    watcherInstance.on("add", async (path: string) => {
      console.log(`File added: ${path}`);
      await rebuild();
    });

    watcherInstance.on("unlink", async (path: string) => {
      console.log(`File removed: ${path}`);
      await rebuild();
    });

    console.log(`Watching for changes in ${watchPaths.join(", ")}`);
  };

  await rebuild();
  await startWatching();

  return {
    close: () => {
      if (watcherInstance) {
        watcherInstance.close();
      }
    },
  };
}

export function defineConfig(config: BundleConfig): BundleConfig {
  return resolveConfig(config);
}

export function definePlugin<TContext = BundlerContext>(
  plugin: Plugin<TContext>,
): Plugin<TContext> {
  return plugin;
}

export type {
  BundleConfig,
  BundleResult,
  Plugin,
  Chunk,
  OutputFile,
  Watcher,
} from "./types.js";
export { KernelImpl as Kernel } from "./kernel.js";
export { DependencyGraph } from "./core/graph.js";
export { ModuleResolver } from "./core/resolver.js";
export { BundleLinker } from "./core/linker.js";
export { loadConfigFile, resolveConfig } from "./config.js";
