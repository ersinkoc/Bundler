import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  normalizeConfig,
  validateConfig,
  resolveConfig,
  normalizeEntry,
  loadConfigFile,
} from "../../src/config.js";
import { ConfigError } from "../../src/errors.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";

describe("normalizeConfig", () => {
  it("should provide default values", () => {
    const config = normalizeConfig({});
    expect(config.entry).toBe("src/index.ts");
    expect(config.outDir).toBe("dist");
    expect(config.format).toBe("esm");
    expect(config.minify).toBe(false);
    expect(config.splitting).toBe(false);
    expect(config.treeshake).toBe(true);
    expect(config.sourcemap).toBe(false);
    expect(config.external).toEqual([]);
    expect(config.alias).toEqual({});
    expect(config.define).toEqual({});
    expect(config.target).toBe("es2022");
    expect(config.plugins).toEqual([]);
    expect(config.watch).toBe(false);
  });

  it("should preserve provided values", () => {
    const config = normalizeConfig({
      entry: "src/main.ts",
      outDir: "build",
      format: "cjs",
      minify: true,
      treeshake: false,
    });
    expect(config.entry).toBe("src/main.ts");
    expect(config.outDir).toBe("build");
    expect(config.format).toBe("cjs");
    expect(config.minify).toBe(true);
    expect(config.treeshake).toBe(false);
  });

  it("should handle splitting options", () => {
    const config = normalizeConfig({
      splitting: { manualChunks: { vendor: ["lodash"] } },
    });
    expect(config.splitting).toEqual({ manualChunks: { vendor: ["lodash"] } });
  });

  it("should handle external patterns", () => {
    const config = normalizeConfig({
      external: ["lodash", /^@babel/],
    });
    expect(config.external).toHaveLength(2);
  });

  it("should handle alias configuration", () => {
    const config = normalizeConfig({
      alias: { "@": "./src", "~": "./lib" },
    });
    expect(config.alias).toEqual({ "@": "./src", "~": "./lib" });
  });
});

describe("validateConfig", () => {
  it("should pass valid config", () => {
    expect(() =>
      validateConfig({
        entry: "src/index.ts",
        outDir: "dist",
        format: "esm",
        minify: false,
        splitting: false,
        treeshake: true,
        sourcemap: false,
        external: [],
        alias: {},
        define: {},
        target: "es2022",
        plugins: [],
        watch: false,
        chunkNames: "[name]-[hash].js",
        entryNames: "[name].js",
        assetNames: "[name].[ext]",
        publicPath: "",
        cwd: process.cwd(),
      })
    ).not.toThrow();
  });

  it("should throw on missing entry", () => {
    expect(() =>
      validateConfig({
        entry: "",
        outDir: "dist",
        format: "esm",
        minify: false,
        splitting: false,
        treeshake: true,
        sourcemap: false,
        external: [],
        alias: {},
        define: {},
        target: "es2022",
        plugins: [],
        watch: false,
        chunkNames: "[name]-[hash].js",
        entryNames: "[name].js",
        assetNames: "[name].[ext]",
        publicPath: "",
        cwd: process.cwd(),
      })
    ).toThrow(ConfigError);
  });

  it("should throw on missing outDir", () => {
    expect(() =>
      validateConfig({
        entry: "src/index.ts",
        outDir: "",
        format: "esm",
        minify: false,
        splitting: false,
        treeshake: true,
        sourcemap: false,
        external: [],
        alias: {},
        define: {},
        target: "es2022",
        plugins: [],
        watch: false,
        chunkNames: "[name]-[hash].js",
        entryNames: "[name].js",
        assetNames: "[name].[ext]",
        publicPath: "",
        cwd: process.cwd(),
      })
    ).toThrow(ConfigError);
  });

  it("should throw on invalid format", () => {
    expect(() =>
      validateConfig({
        entry: "src/index.ts",
        outDir: "dist",
        format: "invalid" as any,
        minify: false,
        splitting: false,
        treeshake: true,
        sourcemap: false,
        external: [],
        alias: {},
        define: {},
        target: "es2022",
        plugins: [],
        watch: false,
        chunkNames: "[name]-[hash].js",
        entryNames: "[name].js",
        assetNames: "[name].[ext]",
        publicPath: "",
        cwd: process.cwd(),
      })
    ).toThrow(ConfigError);
  });

  it("should validate array of formats", () => {
    expect(() =>
      validateConfig({
        entry: "src/index.ts",
        outDir: "dist",
        format: ["esm", "cjs"],
        minify: false,
        splitting: false,
        treeshake: true,
        sourcemap: false,
        external: [],
        alias: {},
        define: {},
        target: "es2022",
        plugins: [],
        watch: false,
        chunkNames: "[name]-[hash].js",
        entryNames: "[name].js",
        assetNames: "[name].[ext]",
        publicPath: "",
        cwd: process.cwd(),
      })
    ).not.toThrow();
  });

  it("should throw on invalid format in array", () => {
    expect(() =>
      validateConfig({
        entry: "src/index.ts",
        outDir: "dist",
        format: ["esm", "invalid" as any],
        minify: false,
        splitting: false,
        treeshake: true,
        sourcemap: false,
        external: [],
        alias: {},
        define: {},
        target: "es2022",
        plugins: [],
        watch: false,
        chunkNames: "[name]-[hash].js",
        entryNames: "[name].js",
        assetNames: "[name].[ext]",
        publicPath: "",
        cwd: process.cwd(),
      })
    ).toThrow(ConfigError);
  });
});

