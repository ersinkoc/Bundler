import { describe, it, expect } from "vitest";
import {
  SyncHookImpl,
  AsyncSeriesHookImpl,
  AsyncSeriesWaterfallHookImpl,
  AsyncParallelHookImpl,
  KernelImpl,
} from "../../src/kernel.js";
import { PluginError } from "../../src/errors.js";
import type { Plugin } from "../../src/types.js";

describe("SyncHookImpl", () => {
  it("should create hook", () => {
    const hook = new SyncHookImpl<[string]>();
    expect(hook).toBeDefined();
  });

  it("should tap and call", () => {
    const hook = new SyncHookImpl<[string]>();
    const results: string[] = [];
    hook.tap("test", (arg) => results.push(arg));
    hook.call("hello");
    expect(results).toEqual(["hello"]);
  });

  it("should call multiple taps in order", () => {
    const hook = new SyncHookImpl<[number]>();
    const results: number[] = [];
    hook.tap("first", (n) => results.push(n * 2));
    hook.tap("second", (n) => results.push(n * 3));
    hook.call(5);
    expect(results).toEqual([10, 15]);
  });

  it("should wrap errors in PluginError", () => {
    const hook = new SyncHookImpl<[]>();
    hook.tap("failing", () => {
      throw new Error("test error");
    });
    expect(() => hook.call()).toThrow(PluginError);
  });
});

describe("AsyncSeriesHookImpl", () => {
  it("should create hook", () => {
    const hook = new AsyncSeriesHookImpl<[string]>();
    expect(hook).toBeDefined();
  });

  it("should tap and call async", async () => {
    const hook = new AsyncSeriesHookImpl<[string]>();
    const results: string[] = [];
    hook.tapAsync("test", async (arg) => {
      results.push(arg);
    });
    await hook.callAsync("world");
    expect(results).toEqual(["world"]);
  });

  it("should call taps in series", async () => {
    const hook = new AsyncSeriesHookImpl<[]>();
    const results: number[] = [];
    hook.tapAsync("first", async () => {
      await new Promise((r) => setTimeout(r, 10));
      results.push(1);
    });
    hook.tapAsync("second", async () => {
      results.push(2);
    });
    await hook.callAsync();
    expect(results).toEqual([1, 2]);
  });

  it("should wrap errors in PluginError", async () => {
    const hook = new AsyncSeriesHookImpl<[]>();
    hook.tapAsync("failing", async () => {
      throw new Error("async error");
    });
    await expect(hook.callAsync()).rejects.toThrow(PluginError);
  });
});

describe("AsyncSeriesWaterfallHookImpl", () => {
  it("should create hook", () => {
    const hook = new AsyncSeriesWaterfallHookImpl<[], string>();
    expect(hook).toBeDefined();
  });

  it("should pass value through taps", async () => {
    const hook = new AsyncSeriesWaterfallHookImpl<[], string>();
    hook.tapAsync("upper", async (str) => str.toUpperCase());
    hook.tapAsync("exclaim", async (str) => str + "!");
    const result = await hook.callAsync("hello");
    expect(result).toBe("HELLO!");
  });

  it("should keep previous value if tap returns null", async () => {
    const hook = new AsyncSeriesWaterfallHookImpl<[], number>();
    hook.tapAsync("double", async (n) => n * 2);
    hook.tapAsync("skip", async () => null);
    hook.tapAsync("triple", async (n) => n * 3);
    const result = await hook.callAsync(5);
    expect(result).toBe(30);
  });

  it("should wrap errors in PluginError", async () => {
    const hook = new AsyncSeriesWaterfallHookImpl<[], string>();
    hook.tapAsync("failing", async () => {
      throw new Error("waterfall error");
    });
    await expect(hook.callAsync("test")).rejects.toThrow(PluginError);
  });
});

describe("AsyncParallelHookImpl", () => {
  it("should create hook", () => {
    const hook = new AsyncParallelHookImpl<[string]>();
    expect(hook).toBeDefined();
  });

  it("should call taps in parallel", async () => {
    const hook = new AsyncParallelHookImpl<[number]>();
    const results: number[] = [];
    hook.tapAsync("a", async (n) => {
      await new Promise((r) => setTimeout(r, 20));
      results.push(n);
    });
    hook.tapAsync("b", async (n) => {
      results.push(n * 2);
    });
    await hook.callAsync(5);
    // Both should complete, order may vary
    expect(results).toContain(5);
    expect(results).toContain(10);
  });

  it("should wrap errors in PluginError", async () => {
    const hook = new AsyncParallelHookImpl<[]>();
    hook.tapAsync("failing", async () => {
      throw new Error("parallel error");
    });
    await expect(hook.callAsync()).rejects.toThrow(PluginError);
  });
});

