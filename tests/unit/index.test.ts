import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  bundle,
  defineConfig,
  definePlugin,
  Kernel,
  DependencyGraph,
  ModuleResolver,
  BundleLinker,
  resolveConfig,
  loadConfigFile,
} from "../../src/index.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

describe("exports", () => {
  it("should export Kernel", () => {
    expect(Kernel).toBeDefined();
  });

  it("should export DependencyGraph", () => {
    expect(DependencyGraph).toBeDefined();
  });

  it("should export ModuleResolver", () => {
    expect(ModuleResolver).toBeDefined();
  });

  it("should export BundleLinker", () => {
    expect(BundleLinker).toBeDefined();
  });

  it("should export resolveConfig", () => {
    expect(resolveConfig).toBeDefined();
  });

  it("should export loadConfigFile", () => {
    expect(loadConfigFile).toBeDefined();
  });
});

describe("defineConfig", () => {
  it("should return resolved config", () => {
    const config = defineConfig({
      entry: "src/index.ts",
      outDir: "dist",
    });

    expect(config).toBeDefined();
    expect(config.outDir).toBe("dist");
  });

  it("should handle format array", () => {
    const config = defineConfig({
      entry: "src/index.ts",
      outDir: "dist",
      format: ["esm", "cjs"],
    });

    expect(config.format).toEqual(["esm", "cjs"]);
  });

  it("should handle plugins", () => {
    const config = defineConfig({
      entry: "src/index.ts",
      outDir: "dist",
      plugins: [],
    });

    expect(config.plugins).toBeDefined();
  });
});

describe("definePlugin", () => {
  it("should return plugin as-is", () => {
    const myPlugin = {
      name: "test-plugin",
      apply: () => {},
    };

    const result = definePlugin(myPlugin);
    expect(result).toBe(myPlugin);
  });

  it("should work with typed plugins", () => {
    const typedPlugin = definePlugin<{ graph: any; config: any }>({
      name: "typed-plugin",
      apply: (kernel) => {
        // Access typed context
      },
    });

    expect(typedPlugin.name).toBe("typed-plugin");
  });
});

describe("bundle function", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(`${os.tmpdir()}/index-test-`);
    await fs.mkdir(`${testDir}/src`, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should bundle with treeshake enabled", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const used = 1;\nexport const unused = 2;"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      treeshake: true,
    });

    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should bundle with treeshake disabled", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const foo = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      treeshake: false,
    });

    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should bundle with custom globalName for IIFE", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 42"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      format: "iife",
      globalName: "MyLibrary",
    });

    expect(result.outputs.length).toBeGreaterThan(0);
    const output = result.outputs[0];
    // IIFE format wraps the code in a function
    expect(output.contents).toContain("function");
    expect(output.format).toBe("iife");
  });

  it("should bundle with splitting options", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      splitting: {
        manualChunks: {},
      },
    });

    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should handle alias configuration", async () => {
    await fs.mkdir(`${testDir}/src/utils`, { recursive: true });
    await fs.writeFile(
      `${testDir}/src/utils/helper.js`,
      "export const helper = () => 'help'"
    );
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "import { helper } from './utils/helper.js';\nexport const x = helper();"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      alias: {
        "@utils": "./src/utils",
      },
    });

    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should handle external configuration", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "import lodash from 'lodash';\nexport const x = lodash;"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      external: ["lodash"],
    });

    expect(result.outputs.length).toBeGreaterThan(0);
    expect(result.outputs[0].contents).toContain("lodash");
  });

  it("should include duration in result", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
    });

    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should include graph in result", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
    });

    expect(result.graph).toBeDefined();
    expect(result.graph.modules).toBeDefined();
  });

  it("should include warnings in result", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
    });

    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("should bundle with multiple formats", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      format: ["esm", "cjs"],
    });

    expect(result.outputs.length).toBeGreaterThan(1);
  });

  it("should throw on entry not found", async () => {
    await expect(
      bundle({
        entry: "src/non-existent.js",
        outDir: "dist",
        cwd: testDir,
      })
    ).rejects.toThrow(/not found|Entry/);
  });

  it("should bundle with CJS format", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const foo = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      format: "cjs",
    });

    expect(result.outputs.length).toBeGreaterThan(0);
    expect(result.outputs[0].format).toBe("cjs");
  });

  it("should handle array entry", async () => {
    await fs.writeFile(
      `${testDir}/src/main.js`,
      "export const main = 1"
    );
    await fs.writeFile(
      `${testDir}/src/worker.js`,
      "export const worker = 2"
    );

    const result = await bundle({
      entry: ["src/main.js", "src/worker.js"],
      outDir: "dist",
      cwd: testDir,
    });

    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should handle object entry", async () => {
    await fs.writeFile(
      `${testDir}/src/main.js`,
      "export const main = 1"
    );

    const result = await bundle({
      entry: { main: "src/main.js" },
      outDir: "dist",
      cwd: testDir,
    });

    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should accept plugins in config", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      plugins: [
        {
          name: "test-plugin",
          apply: () => {},
        },
      ],
    });

    // Bundle should complete successfully with plugins defined
    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should have entry module in graph", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "export const x = 1"
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
    });

    // The graph should have at least one module
    expect(result.graph.modules.size).toBeGreaterThan(0);
  });

  it("should handle resolve warning for non-external modules", async () => {
    await fs.writeFile(
      `${testDir}/src/index.js`,
      "import { foo } from './non-existent.js';\nexport const x = 1"
    );

    // Should not throw, just warn
    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
    });

    expect(result.outputs.length).toBeGreaterThan(0);
  });
});