describe("resolveConfig", () => {
  it("should resolve object config", () => {
    const config = resolveConfig({
      entry: "src/main.ts",
      outDir: "build",
    });
    expect(config.entry).toBe("src/main.ts");
    expect(config.outDir).toBe("build");
  });

  it("should resolve function config", () => {
    const config = resolveConfig(() => ({
      entry: "src/app.ts",
      outDir: "output",
    }));
    expect(config.entry).toBe("src/app.ts");
    expect(config.outDir).toBe("output");
  });

  it("should normalize and validate", () => {
    const config = resolveConfig({
      entry: "index.ts",
    });
    expect(config.format).toBe("esm");
    expect(config.treeshake).toBe(true);
  });
});

describe("normalizeEntry", () => {
  const cwd = "/project";

  it("should handle string entry", () => {
    const entries = normalizeEntry("src/index.ts", cwd);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("src");
  });

  it("should handle array entry", () => {
    const entries = normalizeEntry(["src/a.ts", "src/b.ts"], cwd);
    expect(entries).toHaveLength(2);
  });

  it("should handle object entry", () => {
    const entries = normalizeEntry(
      { main: "src/main.ts", worker: "src/worker.ts" },
      cwd
    );
    expect(entries).toHaveLength(2);
  });
});

describe("loadConfigFile", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(`${os.tmpdir()}/config-test-`);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should return null when no config file exists", async () => {
    const result = await loadConfigFile(undefined, testDir);
    expect(result).toBeNull();
  });

  it("should throw when specified config file does not exist", async () => {
    await expect(
      loadConfigFile("non-existent.config.js", testDir)
    ).rejects.toThrow(ConfigError);
  });

  it("should throw when specified absolute config file does not exist", async () => {
    await expect(
      loadConfigFile(`${testDir}/non-existent.config.js`, testDir)
    ).rejects.toThrow(ConfigError);
  });

  it("should load valid config file with default export", async () => {
    const configPath = `${testDir}/bundler.config.mjs`;
    await fs.writeFile(
      configPath,
      `export default { entry: "src/index.ts", outDir: "dist" };`
    );

    const result = await loadConfigFile(configPath, testDir);
    expect(result).toBeDefined();
    expect(result?.entry).toBe("src/index.ts");
  });

  it("should load valid config file without default export", async () => {
    const configPath = `${testDir}/bundler.config.mjs`;
    await fs.writeFile(
      configPath,
      `export const entry = "src/main.ts"; export const outDir = "build";`
    );

    const result = await loadConfigFile(configPath, testDir);
    expect(result).toBeDefined();
    expect(result?.entry).toBe("src/main.ts");
  });

  it("should throw on invalid config file syntax", async () => {
    const configPath = `${testDir}/broken.config.mjs`;
    await fs.writeFile(configPath, `export default { invalid syntax`);

    await expect(loadConfigFile(configPath, testDir)).rejects.toThrow(
      ConfigError
    );
  });

  it("should discover and load bundler.config.mjs from cwd", async () => {
    const configPath = `${testDir}/bundler.config.mjs`;
    await fs.writeFile(
      configPath,
      `export default { entry: "discovered.ts", outDir: "out" };`
    );

    const result = await loadConfigFile(undefined, testDir);
    expect(result).toBeDefined();
    expect(result?.entry).toBe("discovered.ts");
  });

  it("should throw when discovered config file has syntax error", async () => {
    const configPath = `${testDir}/bundler.config.mjs`;
    await fs.writeFile(configPath, `export default { broken syntax`);

    await expect(loadConfigFile(undefined, testDir)).rejects.toThrow(
      ConfigError
    );
  });
});
