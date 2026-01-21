import type {
  Plugin,
  Kernel,
  TransformResult,
  TransformArgs,
} from "../../types.js";

export interface MinifyOptionsConfig {
  compress?: boolean;
  mangle?: boolean;
  sourceMap?: boolean;
  ecma?: 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | "latest";
  keepClassnames?: boolean;
  keepFnames?: boolean;
  module?: boolean;
}

export function minifierPlugin(options?: MinifyOptionsConfig): Plugin {
  return {
    name: "minifier",
    apply(kernel: Kernel) {
      kernel.hooks.transform.tapAsync(
        "minifier",
        async (
          current: string | null | undefined,
          args: TransformArgs,
        ): Promise<string | null | undefined> => {
          if (current !== null && current !== undefined) {
            return current;
          }

          const { code } = args;

          if (!options?.compress && !options?.mangle) {
            return null;
          }

          try {
            const terser = await import("terser");

            const ecmaVersion = options?.ecma ?? 2022;

            type TerserECMA =
              | 2015
              | 2016
              | 2017
              | 2018
              | 2019
              | 2020
              | 2021
              | 2022
              | "latest";

            const minifyOptions: any = {
              compress: options?.compress ?? true,
              mangle: options?.mangle ?? true,
              format: {
                ecma: ecmaVersion as TerserECMA,
                comments: false,
              },
              sourceMap: options?.sourceMap,
              keep_classnames: options?.keepClassnames,
              keep_fnames: options?.keepFnames,
              module: options?.module ?? true,
            };

            const result = (await terser.minify(code, minifyOptions)) as any;

            if (result.error) {
              throw new Error(`Minification error: ${result.error.message}`);
            }

            return result.code;
          } catch (error) {
            if (error instanceof Error && error.message.includes("terser")) {
              console.warn("terser not installed, skipping minification");
              return null;
            }
            throw error;
          }
        },
      );
    },
  };
}
