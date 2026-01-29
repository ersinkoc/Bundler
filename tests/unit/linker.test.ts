import { describe, it, expect } from "vitest";
import { BundleLinker } from "../../src/core/linker.js";
import { DependencyGraph } from "../../src/core/graph.js";

describe("BundleLinker", () => {
  describe("constructor", () => {
    it("should create linker with default options", () => {
      const linker = new BundleLinker({ format: "esm" });
      expect(linker).toBeDefined();
    });

    it("should create linker with all options", () => {
      const linker = new BundleLinker({
        format: "iife",
        globalName: "MyApp",
        treeshake: true,
        manualChunks: { vendor: ["lodash"] },
      });
      expect(linker).toBeDefined();
    });
  });

  describe("link - ESM format", () => {
    it("should link simple module", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "named", name: "foo" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const foo = 1",
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it("should link module with default export", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default function() { return 42; }",
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should link multiple modules", () => {
      const graph = new DependencyGraph();
      graph.addModule("utils.js", {
        imports: [],
        exports: [{ type: "named", name: "add" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const add = (a, b) => a + b",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "utils.js",
            specifiers: [{ type: "named", imported: "add", local: "add" }],
          },
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { add } from "./utils.js"\nexport const result = add(1, 2)',
      });
      graph.addDependency("entry.js", "utils.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("link - CJS format", () => {
    it("should link simple module to CJS", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "named", name: "foo" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const foo = 1",
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"]).toBeDefined();
    });

    it("should transform default export to CJS", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default 42",
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"].contents).toBeDefined();
    });
  });

  describe("link - IIFE format", () => {
    it("should wrap output in IIFE", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "named", name: "foo" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const foo = 1",
      });

      const linker = new BundleLinker({ format: "iife", globalName: "MyLib" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"].contents).toContain("var MyLib");
      expect(result["main.js"].contents).toContain("function");
    });

    it("should use default globalName", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "const x = 1",
      });

      const linker = new BundleLinker({ format: "iife" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"].contents).toContain("var App");
    });
  });

  describe("manual chunks", () => {
    it("should create manual chunks", () => {
      const graph = new DependencyGraph();
      graph.addModule("vendor.js", {
        imports: [],
        exports: [{ type: "named", name: "util" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const util = () => {}",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "vendor.js",
            specifiers: [{ type: "named", imported: "util", local: "util" }],
          },
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { util } from "./vendor.js"',
      });
      graph.addDependency("entry.js", "vendor.js");

      const linker = new BundleLinker({
        format: "esm",
        manualChunks: {
          vendor: ["vendor.js"],
        },
      });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(Object.keys(result)).toContain("vendor.js");
      expect(Object.keys(result)).toContain("main.js");
    });
  });

  describe("tree shaking", () => {
    it("should collect used exports", () => {
      const graph = new DependencyGraph();
      graph.addModule("utils.js", {
        imports: [],
        exports: [
          { type: "named", name: "usedFunc" },
          { type: "named", name: "unusedFunc" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const usedFunc = () => {}\nexport const unusedFunc = () => {}",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "utils.js",
            specifiers: [
              { type: "named", imported: "usedFunc", local: "usedFunc" },
            ],
          },
        ],
        exports: [{ type: "named", name: "main" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { usedFunc } from "./utils.js"\nexport const main = usedFunc',
      });
      graph.addDependency("entry.js", "utils.js");

      const linker = new BundleLinker({ format: "esm", treeshake: true });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("output format", () => {
    it("should include path in output", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "const x = 1",
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"].path).toBe("main.js");
    });

    it("should include size in output", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "const x = 1",
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"].size).toBeGreaterThan(0);
    });

    it("should include format in output", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "",
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"].format).toBe("cjs");
    });
  });

  describe("import handling", () => {
    it("should handle default imports", () => {
      const graph = new DependencyGraph();
      graph.addModule("mod.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default 42",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "mod.js",
            specifiers: [{ type: "default", local: "value" }],
          },
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import value from "./mod.js"\nexport const result = value',
      });
      graph.addDependency("entry.js", "mod.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle namespace imports", () => {
      const graph = new DependencyGraph();
      graph.addModule("mod.js", {
        imports: [],
        exports: [
          { type: "named", name: "a" },
          { type: "named", name: "b" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const a = 1\nexport const b = 2",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "mod.js",
            specifiers: [{ type: "namespace", local: "ns" }],
          },
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import * as ns from "./mod.js"\nexport const result = ns.a + ns.b',
      });
      graph.addDependency("entry.js", "mod.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle renamed imports", () => {
      const graph = new DependencyGraph();
      graph.addModule("mod.js", {
        imports: [],
        exports: [{ type: "named", name: "original" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const original = 42",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "mod.js",
            specifiers: [
              { type: "named", imported: "original", local: "renamed" },
            ],
          },
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { original as renamed } from "./mod.js"\nexport const result = renamed',
      });
      graph.addDependency("entry.js", "mod.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("export handling", () => {
    it("should handle re-exports", () => {
      const graph = new DependencyGraph();
      graph.addModule("source.js", {
        imports: [],
        exports: [{ type: "named", name: "value" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const value = 1",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "source.js",
            specifiers: [{ type: "named", imported: "value", local: "value" }],
          },
        ],
        exports: [{ type: "named", name: "value", source: "source.js" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'export { value } from "./source.js"',
      });
      graph.addDependency("entry.js", "source.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle export all", () => {
      const graph = new DependencyGraph();
      graph.addModule("source.js", {
        imports: [],
        exports: [{ type: "named", name: "a" }, { type: "named", name: "b" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const a = 1\nexport const b = 2",
      });
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "all", source: "source.js" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'export * from "./source.js"',
      });
      graph.addDependency("entry.js", "source.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("external imports", () => {
    it("should preserve external imports in ESM", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          {
            source: "lodash",
            specifiers: [{ type: "named", imported: "map", local: "map" }],
          },
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { map } from "lodash"\nexport const result = map([1,2], x => x * 2)',
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"].contents).toContain("lodash");
    });

    it("should preserve external imports in CJS", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          {
            source: "lodash",
            specifiers: [{ type: "default", local: "_" }],
          },
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import _ from "lodash"\nconst x = _.map([1,2], n => n * 2)',
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"].contents).toContain("lodash");
    });
  });

  describe("IIFE format variations", () => {
    it("should handle IIFE with only default export", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default 42",
      });

      const linker = new BundleLinker({ format: "iife", globalName: "MyLib" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"].contents).toContain("MyLib");
    });

    it("should handle IIFE with both default and named exports", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [
          { type: "default" },
          { type: "named", name: "foo" },
          { type: "named", name: "bar" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default 42\nexport const foo = 1\nexport const bar = 2",
      });

      const linker = new BundleLinker({ format: "iife", globalName: "MyLib" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle IIFE with only named exports", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [
          { type: "named", name: "a" },
          { type: "named", name: "b" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const a = 1\nexport const b = 2",
      });

      const linker = new BundleLinker({ format: "iife", globalName: "MyLib" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle IIFE with no exports", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: true,
        isPure: false,
        code: "console.log('side effect')",
      });

      const linker = new BundleLinker({ format: "iife", globalName: "MyLib" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("CJS format variations", () => {
    it("should handle CJS with default export", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default { version: '1.0' }",
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"].contents).toBeDefined();
    });

    it("should handle CJS with multiple named exports", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [
          { type: "named", name: "add" },
          { type: "named", name: "subtract" },
          { type: "named", name: "multiply" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const add = (a, b) => a + b\nexport const subtract = (a, b) => a - b\nexport const multiply = (a, b) => a * b",
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("manual chunks with different formats", () => {
    it("should handle manual chunks with IIFE format", () => {
      const graph = new DependencyGraph();
      graph.addModule("vendor.js", {
        imports: [],
        exports: [{ type: "named", name: "util" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const util = () => {}",
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "vendor.js", specifiers: [{ type: "named", imported: "util", local: "util" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { util } from "./vendor.js"',
      });
      graph.addDependency("entry.js", "vendor.js");

      const linker = new BundleLinker({
        format: "iife",
        globalName: "MyApp",
        manualChunks: { vendor: ["vendor.js"] },
      });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(Object.keys(result)).toContain("vendor.js");
    });

    it("should handle manual chunks with CJS format", () => {
      const graph = new DependencyGraph();
      graph.addModule("vendor.js", {
        imports: [],
        exports: [{ type: "named", name: "util" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const util = () => {}",
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "vendor.js", specifiers: [{ type: "named", imported: "util", local: "util" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { util } from "./vendor.js"',
      });
      graph.addDependency("entry.js", "vendor.js");

      const linker = new BundleLinker({
        format: "cjs",
        manualChunks: { vendor: ["vendor.js"] },
      });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(Object.keys(result)).toContain("vendor.js");
    });
  });

  describe("import statement generation", () => {
    it("should generate side-effect only import", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "polyfill", specifiers: [] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import "polyfill"',
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"].contents).toContain("polyfill");
    });

    it("should generate namespace import in CJS", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "lodash", specifiers: [{ type: "namespace", local: "_" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import * as _ from "lodash"',
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"].contents).toContain("lodash");
    });

    it("should generate import with renamed specifier", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "lodash", specifiers: [{ type: "named", imported: "map", local: "lodashMap" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { map as lodashMap } from "lodash"',
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"].contents).toContain("lodash");
    });
  });

  describe("CJS import generation", () => {
    it("should generate CJS import with no specifiers", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "polyfill", specifiers: [] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import "polyfill"',
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"]).toBeDefined();
    });

    it("should generate CJS import with renamed specifiers", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "lodash", specifiers: [{ type: "named", imported: "map", local: "lodashMap" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { map as lodashMap } from "lodash"',
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"].contents).toContain("lodash");
    });
  });

  describe("export all handling", () => {
    it("should handle export all in CJS format", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [{ type: "all", source: "./utils" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'export * from "./utils"',
      });

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("IIFE external imports", () => {
    it("should handle external default import in IIFE", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "lodash", specifiers: [{ type: "default", local: "_" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import _ from "lodash"',
      });

      const linker = new BundleLinker({ format: "iife", globalName: "App" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle external named import in IIFE", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "lodash", specifiers: [{ type: "named", imported: "map", local: "map" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { map } from "lodash"',
      });

      const linker = new BundleLinker({ format: "iife", globalName: "App" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle external namespace import in IIFE", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          { source: "lodash", specifiers: [{ type: "namespace", local: "_" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import * as _ from "lodash"',
      });

      const linker = new BundleLinker({ format: "iife", globalName: "App" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("non-entry module handling", () => {
    it("should handle non-entry module with default export in IIFE", () => {
      const graph = new DependencyGraph();
      graph.addModule("helper.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default 42",
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "helper.js", specifiers: [{ type: "default", local: "val" }] }
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import val from "./helper.js"\nexport const result = val',
      });
      graph.addDependency("entry.js", "helper.js");

      const linker = new BundleLinker({ format: "iife", globalName: "App" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty module", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "",
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle module with only side effects", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: true,
        isPure: false,
        code: "console.log('side effect')",
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"].contents).toContain("console.log");
    });

    it("should handle missing module in graph", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [
          {
            source: "missing.js",
            specifiers: [{ type: "named", imported: "x", local: "x" }],
          },
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { x } from "./missing.js"',
      });

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle deep dependency chain", () => {
      const graph = new DependencyGraph();
      graph.addModule("a.js", {
        imports: [],
        exports: [{ type: "named", name: "a" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const a = 1",
      });
      graph.addModule("b.js", {
        imports: [
          { source: "a.js", specifiers: [{ type: "named", imported: "a", local: "a" }] }
        ],
        exports: [{ type: "named", name: "b" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { a } from "./a.js"\nexport const b = a + 1',
      });
      graph.addModule("c.js", {
        imports: [
          { source: "b.js", specifiers: [{ type: "named", imported: "b", local: "b" }] }
        ],
        exports: [{ type: "named", name: "c" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { b } from "./b.js"\nexport const c = b + 1',
      });
      graph.addDependency("c.js", "b.js");
      graph.addDependency("b.js", "a.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["c.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle namespace import in bundled modules", () => {
      const graph = new DependencyGraph();
      graph.addModule("utils.js", {
        imports: [],
        exports: [
          { type: "named", name: "add" },
          { type: "named", name: "sub" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const add = (a, b) => a + b;\nexport const sub = (a, b) => a - b;",
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "utils.js", specifiers: [{ type: "namespace", local: "utils" }] }
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import * as utils from "./utils.js"\nexport const result = utils.add(1, 2)',
      });
      graph.addDependency("entry.js", "utils.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle default import in bundled modules for IIFE", () => {
      const graph = new DependencyGraph();
      graph.addModule("lib.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default { version: '1.0' }",
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "lib.js", specifiers: [{ type: "default", local: "lib" }] }
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import lib from "./lib.js"\nexport const result = lib.version',
      });
      graph.addDependency("entry.js", "lib.js");

      const linker = new BundleLinker({ format: "iife", globalName: "MyApp" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle default import in bundled modules for CJS", () => {
      const graph = new DependencyGraph();
      graph.addModule("lib.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default { version: '1.0' }",
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "lib.js", specifiers: [{ type: "default", local: "lib" }] }
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import lib from "./lib.js"\nexport const result = lib.version',
      });
      graph.addDependency("entry.js", "lib.js");

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle mixed named and default imports in bundled modules", () => {
      const graph = new DependencyGraph();
      graph.addModule("lib.js", {
        imports: [],
        exports: [
          { type: "default" },
          { type: "named", name: "helper" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default 42;\nexport const helper = () => 'help';",
      });
      graph.addModule("entry.js", {
        imports: [
          {
            source: "lib.js",
            specifiers: [
              { type: "default", local: "val" },
              { type: "named", imported: "helper", local: "helper" }
            ]
          }
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import val, { helper } from "./lib.js"\nexport const result = val + helper()',
      });
      graph.addDependency("entry.js", "lib.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle non-entry module with imports in IIFE format", () => {
      const graph = new DependencyGraph();
      graph.addModule("lib.js", {
        imports: [],
        exports: [{ type: "named", name: "value" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const value = 42;",
      });
      graph.addModule("middle.js", {
        imports: [
          { source: "lib.js", specifiers: [{ type: "named", imported: "value", local: "value" }] }
        ],
        exports: [{ type: "named", name: "result" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { value } from "./lib.js";\nexport const result = value * 2;',
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "middle.js", specifiers: [{ type: "named", imported: "result", local: "result" }] }
        ],
        exports: [{ type: "named", name: "output" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { result } from "./middle.js";\nexport const output = result;',
      });
      graph.addDependency("entry.js", "middle.js");
      graph.addDependency("middle.js", "lib.js");

      const linker = new BundleLinker({ format: "iife", globalName: "MyApp" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle non-entry module with imports in CJS format", () => {
      const graph = new DependencyGraph();
      graph.addModule("lib.js", {
        imports: [],
        exports: [{ type: "default" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export default 42;",
      });
      graph.addModule("middle.js", {
        imports: [
          { source: "lib.js", specifiers: [{ type: "default", local: "val" }] }
        ],
        exports: [{ type: "named", name: "doubled" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import val from "./lib.js";\nexport const doubled = val * 2;',
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "middle.js", specifiers: [{ type: "named", imported: "doubled", local: "doubled" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { doubled } from "./middle.js";\nconsole.log(doubled);',
      });
      graph.addDependency("entry.js", "middle.js");
      graph.addDependency("middle.js", "lib.js");

      const linker = new BundleLinker({ format: "cjs" });
      const result = linker.link(graph, ["entry.js"], "cjs");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle namespace import in non-entry module", () => {
      const graph = new DependencyGraph();
      graph.addModule("utils.js", {
        imports: [],
        exports: [
          { type: "named", name: "add" },
          { type: "named", name: "multiply" },
        ],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "export const add = (a, b) => a + b;\nexport const multiply = (a, b) => a * b;",
      });
      graph.addModule("calculator.js", {
        imports: [
          { source: "utils.js", specifiers: [{ type: "namespace", local: "math" }] }
        ],
        exports: [{ type: "named", name: "calculate" }],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import * as math from "./utils.js";\nexport const calculate = (a, b) => math.add(a, math.multiply(a, b));',
      });
      graph.addModule("entry.js", {
        imports: [
          { source: "calculator.js", specifiers: [{ type: "named", imported: "calculate", local: "calc" }] }
        ],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: 'import { calculate as calc } from "./calculator.js";\nconsole.log(calc(2, 3));',
      });
      graph.addDependency("entry.js", "calculator.js");
      graph.addDependency("calculator.js", "utils.js");

      const linker = new BundleLinker({ format: "esm" });
      const result = linker.link(graph, ["entry.js"], "esm");

      expect(result["main.js"]).toBeDefined();
    });

    it("should handle IIFE format with no exports", () => {
      const graph = new DependencyGraph();
      graph.addModule("entry.js", {
        imports: [],
        exports: [],
        dynamicImports: [],
        hasSideEffects: false,
        isPure: true,
        code: "console.log('hello world');",
      });

      const linker = new BundleLinker({ format: "iife", globalName: "App" });
      const result = linker.link(graph, ["entry.js"], "iife");

      expect(result["main.js"]).toBeDefined();
      expect(result["main.js"].contents).toContain("return {}");
    });
  });
});
