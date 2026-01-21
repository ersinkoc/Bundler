import type {
  BundlerHooks,
  BundlerContext,
  Kernel,
  Plugin,
  SyncHook,
  AsyncSeriesHook,
  AsyncSeriesWaterfallHook,
  AsyncParallelHook,
  BuildOptions,
  BuildResult,
  ResolveArgs,
  ResolveResult,
  LoadArgs,
  LoadResult,
  TransformArgs,
  TransformResult,
  RenderChunkArgs,
  OutputBundle,
  ChangeType,
} from "./types";
import { PluginError } from "./errors";

export class SyncHookImpl<TArgs extends any[]> implements SyncHook<TArgs> {
  private taps: Array<{ name: string; fn: (...args: TArgs) => void }> = [];

  tap(name: string, fn: (...args: TArgs) => void): void {
    this.taps.push({ name, fn });
  }

  call(...args: TArgs): void {
    for (const tap of this.taps) {
      try {
        tap.fn(...args);
      } catch (error) {
        throw new PluginError(
          tap.name,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
}

export class AsyncSeriesHookImpl<
  TArgs extends any[],
> implements AsyncSeriesHook<TArgs> {
  private taps: Array<{ name: string; fn: (...args: TArgs) => Promise<void> }> =
    [];

  tapAsync(name: string, fn: (...args: TArgs) => Promise<void>): void {
    this.taps.push({ name, fn });
  }

  async callAsync(...args: TArgs): Promise<void> {
    for (const tap of this.taps) {
      try {
        await tap.fn(...args);
      } catch (error) {
        throw new PluginError(
          tap.name,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
}

export class AsyncSeriesWaterfallHookImpl<
  TArgs extends any[],
  TResult,
> implements AsyncSeriesWaterfallHook<TArgs, TResult> {
  private taps: Array<{
    name: string;
    fn: (
      current: TResult,
      ...args: TArgs
    ) => Promise<TResult | null | undefined>;
  }> = [];

  tapAsync(
    name: string,
    fn: (
      current: TResult,
      ...args: TArgs
    ) => Promise<TResult | null | undefined>,
  ): void {
    this.taps.push({ name, fn });
  }

  async callAsync(initial: TResult, ...args: TArgs): Promise<TResult> {
    let result: TResult = initial;

    for (const tap of this.taps) {
      try {
        const nextResult = await tap.fn(result, ...args);
        if (nextResult !== null && nextResult !== undefined) {
          result = nextResult;
        }
      } catch (error) {
        const pluginError = new PluginError(
          tap.name,
          error instanceof Error ? error.message : String(error),
        );
        if (error instanceof Error) {
          (pluginError as any).cause = error;
        }
        throw pluginError;
      }
    }

    return result;
  }
}

export class AsyncParallelHookImpl<
  TArgs extends any[],
> implements AsyncParallelHook<TArgs> {
  private taps: Array<{ name: string; fn: (...args: TArgs) => Promise<void> }> =
    [];

  tapAsync(name: string, fn: (...args: TArgs) => Promise<void>): void {
    this.taps.push({ name, fn });
  }

  async callAsync(...args: TArgs): Promise<void> {
    await Promise.all(
      this.taps.map(async (tap) => {
        try {
          await tap.fn(...args);
        } catch (error) {
          throw new PluginError(
            tap.name,
            error instanceof Error ? error.message : String(error),
          );
        }
      }),
    );
  }
}

export class KernelImpl<TContext = BundlerContext> implements Kernel<TContext> {
  plugins: Map<string, Plugin<TContext>> = new Map();
  hooks: BundlerHooks = {
    buildStart: new AsyncSeriesHookImpl<[BuildOptions]>(),
    buildEnd: new AsyncSeriesHookImpl<[BuildResult]>(),
    resolve: new AsyncSeriesWaterfallHookImpl<[ResolveArgs], ResolveResult>(),
    load: new AsyncSeriesWaterfallHookImpl<[LoadArgs], LoadResult>(),
    transform: new AsyncSeriesWaterfallHookImpl<
      [TransformArgs],
      TransformResult
    >(),
    renderChunk: new AsyncSeriesWaterfallHookImpl<[RenderChunkArgs], string>(),
    writeBundle: new AsyncParallelHookImpl<[OutputBundle]>(),
    watchChange: new AsyncSeriesHookImpl<[string, ChangeType]>(),
  };
  context: TContext;
  private initialized = false;

  constructor(context: TContext) {
    this.context = context;
  }

  use(plugin: Plugin<TContext> | (() => Plugin<TContext>)): this {
    const instance = typeof plugin === "function" ? plugin() : plugin;

    if (this.plugins.has(instance.name)) {
      throw new PluginError(
        instance.name,
        `Plugin "${instance.name}" is already registered`,
      );
    }

    if (instance.dependencies) {
      for (const dep of instance.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new PluginError(
            instance.name,
            `Missing dependency "${dep}" for plugin "${instance.name}"`,
          );
        }
      }
    }

    this.plugins.set(instance.name, instance);

    if (this.initialized) {
      try {
        instance.apply(this);
        if (instance.onInit) {
          instance.onInit();
        }
      } catch (error) {
        if (instance.onError) {
          instance.onError(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
        throw new PluginError(
          instance.name,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return this;
  }

  register(plugin: Plugin<TContext>): void {
    this.use(plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new PluginError(name, `Plugin "${name}" is not registered`);
    }

    if (plugin.onDestroy) {
      try {
        plugin.onDestroy();
      } catch (error) {
        throw new PluginError(
          name,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    this.plugins.delete(name);
  }

  list(): Plugin<TContext>[] {
    return Array.from(this.plugins.values());
  }

  async initialize(): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      try {
        plugin.apply(this);
      } catch (error) {
        throw new PluginError(
          name,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    this.initialized = true;

    for (const [name, plugin] of this.plugins) {
      if (plugin.onInit) {
        try {
          await plugin.onInit();
        } catch (error) {
          throw new PluginError(
            name,
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }
  }

  async destroy(): Promise<void> {
    for (const [name, plugin] of Array.from(this.plugins.entries()).reverse()) {
      if (plugin.onDestroy) {
        try {
          await plugin.onDestroy();
        } catch (error) {
          if (plugin.onError) {
            plugin.onError(
              error instanceof Error ? error : new Error(String(error)),
            );
          }
        }
      }
    }

    this.plugins.clear();
    this.initialized = false;
  }
}
