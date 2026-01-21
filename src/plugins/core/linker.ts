import type { Plugin, Kernel, Chunk } from "../../types.js";
import { BundleLinker } from "../../core/linker.js";

export interface LinkerPluginOptions {
  format?: "esm" | "cjs" | "iife";
  globalName?: string;
  treeshake?: boolean;
}

export function linkerPlugin(options?: LinkerPluginOptions): Plugin {
  const format = options?.format || "esm";
  const globalName = options?.globalName;
  const treeshake = options?.treeshake ?? true;

  return {
    name: "linker",
    apply(kernel: Kernel) {
      const linker = new BundleLinker({ format, globalName, treeshake });
      kernel.hooks.renderChunk.tapAsync("linker", async (code) => {
        return code;
      });
    },
  };
}