describe("KernelImpl", () => {
  it("should create kernel with config", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);
    expect(kernel).toBeDefined();
    expect(kernel.hooks).toBeDefined();
    expect(kernel.context).toBeDefined();
  });

  it("should have all hooks", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);
    expect(kernel.hooks.buildStart).toBeDefined();
    expect(kernel.hooks.buildEnd).toBeDefined();
    expect(kernel.hooks.resolve).toBeDefined();
    expect(kernel.hooks.load).toBeDefined();
    expect(kernel.hooks.transform).toBeDefined();
    expect(kernel.hooks.renderChunk).toBeDefined();
    expect(kernel.hooks.writeBundle).toBeDefined();
    expect(kernel.hooks.watchChange).toBeDefined();
  });

  it("should register plugins", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    let applied = false;
    const plugin: Plugin = {
      name: "test-plugin",
      apply: () => {
        applied = true;
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    expect(applied).toBe(true);
  });

  it("should handle plugin onInit", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    let initCalled = false;
    const plugin: Plugin = {
      name: "init-plugin",
      apply: () => {},
      onInit: async () => {
        initCalled = true;
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    expect(initCalled).toBe(true);
  });

  it("should destroy plugins", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    let destroyCalled = false;
    const plugin: Plugin = {
      name: "destroy-plugin",
      apply: () => {},
      onDestroy: () => {
        destroyCalled = true;
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    await kernel.destroy();
    expect(destroyCalled).toBe(true);
  });

  it("should throw on duplicate plugin names", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin1: Plugin = { name: "same-name", apply: () => {} };
    const plugin2: Plugin = { name: "same-name", apply: () => {} };

    kernel.use(plugin1);
    expect(() => kernel.use(plugin2)).toThrow();
  });

  it("should throw when onInit fails", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "failing-init-plugin",
      apply: () => {},
      onInit: async () => {
        throw new Error("Init failed");
      },
    };

    kernel.use(plugin);
    await expect(kernel.initialize()).rejects.toThrow();
  });

  it("should call onError when destroy fails", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    let errorCalled = false;
    const plugin: Plugin = {
      name: "error-destroy-plugin",
      apply: () => {},
      onDestroy: () => {
        throw new Error("Destroy failed");
      },
      onError: () => {
        errorCalled = true;
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    await kernel.destroy();
    expect(errorCalled).toBe(true);
  });

  it("should handle destroy error without onError handler", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "no-error-handler-plugin",
      apply: () => {},
      onDestroy: () => {
        throw new Error("Destroy failed");
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    // Should not throw, just silently handle the error
    await expect(kernel.destroy()).resolves.not.toThrow();
  });

  it("should list plugins", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin1: Plugin = { name: "plugin-1", apply: () => {} };
    const plugin2: Plugin = { name: "plugin-2", apply: () => {} };

    kernel.use(plugin1);
    kernel.use(plugin2);

    const plugins = kernel.list();
    expect(plugins).toHaveLength(2);
  });

  it("should unregister plugins", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    let destroyCalled = false;
    const plugin: Plugin = {
      name: "removable-plugin",
      apply: () => {},
      onDestroy: () => {
        destroyCalled = true;
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    kernel.unregister("removable-plugin");
    expect(destroyCalled).toBe(true);
    expect(kernel.plugins.has("removable-plugin")).toBe(false);
  });

  it("should throw when unregistering non-existent plugin", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    expect(() => kernel.unregister("non-existent")).toThrow();
  });

  it("should throw when unregister onDestroy fails", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "fail-unregister-plugin",
      apply: () => {},
      onDestroy: () => {
        throw new Error("Unregister destroy failed");
      },
    };

    kernel.use(plugin);
    expect(() => kernel.unregister("fail-unregister-plugin")).toThrow();
  });

  it("should register plugins with dependencies", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const basePlugin: Plugin = { name: "base-plugin", apply: () => {} };
    const dependentPlugin: Plugin = {
      name: "dependent-plugin",
      apply: () => {},
      dependencies: ["base-plugin"],
    };

    kernel.use(basePlugin);
    kernel.use(dependentPlugin);
    await kernel.initialize();

    expect(kernel.plugins.has("dependent-plugin")).toBe(true);
  });

  it("should throw when missing dependency", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const dependentPlugin: Plugin = {
      name: "dependent-plugin",
      apply: () => {},
      dependencies: ["missing-plugin"],
    };

    expect(() => kernel.use(dependentPlugin)).toThrow();
  });

  it("should handle tapAsync for hooks", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    let hookCalled = false;
    const plugin: Plugin = {
      name: "async-hook-plugin",
      apply: (k) => {
        k.hooks.buildStart.tapAsync("test", async () => {
          hookCalled = true;
        });
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    await kernel.hooks.buildStart.callAsync({ config: {} } as any);
    expect(hookCalled).toBe(true);
  });

  it("should handle multiple plugins with onInit", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const initOrder: string[] = [];

    const plugin1: Plugin = {
      name: "init-plugin-1",
      apply: () => {},
      onInit: async () => {
        initOrder.push("plugin1");
      },
    };

    const plugin2: Plugin = {
      name: "init-plugin-2",
      apply: () => {},
      onInit: async () => {
        initOrder.push("plugin2");
      },
    };

    kernel.use(plugin1);
    kernel.use(plugin2);
    await kernel.initialize();

    expect(initOrder).toEqual(["plugin1", "plugin2"]);
  });

  it("should handle watchChange hook", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    let hookCalled = false;
    const plugin: Plugin = {
      name: "watch-hook-plugin",
      apply: (k) => {
        k.hooks.watchChange.tapAsync("test", async () => {
          hookCalled = true;
        });
      },
    };

    kernel.use(plugin);
    await kernel.initialize();
    await kernel.hooks.watchChange.callAsync("test.js");
    expect(hookCalled).toBe(true);
  });

  it("should handle plugin without onInit", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "no-init-plugin",
      apply: () => {},
    };

    kernel.use(plugin);
    await kernel.initialize();
    expect(kernel.plugins.has("no-init-plugin")).toBe(true);
  });

  it("should handle plugin without onDestroy", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "no-destroy-plugin",
      apply: () => {},
    };

    kernel.use(plugin);
    await kernel.initialize();
    await kernel.destroy();
    // Should complete without error
    expect(true).toBe(true);
  });

  it("should register plugins using register method", () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "registered-plugin",
      apply: () => {},
    };

    kernel.register(plugin);
    expect(kernel.plugins.has("registered-plugin")).toBe(true);
  });

  it("should throw when plugin.apply throws during initialize", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "apply-error-plugin",
      apply: () => {
        throw new Error("Apply failed");
      },
    };

    kernel.use(plugin);
    await expect(kernel.initialize()).rejects.toThrow(PluginError);
  });

  it("should throw PluginError with message when apply throws non-Error", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    const plugin: Plugin = {
      name: "apply-string-error-plugin",
      apply: () => {
        throw "String error message";
      },
    };

    kernel.use(plugin);
    await expect(kernel.initialize()).rejects.toThrow(PluginError);
  });

  it("should apply plugin added after initialization", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    await kernel.initialize();

    let applyCalled = false;
    let initCalled = false;
    const plugin: Plugin = {
      name: "late-plugin",
      apply: () => {
        applyCalled = true;
      },
      onInit: () => {
        initCalled = true;
      },
    };

    kernel.use(plugin);
    expect(applyCalled).toBe(true);
    expect(initCalled).toBe(true);
  });

  it("should handle error when plugin added after initialization throws", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    await kernel.initialize();

    let errorHandled = false;
    const plugin: Plugin = {
      name: "late-error-plugin",
      apply: () => {
        throw new Error("Late apply failed");
      },
      onError: () => {
        errorHandled = true;
      },
    };

    expect(() => kernel.use(plugin)).toThrow(PluginError);
    expect(errorHandled).toBe(true);
  });

  it("should handle non-Error thrown when plugin added after initialization", async () => {
    const kernel = new KernelImpl({
      entry: "src/index.ts",
      outDir: "dist",
      format: "esm",
      cwd: process.cwd(),
    } as any);

    await kernel.initialize();

    const plugin: Plugin = {
      name: "late-string-error-plugin",
      apply: () => {
        throw "String error";
      },
    };

    expect(() => kernel.use(plugin)).toThrow(PluginError);
  });
});
