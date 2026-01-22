import type {
  Plugin,
  Kernel,
  Chunk,
  DependencyGraph as IDependencyGraph,
} from "../../types.js";
import type { DependencyGraph } from "../../core/graph.js";

export interface SplittingOptions {
  manualChunks?:
    | Record<string, string[]>
    | ((id: string) => string | undefined);
  minSize?: number;
  chunkSizeWarningLimit?: number;
}

export function splittingPlugin(options?: SplittingOptions): Plugin {
  return {
    name: "splitting",
    apply(kernel: Kernel) {
      const graph = kernel.context.graph as DependencyGraph;

      kernel.hooks.renderChunk.tapAsync("splitting", async (code, args) => {
        if (!options || !graph) {
          return code;
        }

        return code;
      });
    },
  };
}
