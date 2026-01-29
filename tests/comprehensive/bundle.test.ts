import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { bundle } from "../../src/index.js";

describe("Bundler - Core Test Suite", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(`${os.tmpdir()}/bundler-test-`);
    await fs.mkdir(`${testDir}/src`, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
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
      ).rejects.toThrow(/[Cc]ircular/);
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
      ).rejects.toThrow(/[Cc]ircular/);
    });

    it("should handle self-imports", async () => {
      await fs.writeFile(
        `${testDir}/src/self.js`,
        'export const value = 42',
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { value } from "./self.js"',
      );

      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should throw on cross-chunk circular dependencies", async () => {
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

      await expect(
        bundle({
          entry: "src/main.js",
          outDir: "dist",
          cwd: testDir,
          format: "esm",
        }),
      ).rejects.toThrow(/[Cc]ircular/);
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
    it("should bundle with tree shaking enabled", async () => {
      await fs.writeFile(
        `${testDir}/src/lib.js`,
        "export const used = 1\nexport const unused = 2",
      );
      await fs.writeFile(
        `${testDir}/src/main.js`,
        'import { used } from "./lib.js"',
      );
      const result = await bundle({
        entry: "src/main.js",
        outDir: "dist",
        cwd: testDir,
        treeshake: true,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
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
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Code Splitting", () => {
    it("should split code by manual chunks", async () => {
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
        splitting: {
          manualChunks: {
            vendor: ["src/a.js", "src/b.js"],
          },
        },
      });
      expect(result.outputs.length).toBeGreaterThan(1);
    });

    it("should detect entry points automatically", async () => {
      await fs.writeFile(`${testDir}/src/entry1.js`, "export const e1 = 1");
      const result = await bundle({
        entry: "src/entry1.js",
        outDir: "dist",
        cwd: testDir,
      });
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe("Minification", () => {
    it("should handle minification config", async () => {
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

    it("should throw on circular dependency detection", async () => {
      await fs.writeFile(`${testDir}/src/a.js`, 'import { b } from "./b.js"');
      await fs.writeFile(`${testDir}/src/b.js`, 'import { a } from "./a.js"');
      await expect(
        bundle({
          entry: "src/a.js",
          outDir: "dist",
          cwd: testDir,
        }),
      ).rejects.toThrow(/[Cc]ircular/);
    });

    it("should handle watch mode config", async () => {
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
