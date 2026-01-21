import * as path from "node:path";
import { fsUtils } from "./utils/fs";
import { pathUtils } from "./utils/path";
import type { BundleConfig, Entry } from "./types";
import { ConfigError } from "./errors";

export async function loadConfigFile(
  configPath?: string,
  cwd: string = process.cwd(),
): Promise<BundleConfig | null> {
  // If a specific config path is provided, load that file directly
  if (configPath) {
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.join(cwd, configPath);

    if (!(await fsUtils.exists(absolutePath))) {
      throw new ConfigError(`Config file not found: ${absolutePath}`);
    }

    try {
      const module = await import(absolutePath);
      return module.default || module;
    } catch (error) {
      throw new ConfigError(
        `Failed to load config from ${absolutePath}: ${error}`,
      );
    }
  }

  // Otherwise, search for default config files
  const configPaths = [
    path.join(cwd, "bundler.config.ts"),
    path.join(cwd, "bundler.config.js"),
    path.join(cwd, "bundler.config.mjs"),
  ];

  for (const configFilePath of configPaths) {
    if (await fsUtils.exists(configFilePath)) {
      try {
        const module = await import(configFilePath);
        return module.default || module;
      } catch (error) {
        throw new ConfigError(
          `Failed to load config from ${configFilePath}: ${error}`,
        );
      }
    }
  }

  return null;
}

export function normalizeConfig(config: Partial<BundleConfig>): BundleConfig {
  return {
    entry: config.entry || "src/index.ts",
    outDir: config.outDir || "dist",
    format: config.format || "esm",
    minify: config.minify || false,
    splitting: config.splitting || false,
    treeshake: config.treeshake !== undefined ? config.treeshake : true,
    sourcemap: config.sourcemap || false,
    external: config.external || [],
    alias: config.alias || {},
    define: config.define || {},
    target: config.target || "es2022",
    plugins: config.plugins || [],
    typescript: config.typescript,
    watch: config.watch || false,
    chunkNames: config.chunkNames || "[name]-[hash].js",
    entryNames: config.entryNames || "[name].js",
    assetNames: config.assetNames || "[name].[ext]",
    publicPath: config.publicPath || "",
    cwd: config.cwd || process.cwd(),
  };
}

export function validateConfig(config: BundleConfig): void {
  if (!config.entry) {
    throw new ConfigError("Entry point is required");
  }

  if (!config.outDir) {
    throw new ConfigError("Output directory is required");
  }

  if (config.format) {
    const validFormats = ["esm", "cjs", "iife"] as const;
    const formats = Array.isArray(config.format)
      ? config.format
      : [config.format];
    for (const format of formats) {
      if (!validFormats.includes(format)) {
        throw new ConfigError(
          `Invalid format: ${format}. Must be one of ${validFormats.join(", ")}`,
        );
      }
    }
  }
}

export function resolveConfig(
  config: BundleConfig | Partial<BundleConfig> | (() => BundleConfig),
): BundleConfig {
  const resolved = typeof config === "function" ? config() : config;
  const normalized = normalizeConfig(resolved);
  validateConfig(normalized);
  return normalized;
}

export function normalizeEntry(entry: Entry, cwd: string): string[] {
  if (typeof entry === "string") {
    return [pathUtils.resolve(cwd, entry)];
  }

  if (Array.isArray(entry)) {
    return entry.map((e) => pathUtils.resolve(cwd, e as string));
  }

  return Object.entries(entry).map(([name, pathValue]) =>
    pathUtils.resolve(cwd, pathValue as string),
  );
}
