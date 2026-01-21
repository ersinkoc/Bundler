import type { Plugin, Kernel, LoadResult, LoadArgs } from "../../types.js";
import { fsUtils } from "../../utils/fs.js";
import { pathUtils } from "../../utils/path.js";
import { hashUtils } from "../../utils/hash.js";

export interface CSSPluginOptions {
  inject?: boolean;
  extract?: boolean;
  cssModules?: boolean;
  minify?: boolean;
  loader?: (content: string, id: string) => string;
}

export function cssPlugin(options?: CSSPluginOptions): Plugin {
  const extractedCSS = new Map<string, string>();

  return {
    name: "css",
    apply(kernel: Kernel) {
      kernel.hooks.load.tapAsync(
        "css",
        async (
          current: LoadResult | null | undefined,
          args: LoadArgs,
        ): Promise<LoadResult | null | undefined> => {
          if (current !== null && current !== undefined) {
            return current;
          }

          const { id } = args;
          const ext = id.split(".").pop()?.toLowerCase();

          if (ext !== "css") {
            return null;
          }

          try {
            const code = await fsUtils.readFile(id);
            const transformedCode = options?.loader
              ? options.loader(code, id)
              : code;

            if (options?.inject) {
              const jsCode = `
              const style = document.createElement('style');
              style.textContent = ${JSON.stringify(code)};
              document.head.appendChild(style);
            `;
              return { code: jsCode, map: undefined };
            }

            if (options?.extract) {
              extractedCSS.set(id, code);
            }

            return { code: `export default "${id}"`, map: undefined };
          } catch (error) {
            console.warn(`Failed to load CSS ${id}:`, error);
            return null;
          }
        },
      );

      kernel.hooks.transform.tapAsync(
        "css",
        async (
          current: string | null | undefined,
          args,
        ): Promise<string | null | undefined> => {
          if (current !== null && current !== undefined) {
            return current;
          }

          const { id, code } = args;
          const ext = id.split(".").pop()?.toLowerCase();

          if (ext === "css" && options?.inject) {
            return `
            const style = document.createElement('style');
            style.textContent = ${JSON.stringify(code)};
            document.head.appendChild(style);
          `;
          }

          return undefined;
        },
      );

      kernel.hooks.writeBundle.tapAsync("css", async (bundle) => {
        if (options?.extract) {
          const outDir = kernel.context.config.outDir || "dist";

          for (const [id, css] of extractedCSS) {
            const cssHash = hashUtils.hash(id);
            const cssFileName = `style-${cssHash}.css`;
            const cssPath = pathUtils.join(outDir, cssFileName);

            await fsUtils.mkdir(outDir);
            await fsUtils.writeFile(cssPath, css);

            bundle[cssFileName] = {
              path: cssFileName,
              contents: css,
              size: css.length,
            };
          }
        }
      });
    },
  };
}
