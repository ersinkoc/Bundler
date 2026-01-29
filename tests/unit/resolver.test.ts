import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ModuleResolver } from "../../src/core/resolver.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

describe("ModuleResolver", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(`${os.tmpdir()}/resolver-test-`);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("should create with default options", () => {
      const resolver = new ModuleResolver();
      expect(resolver).toBeDefined();
    });

    it("should create with custom options", () => {
      const resolver = new ModuleResolver({
        alias: { "@": "./src" },
        external: ["lodash", /^react/],
        extensions: [".ts", ".tsx"],
        mainFields: ["module", "main"],
        cwd: testDir,
      });
      expect(resolver).toBeDefined();
    });
  });

  describe("isExternal", () => {
    it("should treat node: protocol as external", () => {
      const resolver = new ModuleResolver();
      expect(resolver.isExternal("node:fs")).toBe(true);
      expect(resolver.isExternal("node:path")).toBe(true);
    });

    it("should match exact string externals", () => {
      const resolver = new ModuleResolver({ external: ["lodash"] });
      expect(resolver.isExternal("lodash")).toBe(true);
      expect(resolver.isExternal("lodash/fp")).toBe(true);
      expect(resolver.isExternal("underscore")).toBe(false);
    });

    it("should match regex externals", () => {
      const resolver = new ModuleResolver({ external: [/^react/] });
      expect(resolver.isExternal("react")).toBe(true);
      expect(resolver.isExternal("react-dom")).toBe(true);
      expect(resolver.isExternal("vue")).toBe(false);
    });

    it("should return false for non-external", () => {
      const resolver = new ModuleResolver({ external: ["lodash"] });
      expect(resolver.isExternal("./local")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should return external paths unchanged", () => {
      const resolver = new ModuleResolver({ external: ["lodash"] });
      expect(resolver.resolve("lodash", "/test/file.js")).toBe("lodash");
    });

    it("should resolve relative paths", async () => {
      await fs.writeFile(`${testDir}/utils.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/index.js`, "");

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("./utils.js", `${testDir}/index.js`);
      expect(result).toContain("utils.js");
    });

    it("should resolve with extensions", async () => {
      await fs.writeFile(`${testDir}/module.ts`, "export const x = 1");

      const resolver = new ModuleResolver({
        cwd: testDir,
        extensions: [".ts", ".js"]
      });
      const result = resolver.resolve("./module", `${testDir}/index.js`);
      expect(result).toContain("module.ts");
    });
  });

  describe("resolveSync", () => {
    it("should throw ResolveError for non-existent file", () => {
      const resolver = new ModuleResolver({ cwd: testDir });
      expect(() =>
        resolver.resolveSync("./non-existent", `${testDir}/index.js`)
      ).toThrow();
    });

    it("should return external paths unchanged", () => {
      const resolver = new ModuleResolver({ external: ["lodash"] });
      const result = resolver.resolveSync("lodash", "/test/file.js");
      expect(result).toBe("lodash");
    });
  });

  describe("alias resolution", () => {
    it("should resolve exact alias", async () => {
      await fs.mkdir(`${testDir}/src`, { recursive: true });
      await fs.writeFile(`${testDir}/src/util.js`, "export const x = 1");

      const resolver = new ModuleResolver({
        alias: { "@": "./src" },
        cwd: testDir,
      });
      const result = resolver.resolve("@/util.js", `${testDir}/index.js`);
      expect(result).toContain("util.js");
    });

    it("should resolve alias with subpath", async () => {
      await fs.mkdir(`${testDir}/src/utils`, { recursive: true });
      await fs.writeFile(`${testDir}/src/utils/helper.js`, "export const x = 1");

      const resolver = new ModuleResolver({
        alias: { "@": "./src" },
        cwd: testDir,
      });
      const result = resolver.resolve("@/utils/helper.js", `${testDir}/index.js`);
      expect(result).toContain("helper.js");
    });
  });

  describe("directory resolution", () => {
    it("should resolve index file in directory", async () => {
      await fs.mkdir(`${testDir}/lib`, { recursive: true });
      await fs.writeFile(`${testDir}/lib/index.js`, "export const x = 1");

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("./lib", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });

    it("should resolve main field from package.json", async () => {
      await fs.mkdir(`${testDir}/lib`, { recursive: true });
      await fs.writeFile(`${testDir}/lib/entry.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/lib/package.json`, JSON.stringify({
        main: "./entry.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("./lib", `${testDir}/main.js`);
      expect(result).toContain("entry.js");
    });

    it("should prefer module field over main", async () => {
      await fs.mkdir(`${testDir}/lib`, { recursive: true });
      await fs.writeFile(`${testDir}/lib/entry.cjs`, "");
      await fs.writeFile(`${testDir}/lib/entry.mjs`, "");
      await fs.writeFile(`${testDir}/lib/package.json`, JSON.stringify({
        main: "./entry.cjs",
        module: "./entry.mjs"
      }));

      const resolver = new ModuleResolver({
        cwd: testDir,
        mainFields: ["module", "main"]
      });
      const result = resolver.resolve("./lib", `${testDir}/main.js`);
      expect(result).toContain("entry.mjs");
    });
  });

  describe("node_modules resolution", () => {
    it("should resolve bare module from node_modules", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        main: "./index.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/main.js`);
      expect(result).toContain("test-pkg");
    });

    it("should resolve bare module subpath", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg/utils`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/utils/helper.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg/utils/helper.js", `${testDir}/main.js`);
      expect(result).toContain("helper.js");
    });

    it("should resolve scoped packages", async () => {
      await fs.mkdir(`${testDir}/node_modules/@scope/test-pkg`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/@scope/test-pkg/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/@scope/test-pkg/package.json`, JSON.stringify({
        name: "@scope/test-pkg",
        main: "./index.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("@scope/test-pkg", `${testDir}/main.js`);
      expect(result).toContain("test-pkg");
    });

    it("should walk up directories to find node_modules", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg`, { recursive: true });
      await fs.mkdir(`${testDir}/src/components`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        main: "./index.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/src/components/Button.js`);
      expect(result).toContain("test-pkg");
    });
  });

  describe("package.json exports", () => {
    it("should resolve string exports", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg/dist`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/dist/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        exports: "./dist/index.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });

    it("should resolve object exports with dot entry", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg/dist`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/dist/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        exports: {
          ".": "./dist/index.js"
        }
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });

    it("should resolve exports with default condition", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg/dist`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/dist/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        exports: {
          ".": {
            default: "./dist/index.js"
          }
        }
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });

    it("should handle exports with empty object (fallback to main)", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        exports: {},
        main: "./index.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });

    it("should use module field when available", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg/esm`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/esm/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        module: "./esm/index.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/main.js`);
      expect(result).toContain("esm");
      expect(result).toContain("index.js");
    });

    it("should handle exports array format", async () => {
      await fs.mkdir(`${testDir}/node_modules/test-pkg/dist`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/test-pkg/dist/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/test-pkg/package.json`, JSON.stringify({
        name: "test-pkg",
        exports: ["./dist/index.js"]
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("test-pkg", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });
  });

  describe("absolute paths", () => {
    it("should resolve absolute paths", async () => {
      await fs.writeFile(`${testDir}/absolute.js`, "export const x = 1");

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve(`${testDir}/absolute.js`, `${testDir}/main.js`);
      expect(result).toContain("absolute.js");
    });
  });

  describe("edge cases", () => {
    it("should handle invalid package.json gracefully", async () => {
      await fs.mkdir(`${testDir}/node_modules/invalid-json`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/invalid-json/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/invalid-json/package.json`, "{ invalid json");

      const resolver = new ModuleResolver({ cwd: testDir });
      // Should fall back to index resolution
      const result = resolver.resolve("invalid-json", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });

    it("should resolve directory with package.json exports returning null", async () => {
      await fs.mkdir(`${testDir}/node_modules/null-exports`, { recursive: true });
      await fs.writeFile(`${testDir}/node_modules/null-exports/index.js`, "export const x = 1");
      await fs.writeFile(`${testDir}/node_modules/null-exports/package.json`, JSON.stringify({
        name: "null-exports",
        exports: {
          "./other": "./other.js"
        },
        main: "./index.js"
      }));

      const resolver = new ModuleResolver({ cwd: testDir });
      const result = resolver.resolve("null-exports", `${testDir}/main.js`);
      expect(result).toContain("index.js");
    });
  });
});
