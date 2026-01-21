import type { Plugin, Kernel, LoadResult, LoadArgs } from "../../types.js";
import { fsUtils } from "../../utils/fs.js";
import { pathUtils } from "../../utils/path.js";
import { hashUtils } from "../../utils/hash.js";

export interface AssetsPluginOptions {
  name?: string;
  emitFiles?: boolean;
  publicPath?: string;
  limit?: number;
  inlineLimit?: number;
  include?: RegExp | RegExp[];
  exclude?: RegExp | RegExp[];
}

const DEFAULT_ASSET_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp3",
  ".mp4",
  ".avi",
  ".mov",
  ".pdf",
];

export function assetsPlugin(options?: AssetsPluginOptions): Plugin {
  const name = options?.name || "asset";
  const limit = options?.limit ?? 14 * 1024;
  const inlineLimit = options?.inlineLimit ?? 4 * 1024;
  const include = options?.include;
  const exclude = options?.exclude;
  const publicPath = options?.publicPath || "";

  const emittedAssets = new Map<
    string,
    { content: Uint8Array; fileName: string }
  >();

  return {
    name: "assets",
    apply(kernel: Kernel) {
      kernel.hooks.load.tapAsync(
        "assets",
        async (
          current: LoadResult | null | undefined,
          args: LoadArgs,
        ): Promise<LoadResult | null | undefined> => {
          if (current !== null && current !== undefined) {
            return current;
          }

          const id = args.id;
          const ext = pathUtils.extname(id).toLowerCase();

          if (!DEFAULT_ASSET_EXTENSIONS.includes(ext)) {
            return null;
          }

          if (include && !matchesInclude(id, include)) {
            return null;
          }

          if (exclude && matchesExclude(id, exclude)) {
            return null;
          }

          try {
            const buffer = await fsUtils.readFileBuffer(id);
            const content = new Uint8Array(buffer);
            const base64 = Buffer.from(content.buffer).toString("base64");

            if (content.length <= inlineLimit) {
              const dataUrl = `data:${getMimeType(id)};base64,${base64}`;
              return { code: `export default "${dataUrl}"`, map: undefined };
            }

            if (options?.emitFiles !== false) {
              const hash = hashUtils.hashFile(Buffer.from(content.buffer));
              const fileName = `${name}-${hash}${ext}`;
              const url = `${publicPath}${fileName}`;

              emittedAssets.set(id, { content, fileName });
              return { code: `export default "${url}"`, map: undefined };
            }

            return { code: `export default "${id}"`, map: undefined };
          } catch (error) {
            console.warn(`Failed to load asset ${id}:`, error);
            return null;
          }
        },
      );

      kernel.hooks.writeBundle.tapAsync("assets", async (bundle) => {
        const outDir = kernel.context.config.outDir || "dist";

        for (const [id, asset] of emittedAssets) {
          const assetPath = pathUtils.join(outDir, asset.fileName);
          await fsUtils.mkdir(outDir);
          await fsUtils.writeFile(assetPath, asset.content as any);

          bundle[asset.fileName] = {
            path: asset.fileName,
            contents: asset.content,
            size: asset.content.length,
          };
        }
      });
    },
  };
}

function getMimeType(filePath: string): string {
  const ext = pathUtils.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

function matchesInclude(
  filePath: string,
  patterns: RegExp | RegExp[],
): boolean {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  return patternArray.some((pattern) => pattern.test(filePath));
}

function matchesExclude(
  filePath: string,
  patterns: RegExp | RegExp[],
): boolean {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  return patternArray.some((pattern) => pattern.test(filePath));
}
