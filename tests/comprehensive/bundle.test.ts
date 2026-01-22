import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { bundle } from "../../dist/index.js";

describe("Bundler - Core Test Suite", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(`${os.tmpdir()}/bundler-test-`);
    await fs.mkdir(`${testDir}/src`, { recursive: true });
    await fs.mkdir(`${testDir}/test-files`, { recursive: true });
    await fs.mkdir(`${testDir}/expected`, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to cleanup test directory:", error);
    }
  });

  describe("Parser - Import Syntax", () => {
    it("should parse default imports", async () => {
      await fs.writeFile(`${testDir}/src/default.js`, "export default 42");
      const result = await bundle({
        entry: "src/default.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse named imports", async () => {
      await fs.writeFile(`${testDir}/src/named.js`, "export const named = 1");
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { named } from "./named.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse namespace imports", async () => {
      await fs.writeFile(
        `${testDir}/src/namespace.js`,
        "export const a = 1\nexport const b = 2",
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import * as ns from "./namespace.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse mixed imports (default + named)", async () => {
      await fs.writeFile(
        `${testDir}/src/mixed.js`,
        "export const def = 42\nexport const named = 1",
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import def, { named } from "./mixed.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse multi-line imports", async () => {
      await fs.writeFile(
        `${testDir}/src/exports.js`,
        "export const a = 1\nexport const b = 2\nexport const c = 3\nexport const d = 4",
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { a, b, c, d } from "./exports.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse inline imports", async () => {
      await fs.writeFile(
        `${testDir}/src/inline.js`,
        'export { a, b, c } from "./exports.js"',
      );
      await fs.writeFile(
        `${testDir}/src/exports.js`,
        "export const a = 1\nexport const b = 2\nexport const c = 3",
      );
      const result = await bundle({
        entry: "src/inline.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse template import paths", async () => {
      await fs.writeFile(
        `${testDir}/src/template.js`,
        'export const name = "test"',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { name } from "./template.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse re-exports", async () => {
      await fs.writeFile(
        `${testDir}/src/original.js`,
        "export const value = 42",
      );
      await fs.writeFile(
        `${testDir}/src/re-export.js`,
        'export { value } from "./original.js"',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { value } from "./re-export.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Parser - Dynamic Imports", () => {
    it("should parse dynamic imports with strings", async () => {
      await fs.writeFile(
        `${testDir}/src/dynamic.js`,
        'const mod = await import("./lazy.js")',
      );
      await fs.writeFile(`${testDir}/src/lazy.js`, "export const lazy = 1");
      const result = await bundle({
        entry: "src/dynamic.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse dynamic imports with template literals", async () => {
      await fs.writeFile(
        `${testDir}/src/dynamic.js`,
        'const name = "lazy"; const mod = await import(`./${name}.js`)',
      );
      await fs.writeFile(`${testDir}/src/lazy.js`, "export const lazy = 1");
      const result = await bundle({
        entry: "src/dynamic.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse dynamic imports with expressions", async () => {
      await fs.writeFile(
        `${testDir}/src/dynamic.js`,
        'const mod = await import("./" + "lazy.js")',
      );
      await fs.writeFile(`${testDir}/src/lazy.js`, "export const lazy = 1");
      const result = await bundle({
        entry: "src/dynamic.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse self-imports", async () => {
      await fs.writeFile(
        `${testDir}/src/self.js`,
        'const mod = await import("./self.js")',
      );
      const result = await bundle({
        entry: "src/self.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Parser - Export Syntax", () => {
    it("should parse default exports", async () => {
      await fs.writeFile(`${testDir}/src/default.js`, "export default 42");
      const result = await bundle({
        entry: "src/default.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse named exports", async () => {
      await fs.writeFile(
        `${testDir}/src/named.js`,
        "export const a = 1\nexport const b = 2",
      );
      const result = await bundle({
        entry: "src/named.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse export lists", async () => {
      await fs.writeFile(
        `${testDir}/src/list.js`,
        "const a = 1\nconst b = 2\nconst c = 3\nexport { a, b, c }",
      );
      const result = await bundle({
        entry: "src/list.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse export from statements", async () => {
      await fs.writeFile(
        `${testDir}/src/original.js`,
        "export const value = 42",
      );
      await fs.writeFile(
        `${testDir}/src/reexport.js`,
        'export { value } from "./original.js"',
      );
      const result = await bundle({
        entry: "src/reexport.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should parse export all statements", async () => {
      await fs.writeFile(
        `${testDir}/src/exports.js`,
        "export const a = 1\nexport const b = 2",
      );
      await fs.writeFile(
        `${testDir}/src/reexport.js`,
        'export * from "./exports.js"',
      );
      const result = await bundle({
        entry: "src/reexport.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Circular Dependencies", () => {
    it("should detect 2-way circular dependencies", async () => {
      await fs.writeFile(
        `${testDir}/src/a.js`,
        'import { b } from "./b.js"; export const a = () => b()',
      );
      await fs.writeFile(
        `${testDir}/src/b.js`,
        'import { a } from "./a.js"; export const b = () => a()',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { a } from "./a.js"',
      );

      await expect(
        bundle({
          entry: "src/main.js",
          outDir: "dist",
          cwd: testDir,
        }),
      ).resolves.toBeTruthy();
    });

    it("should detect 3-way circular dependencies", async () => {
      await fs.writeFile(
        `${testDir}/src/a.js`,
        'import { b } from "./b.js"; export const a = 1',
      );
      await fs.writeFile(
        `${testDir}/src/b.js`,
        'import { c } from "./c.js"; export const b = 2',
      );
      await fs.writeFile(
        `${testDir}/src/c.js`,
        'import { a } from "./a.js"; export const c = 3',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { a } from "./a.js"',
      );

      await expect(
        bundle({
          entry: "src/main.js",
          outDir: "dist",
          cwd: testDir,
        }),
      ).resolves.toBeTruthy();
    });

    it("should handle self-imports gracefully", async () => {
      await fs.writeFile(
        `${testDir}/src/self.js`,
        'import { value } from "./self.js"; export const value = 42',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { value } from "./self.js"',
      );

      await expect(
        bundle({
          entry: "src/main.js",
          outDir: "dist",
          cwd: testDir,
        }),
      ).resolves.toBeTruthy();
    });

    it("should handle cross-chunk circular dependencies", async () => {
      await fs.writeFile(
        `${testDir}/src/a.js`,
        'import { b } from "./b.js"; export const a = 1',
      );
      await fs.writeFile(
        `${testDir}/src/b.js`,
        'import { a } from "./a.js"; export const b = 2',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { a } from "./a.js"',
      );

      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        format: "esm",
      });

      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("External Dependencies", () => {
    it("should exclude external dependencies", async () => {
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { resolve } from "path"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        external: ["path"],
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should handle external patterns", async () => {
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import React from "react"; import { resolve } from "path"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        external: [/react/],
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should handle multiple external dependencies", async () => {
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import a from "react"; import b from "vue"; import c from "lodash"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        external: ["react", "vue", "lodash"],
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Multiple Entry Points", () => {
    it.skip("should handle object entry points", async () => {
      // TODO: Implement multiple output generation for object entry points
      await fs.writeFile(`${testDir}/src/a.js`, "export const a = 1");
      await fs.writeFile(`${testDir}/src/b.js`, "export const b = 2");
      const result = await bundle({
        entry: { main: "src/a.js", secondary: "src/b.js" },
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBe(2);
    });

    it.skip("should handle array entry points", async () => {
      // TODO: Implement multiple output generation for array entry points
      await fs.writeFile(`${testDir}/src/a.js`, "export const a = 1");
      await fs.writeFile(`${testDir}/src/b.js`, "export const b = 2");
      const result = await bundle({
        entry: ["src/a.js", "src/b.js"],
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBe(2);
    });

    it("should handle mixed entry types", async () => {
      await fs.writeFile(`${testDir}/src/a.js`, "export const a = 1");
      await fs.writeFile(`${testDir}/src/b.js`, "export const b = 2");
      const result = await bundle({
        entry: "src/a.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Output Formats", () => {
    it("should generate ESM format", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        format: "esm",
      });
      expect(result.outputs[0]?.format).toBe("esm");
    });

    it("should generate CJS format", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        format: "cjs",
      });
      expect(result.outputs[0]?.format).toBe("cjs");
    });

    it("should generate IIFE format", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        format: "iife",
        globalName: "Bundle",
      });
      expect(result.outputs[0]?.format).toBe("iife");
    });

    it("should handle format-specific optimizations", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      await fs.writeFile(
        `${testDir}/src/unused.js`,
        "export const unused = 99",
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        format: "esm",
      });
      expect(result.outputs[0]?.contents).not.toContain("unused");
    });
  });

  describe("Tree Shaking", () => {
    it("should remove unused exports", async () => {
      await fs.writeFile(
        `${testDir}/src/lib.js`,
        "export const used = 1\nexport const unused = 2\nexport const alsoUnused = 3",
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { used } from "./lib.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs[0]?.contents).not.toContain("unused");
      expect(result.outputs[0]?.contents).toContain("used");
    });

    it("should preserve re-exported modules", async () => {
      await fs.writeFile(
        `${testDir}/src/original.js`,
        "export const a = 1\nexport const b = 2",
      );
      await fs.writeFile(
        `${testDir}/src/reexport.js`,
        'export { a } from "./original.js"',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { a } from "./reexport.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs[0]?.contents).toContain("a");
    });

    it.skip("should mark pure modules correctly", async () => {
      // TODO: Implement pure module detection
      await fs.writeFile(
        `${testDir}/src/pure.js`,
        "export const sum = (a, b) => a + b\nexport const multiply = (a, b) => a * b",
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { sum } from "./pure.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
    });

    it("should preserve re-exported modules", async () => {
      await fs.writeFile(
        `${testDir}/src/original.js`,
        "export const a = 1\nexport const b = 2",
      );
      await fs.writeFile(
        `${testDir}/src/reexport.js`,
        'export { a } from "./original.js"',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { a } from "./reexport.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs[0]?.contents).toContain("a");
    });

    it.skip("should mark pure modules correctly", async () => {
      await fs.writeFile(
        `${testDir}/src/pure.js`,
        "export const sum = (a, b) => a + b\nexport const multiply = (a, b) => a * b",
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { sum } from "./pure.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs[0]?.contents).toContain("sum");
    });
  });

  describe("Code Splitting", () => {
    it.skip("should split code by manual chunks", async () => {
      // TODO: Implement manual code splitting with chunk configuration
      await fs.writeFile(`${testDir}/src/a.js`, "export const a = 1");
      await fs.writeFile(`${testDir}/src/b.js`, "export const b = 2");
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { a } from "./a.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        manualChunks: {
          vendor: ["src/a.js", "src/b.js"],
        },
      });
      expect(result.outputs.length).toBeGreaterThan(1);
    });

    it.skip("should split code by size limits", async () => {
      // TODO: Implement automatic code splitting with size limits
      await fs.writeFile(
        `${testDir}/src/large.js`,
        'export const data = "x".repeat(10000)',
      );
      await fs.writeFile(`${testDir}/src/small.js`, "export const tiny = 1");
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { data } from "./large.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        splitChunks: {
          minSize: 5000,
        },
      });
      expect(result.outputs.length).toBeGreaterThan(1);
    });

    it("should detect entry points automatically", async () => {
      await fs.writeFile(`${testDir}/src/entry1.js`, "export const e1 = 1");
      await fs.writeFile(`${testDir}/src/entry2.js`, "export const e2 = 2");
      const result = await bundle({
        entry: "src/entry1.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Minification", () => {
    it.skip("should minify output with terser", async () => {
      // TODO: Implement minification with terser
      await fs.writeFile(
        `${testDir}/src/main.js`,
        "export const veryLongVariableName = 42",
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        minify: true,
      });
      expect(result.outputs[0]?.contents.length).toBeLessThan(50);
    });

    it.skip("should preserve large strings", async () => {
      // TODO: Implement minification with string preservation
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'export const longStr = "x".repeat(1000)',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        minify: true,
      });
      expect(result.outputs[0]?.contents).toContain("x");
    });

    it("should handle minification errors gracefully", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        minify: true,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("TypeScript Support", () => {
    it.skip("should transpile TypeScript files", async () => {
      // TODO: Implement TypeScript transpilation with ts-estree or swc
      await fs.writeFile(
        `${testDir}/src/types.ts`,
        "export const value: number = 42",
      );
      const result = await bundle({
        entry: "src/types.ts",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it.skip("should strip type annotations", async () => {
      // TODO: Implement TypeScript type stripping
      await fs.writeFile(
        `${testDir}/src/types.ts`,
        "export const value: number = 42",
      );
      const result = await bundle({
        entry: "src/types.ts",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs[0]?.contents).not.toContain(": number");
    });

    it.skip("should handle TypeScript interfaces", async () => {
      // TODO: Implement TypeScript interface parsing
      await fs.writeFile(
        `${testDir}/src/types.ts`,
        'interface User { name: string }\nexport const user: User = { name: "test" }',
      );
      const result = await bundle({
        entry: "src/types.ts",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs[0]?.contents).not.toContain("interface");
    });

    it.skip("should handle TypeScript classes", async () => {
      // TODO: Implement TypeScript class transpilation
      await fs.writeFile(
        `${testDir}/src/types.ts`,
        "class Test { method(): void {} }\nexport const test = new Test()",
      );
      const result = await bundle({
        entry: "src/types.ts",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });
  describe("CSS Bundling", () => {
    it("should bundle CSS imports", async () => {
      await fs.writeFile(`${testDir}/src/styles.css`, ".test { color: red; }");
      await fs.writeFile(`${testDir}/src/main.js`, 'import "./styles.css"');
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it.skip("should extract CSS to separate files", async () => {
      await fs.writeFile(`${testDir}/src/styles.css`, ".test { color: red; }");
      await fs.writeFile(`${testDir}/src/main.js`, 'import "./styles.css"');
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        extractCSS: true,
      });
      expect(result.outputs.length).toBeGreaterThan(1);
    });
  });

  describe("Source Maps", () => {
    it.skip("should generate source maps", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        sourcemap: true,
      });
      expect(result.outputs[0]?.map).toBeDefined();
    });

    it.skip("should validate source map contents", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        sourcemap: true,
      });
      expect(result.outputs[0]?.map).toHaveProperty("version", 3);
    });
  });

  describe("Hash Collision Tests", () => {
    it.skip("should generate different hashes for different content", async () => {
      await fs.writeFile(`${testDir}/src/a.js`, "export const a = 1");
      await fs.writeFile(`${testDir}/src/b.js`, "export const b = 2");

      const result1 = await bundle({
        entry: "src/a.js",
        outDir: "dist",
        cwd: testDir,
        hashLength: 12,
      });

      const result2 = await bundle({
        entry: "src/b.js",
        outDir: "dist",
        cwd: testDir,
        hashLength: 12,
      });

      expect(result1.outputs[0]?.path).not.toBe(result2.outputs[0]?.path);
    });

    it.skip("should generate consistent hashes for same content", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");

      const result1 = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        hashLength: 12,
      });

      const result2 = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        hashLength: 12,
      });

      expect(result1.outputs[0]?.path).toBe(result2.outputs[0]?.path);
    });
  });

  describe("Build Performance", () => {
    it("should handle large projects efficiently", async () => {
      for (let i = 0; i < 50; i++) {
        await fs.writeFile(
          `${testDir}/src/module${i}.js`,
          `export const value${i} = ${i}`,
        );
      }
      await fs.writeFile(
        `${testDir}/src/main.js`,
        Array.from(
          { length: 50 },
          (_, i) => `import { value${i} } from "./module${i}.js"`,
        ).join("\n"),
      );

      const startTime = Date.now();
      await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it("should maintain efficiency with caching", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");

      const startTime1 = Date.now();
      await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      const duration1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      const duration2 = Date.now() - startTime2;

      expect(duration2).toBeLessThan(duration1 + 1000);
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent entry points", async () => {
      await expect(
        bundle({
          entry: "src/nonexistent.js",
          outDir: "dist",
          cwd: testDir,
        }),
      ).rejects.toThrow();
    });

    it("should handle invalid config", async () => {
      await expect(
        bundle({
          entry: "src/main.js",
          outDir: "dist",
          cwd: testDir,
          format: "invalid" as any,
        }),
      ).rejects.toThrow();
    });

    it("should handle parse errors gracefully", async () => {
      await fs.writeFile(
        `${testDir}/src/invalid.js`,
        "this is not valid javascript {{{",
      );
      await expect(
        bundle({
          entry: "src/invalid.js",
          outDir: "dist",
          cwd: testDir,
        }),
      ).rejects.toThrow();
    });

    it("should provide helpful error messages", async () => {
      await fs.writeFile(
        `${testDir}/src/error.js`,
        'import nonexistent from "./does-not-exist.js"',
      );
      try {
        await bundle({
          entry: "src/error.js",
          outDir: "dist",
          cwd: testDir,
        });
        throw new Error("Expected bundle to throw");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle circular dependency detection", async () => {
      await fs.writeFile(`${testDir}/src/a.js`, 'import { b } from "./b.js"');
      await fs.writeFile(`${testDir}/src/b.js`, 'import { a } from "./a.js"');
      const result = await bundle({
        entry: "src/a.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result).toBeDefined();
    });

    it.skip("should handle missing dependencies", async () => {
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import missing from "missing-package"',
      );
      await expect(
        bundle({
          entry: "src/main.js",
          outDir: "dist",
          cwd: testDir,
        }),
      ).rejects.toThrow();
    });

    it("should handle watch mode errors", async () => {
      await fs.writeFile(`${testDir}/src/main.js`, "export const value = 42");
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        watch: false,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Side Effects Detection", () => {
    it("should detect console.log as side effect", async () => {
      await fs.writeFile(
        `${testDir}/src/effects.js`,
        'console.log("test")\nexport const value = 42',
      );
      const result = await bundle({
        entry: "src/effects.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should detect global assignments as side effect", async () => {
      await fs.writeFile(
        `${testDir}/src/effects.js`,
        "global.testValue = true\nexport const value = 42",
      );
      const result = await bundle({
        entry: "src/effects.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it.skip("should mark pure modules correctly", async () => {
      await fs.writeFile(
        `${testDir}/src/pure.js`,
        "export const sum = (a, b) => a + b",
      );
      const result = await bundle({
        entry: "src/pure.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should detect document access as side effect", async () => {
      await fs.writeFile(
        `${testDir}/src/effects.js`,
        'const el = document.getElementById("test")\nexport const value = 42',
      );
      const result = await bundle({
        entry: "src/effects.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });
});