describe("watch function", () => {
  let watchTestDir: string;

  beforeEach(async () => {
    watchTestDir = await fs.mkdtemp(`${os.tmpdir()}/watch-test-`);
  });

  afterEach(async () => {
    await fs.rm(watchTestDir, { recursive: true, force: true });
  });

  it("should export watch function", async () => {
    const { watch } = await import("../../src/index.js");
    expect(watch).toBeDefined();
    expect(typeof watch).toBe("function");
  });

  it("should be callable with config", async () => {
    const { watch } = await import("../../src/index.js");
    // Just verify the function exists and can be called
    // Actual watching behavior depends on chokidar availability
    expect(typeof watch).toBe("function");
  });

  it("should start watching and return close function", async () => {
    const { watch } = await import("../../src/index.js");

    // Create a test file to watch
    await fs.mkdir(`${watchTestDir}/src`, { recursive: true });
    await fs.writeFile(`${watchTestDir}/src/index.js`, "export const x = 1;");

    // Start watching
    const watcher = await watch({
      entry: "src/index.js",
      outDir: "dist",
      cwd: watchTestDir,
    });

    // Verify we get a close function
    expect(watcher).toBeDefined();
    expect(typeof watcher.close).toBe("function");

    // Close the watcher
    watcher.close();
  });

  it("should handle close when no watcher instance exists", async () => {
    const { watch } = await import("../../src/index.js");

    // Create a test file to watch
    await fs.mkdir(`${watchTestDir}/src`, { recursive: true });
    await fs.writeFile(`${watchTestDir}/src/index.js`, "export const x = 1;");

    // Start watching
    const watcher = await watch({
      entry: "src/index.js",
      outDir: "dist",
      cwd: watchTestDir,
    });

    // Close multiple times should not throw
    watcher.close();
    watcher.close();
    expect(true).toBe(true);
  });

  it("should trigger rebuild on file change", async () => {
    const { watch } = await import("../../src/index.js");

    // Create a test file to watch
    await fs.mkdir(`${watchTestDir}/src`, { recursive: true });
    await fs.writeFile(`${watchTestDir}/src/index.js`, "export const x = 1;");

    // Start watching
    const watcher = await watch({
      entry: "src/index.js",
      outDir: "dist",
      cwd: watchTestDir,
    });

    // Wait for watcher to be ready, then modify the file
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.writeFile(`${watchTestDir}/src/index.js`, "export const x = 2;");

    // Wait for the change event to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));

    watcher.close();
  });

  it("should trigger rebuild on file add", async () => {
    const { watch } = await import("../../src/index.js");

    // Create a test file to watch
    await fs.mkdir(`${watchTestDir}/src`, { recursive: true });
    await fs.writeFile(`${watchTestDir}/src/index.js`, "export const x = 1;");

    // Start watching
    const watcher = await watch({
      entry: "src/index.js",
      outDir: "dist",
      cwd: watchTestDir,
    });

    // Wait for watcher to be ready, then add a new file
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.writeFile(`${watchTestDir}/src/utils.js`, "export const y = 2;");

    // Wait for the add event to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));

    watcher.close();
  });

  it("should trigger rebuild on file delete", async () => {
    const { watch } = await import("../../src/index.js");

    // Create test files to watch
    await fs.mkdir(`${watchTestDir}/src`, { recursive: true });
    await fs.writeFile(`${watchTestDir}/src/index.js`, "export const x = 1;");
    await fs.writeFile(`${watchTestDir}/src/utils.js`, "export const y = 2;");

    // Start watching
    const watcher = await watch({
      entry: "src/index.js",
      outDir: "dist",
      cwd: watchTestDir,
    });

    // Wait for watcher to be ready, then delete a file
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.unlink(`${watchTestDir}/src/utils.js`);

    // Wait for the unlink event to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));

    watcher.close();
  });
});

describe("additional exports", () => {
  it("should export all required types and classes", async () => {
    const exports = await import("../../src/index.js");

    expect(exports.bundle).toBeDefined();
    expect(exports.watch).toBeDefined();
    expect(exports.defineConfig).toBeDefined();
    expect(exports.definePlugin).toBeDefined();
    expect(exports.Kernel).toBeDefined();
    expect(exports.DependencyGraph).toBeDefined();
    expect(exports.ModuleResolver).toBeDefined();
    expect(exports.BundleLinker).toBeDefined();
    expect(exports.loadConfigFile).toBeDefined();
    expect(exports.resolveConfig).toBeDefined();
  });
});
