export interface Import {
  source: string;
  specifiers: ImportSpecifier[];
}

export interface ImportSpecifier {
  type: "named" | "default" | "namespace";
  local: string;
  imported?: string;
}

export interface Export {
  type: "named" | "default" | "all" | "namespace";
  name?: string;
  source?: string;
  specifiers?: ExportSpecifier[];
}

export interface ExportSpecifier {
  name: string;
  imported?: string;
}

export interface ModuleInfo {
  imports: Import[];
  exports: Export[];
  dynamicImports: string[];
  hasSideEffects: boolean;
  isPure: boolean;
  code?: string;
}

export type Entry = string | string[] | Record<string, string>;

export type OutputFormat = "esm" | "cjs" | "iife";

export interface BundleConfig {
  entry: Entry;
  outDir: string;
  format?: OutputFormat | OutputFormat[];
  minify?: boolean;
  splitting?: boolean;
  treeshake?: boolean;
  sourcemap?: boolean | "inline" | "external" | "hidden";
  external?: (string | RegExp)[];
  alias?: Record<string, string>;
  define?: Record<string, string>;
  target?: string;
  plugins?: Plugin<any>[];
  typescript?: boolean | { tsconfig?: string; declaration?: boolean };
  watch?: boolean;
  chunkNames?: string;
  entryNames?: string;
  assetNames?: string;
  publicPath?: string;
  cwd?: string;
  globalName?: string;
}

export interface OutputFile {
  path: string;
  contents: string | Uint8Array;
  size: number;
  format?: "esm" | "cjs" | "iife";
}

export interface Chunk {
  id: string;
  code: string;
  fileName: string;
  modules: Map<string, ModuleInfo>;
  imports: string[];
  exports: Export[];
  isEntry: boolean;
}

export interface BundleResult {
  outputs: OutputFile[];
  duration: number;
  graph: DependencyGraph;
  warnings: string[];
}

export interface Watcher {
  close(): void;
}

export interface BundlerContext {
  config: BundleConfig;
  graph: DependencyGraph;
}

export interface Plugin<TContext = BundlerContext> {
  name: string;
  dependencies?: string[];
  apply(kernel: Kernel<TContext>): void;
  onInit?: () => void;
  onDestroy?: () => void;
  onError?: (error: Error) => void;
}

export interface Kernel<TContext = BundlerContext> {
  hooks: BundlerHooks;
  context: TContext;
  destroy(): Promise<void>;
}

export interface SyncHook<TArgs extends any[]> {
  tap(name: string, fn: (...args: TArgs) => void): void;
  call(...args: TArgs): void;
}

export interface AsyncSeriesHook<TArgs extends any[]> {
  tapAsync(name: string, fn: (...args: TArgs) => Promise<void>): void;
  callAsync(...args: TArgs): Promise<void>;
}

export interface AsyncSeriesWaterfallHook<TArgs extends any[], TResult> {
  tapAsync(
    name: string,
    fn: (
      current: TResult,
      ...args: TArgs
    ) => Promise<TResult | null | undefined>,
  ): void;
  callAsync(initial: TResult, ...args: TArgs): Promise<TResult>;
}

export interface AsyncParallelHook<TArgs extends any[]> {
  tapAsync(name: string, fn: (...args: TArgs) => Promise<void>): void;
  callAsync(...args: TArgs): Promise<void>;
}

export interface BundlerHooks {
  buildStart: AsyncSeriesHook<[BuildOptions]>;
  buildEnd: AsyncSeriesHook<[BuildResult]>;
  resolve: AsyncSeriesWaterfallHook<[ResolveArgs], ResolveResult>;
  load: AsyncSeriesWaterfallHook<[LoadArgs], LoadResult>;
  transform: AsyncSeriesWaterfallHook<[TransformArgs], TransformResult>;
  renderChunk: AsyncSeriesWaterfallHook<[RenderChunkArgs], string>;
  writeBundle: AsyncSeriesHook<[OutputBundle]>;
  watchChange: AsyncSeriesHook<[string, ChangeType]>;
}

export interface BuildOptions {
  config: BundleConfig;
}

export interface BuildResult {
  outputs: OutputFile[];
  duration: number;
  warnings: string[];
}

export interface ResolveArgs {
  id: string;
  importer: string;
  isEntry: boolean;
}

export type ResolveResult =
  | { id: string; external?: boolean }
  | null
  | undefined;

export interface LoadArgs {
  id: string;
}

export interface LoadResult {
  code: string;
  map?: any;
}

export interface TransformArgs {
  id: string;
  code: string;
}

export type TransformResult = string | null | undefined;

export interface RenderChunkArgs {
  code: string;
  graph?: DependencyGraph;
  chunk?: Chunk;
  format?: string;
}

export interface OutputBundle {
  [fileName: string]: OutputFile;
}

export type ChangeType = "create" | "update" | "delete";

export interface ModuleNode {
  id: string;
  info: ModuleInfo;
  dependencies: Set<string>;
  dependents: Set<string>;
  imported: boolean;
  code?: string;
  pure?: boolean;
}

export interface DependencyGraph {
  modules: Map<string, ModuleNode>;
  addModule(id: string, info: ModuleInfo): void;
  addDependency(from: string, to: string): void;
  getDependencies(id: string): string[];
  getDependents(id: string): string[];
  getBuildOrder(): string[];
  prune(entryPoints: string[]): void;
  detectCircular(id: string): string[] | null;
  collectReachable(moduleId: string, visited: Set<string>): void;
}

export interface SourceMap {
  version: number;
  mappings: string;
  sources: string[];
  names: string[];
  file?: string;
  sourceRoot?: string;
  sourcesContent?: (string | null)[];
}
