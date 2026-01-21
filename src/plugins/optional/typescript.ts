import type { Plugin, Kernel, LoadResult, LoadArgs } from "../../types.js";
import { fsUtils } from "../../utils/fs.js";
import { pathUtils } from "../../utils/path.js";

export interface TypeScriptOptions {
  tsconfig?: string;
  compilerOptions?: {
    target?: string;
    module?: string;
    lib?: string[];
    strict?: boolean;
    esModuleInterop?: boolean;
    skipLibCheck?: boolean;
    declaration?: boolean;
    declarationMap?: boolean;
    sourceMap?: boolean;
    removeComments?: boolean;
  };
  transpileOnly?: boolean;
}

export function typescriptPlugin(options?: TypeScriptOptions): Plugin {
  const tsconfigPath = options?.tsconfig;
  const transpileOnly = options?.transpileOnly ?? true;

  let typescript: any = null;

  return {
    name: "typescript",
    apply(kernel: Kernel) {
      kernel.hooks.buildStart.tapAsync("typescript", async () => {
        try {
          typescript = await import("typescript");
        } catch (error) {
          console.warn("TypeScript not installed, skipping TypeScript plugin");
        }
      });

      kernel.hooks.load.tapAsync(
        "typescript",
        async (
          current: LoadResult | null | undefined,
          args: LoadArgs,
        ): Promise<LoadResult | null | undefined> => {
          if (current !== null && current !== undefined) {
            return current;
          }

          if (!typescript) {
            return null;
          }

          const ext = args.id.split(".").pop()?.toLowerCase();

          if (ext !== "ts" && ext !== "tsx") {
            return null;
          }

          try {
            const code = await fsUtils.readFile(args.id);

            const tsOptions: any = {
              target: typescript.ScriptTarget.ES2022,
              module: typescript.ModuleKind.ESNext,
              lib: ["ES2022"],
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              removeComments: false,
              ...options?.compilerOptions,
            };

            if (tsconfigPath) {
              const configContent = await fsUtils.readFile(tsconfigPath);
              const tsconfig = JSON.parse(configContent);
              Object.assign(tsOptions, tsconfig.compilerOptions);
            }

            const result = typescript.transpileModule(code, {
              compilerOptions: tsOptions,
              fileName: args.id,
              reportDiagnostics: !transpileOnly,
            });

            if (result.diagnostics && result.diagnostics.length > 0) {
              const errors = result.diagnostics
                .filter(
                  (d: any) =>
                    d.category === typescript.DiagnosticCategory.Error,
                )
                .map((d: any) =>
                  typescript.flattenDiagnosticMessageText(d.messageText, "\n"),
                );

              if (errors.length > 0) {
                throw new Error(
                  `TypeScript errors in ${args.id}:\n${errors.join("\n")}`,
                );
              }
            }

            return {
              code: result.outputText,
              map: result.sourceMapText
                ? JSON.parse(result.sourceMapText)
                : undefined,
            };
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`TypeScript plugin error: ${error.message}`);
            }
            return null;
          }
        },
      );

      kernel.hooks.transform.tapAsync(
        "typescript",
        async (
          current: string | null | undefined,
        ): Promise<string | null | undefined> => {
          return current;
        },
      );
    },
  };
}
