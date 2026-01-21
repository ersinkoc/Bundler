import type {
  Plugin,
  Kernel,
  TransformResult,
  TransformArgs,
  RenderChunkArgs,
} from "../../types.js";
import type { DependencyGraph } from "../../core/graph.js";
import { hashUtils } from "../../utils/hash.js";

export interface SplittingOptions {
  manualChunks?:
    | Record<string, string[]>
    | ((id: string) => string | undefined);
  chunkSizeWarningLimit?: number;
  minChunkSize?: number;
}

export function splittingPlugin(options?: SplittingOptions): Plugin {
  return {
    name: "splitting",
    apply(kernel: Kernel) {
      const graph = kernel.context.graph as DependencyGraph;

      kernel.hooks.transform.tapAsync(
        "splitting",
        async (
          current: string | null | undefined,
          args: TransformArgs,
        ): Promise<string | null | undefined> => {
          return current;
        },
      );

      kernel.hooks.renderChunk.tapAsync(
        "splitting",
        async (
          current: string | null | undefined,
          args: RenderChunkArgs,
        ): Promise<string | null | undefined> => {
          return current;
        },
      );
    },
  };
}
