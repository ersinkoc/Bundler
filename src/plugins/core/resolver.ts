import type {
  Plugin,
  Kernel,
  ResolveResult,
  ResolveArgs,
} from "../../types.js";
import { ModuleResolver } from "../../core/resolver.js";

export interface ResolverPluginOptions {
  alias?: Record<string, string>;
  external?: (string | RegExp)[];
  extensions?: string[];
  mainFields?: string[];
  cwd?: string;
}

export function resolverPlugin(options?: ResolverPluginOptions): Plugin {
  return {
    name: "resolver",
    apply(kernel: Kernel) {
      const resolver = new ModuleResolver(options);

      kernel.hooks.resolve.tapAsync(
        "resolver",
        async (
          current: ResolveResult | null | undefined,
          args: ResolveArgs,
        ): Promise<ResolveResult | null | undefined> => {
          if (current !== null && current !== undefined) {
            return current;
          }

          if (options?.external) {
            for (const external of options.external) {
              if (typeof external === "string") {
                if (
                  args.id === external ||
                  args.id.startsWith(`${external}/`)
                ) {
                  return { id: args.id, external: true };
                }
              } else if (external instanceof RegExp && external.test(args.id)) {
                return { id: args.id, external: true };
              }
            }
          }

          try {
            const resolved = resolver.resolveSync(args.id, args.importer);
            return { id: resolved, external: false };
          } catch {
            return null;
          }
        },
      );
    },
  };
}
