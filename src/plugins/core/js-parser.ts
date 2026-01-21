import type { Plugin, Kernel, LoadResult, LoadArgs } from "../../types.js";
import { fsUtils } from "../../utils/fs.js";
import { pathUtils } from "../../utils/path.js";

const JS_EXTENSIONS = [".js", ".mjs", ".cjs", ".jsx"];

export function jsParserPlugin(): Plugin {
  return {
    name: "js-parser",
    apply(kernel: Kernel) {
      kernel.hooks.load.tapAsync(
        "js-parser",
        async (
          current: LoadResult | null | undefined,
          args: LoadArgs,
        ): Promise<LoadResult | null | undefined> => {
          if (current !== null && current !== undefined) {
            return current;
          }

          const { id } = args;
          const ext = pathUtils.extname(id);

          if (!JS_EXTENSIONS.includes(ext)) {
            return null;
          }

          try {
            const code = await fsUtils.readFile(id);
            return { code, map: undefined };
          } catch (error) {
            return null;
          }
        },
      );
    },
  };
}
