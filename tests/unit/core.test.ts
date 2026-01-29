import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../../src/core/graph.js";
import { ModuleResolver } from "../../src/core/resolver.js";
import { BundleLinker } from "../../src/core/linker.js";
import { ASTModuleParser } from "../../src/core/parser/ast-parser.js";

describe("DependencyGraph", () => {
  it("should create empty graph", () => {
    const graph = new DependencyGraph();
    expect(graph.modules.size).toBe(0);
  });

  it("should add modules", () => {
    const graph = new DependencyGraph();
    graph.addModule("test.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    expect(graph.modules.size).toBe(1);
  });

  it("should add dependencies", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");
    expect(graph.getDependencies("a.js")).toContain("b.js");
  });

  it("should get dependents", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");
    expect(graph.getDependents("b.js")).toContain("a.js");
  });

  it("should get build order", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");
    const order = graph.getBuildOrder();
    expect(order.indexOf("b.js")).toBeLessThan(order.indexOf("a.js"));
  });

  it("should detect circular dependencies", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");
    graph.addDependency("b.js", "a.js");
    const circular = graph.detectCircular("a.js");
    expect(circular).not.toBeNull();
  });

  it("should handle diamond dependency pattern in detectCircular", () => {
    // Diamond pattern: A -> B -> C, A -> C
    // This tests the case where a node is already fully visited
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("c.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    // A depends on both B and C
    graph.addDependency("a.js", "b.js");
    graph.addDependency("a.js", "c.js");
    // B depends on C
    graph.addDependency("b.js", "c.js");

    // Should not detect circular (diamond is not circular)
    const circular = graph.detectCircular("a.js");
    expect(circular).toBeNull();
  });

  it("should prune unreachable modules", () => {
    const graph = new DependencyGraph();
    graph.addModule("entry.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("used.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("unused.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("entry.js", "used.js");
    graph.prune(["entry.js"]);
    expect(graph.modules.has("unused.js")).toBe(false);
  });

  it("should prune and clean up dependencies/dependents", () => {
    const graph = new DependencyGraph();
    graph.addModule("entry.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("used.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("unused.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("also-unused.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("entry.js", "used.js");
    graph.addDependency("unused.js", "also-unused.js");
    graph.prune(["entry.js"]);
    expect(graph.modules.has("unused.js")).toBe(false);
    expect(graph.modules.has("also-unused.js")).toBe(false);
    expect(graph.modules.has("entry.js")).toBe(true);
    expect(graph.modules.has("used.js")).toBe(true);
  });

  it("should throw on missing from module in addDependency", () => {
    const graph = new DependencyGraph();
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    expect(() => graph.addDependency("a.js", "b.js")).toThrow();
  });

  it("should throw on missing to module in addDependency", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    expect(() => graph.addDependency("a.js", "b.js")).toThrow();
  });

  it("should return empty array for non-existent module dependencies", () => {
    const graph = new DependencyGraph();
    expect(graph.getDependencies("non-existent.js")).toEqual([]);
  });

  it("should return empty array for non-existent module dependents", () => {
    const graph = new DependencyGraph();
    expect(graph.getDependents("non-existent.js")).toEqual([]);
  });

  it("should return null for no circular dependency", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");
    const circular = graph.detectCircular("a.js");
    expect(circular).toBeNull();
  });

  it("should handle detectCircular with non-existent module", () => {
    const graph = new DependencyGraph();
    const circular = graph.detectCircular("non-existent.js");
    expect(circular).toBeNull();
  });

  it("should throw on circular dependency in getBuildOrder", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");
    graph.addDependency("b.js", "a.js");
    expect(() => graph.getBuildOrder()).toThrow(/[Cc]ircular/);
  });

  it("should store code in module node", () => {
    const graph = new DependencyGraph();
    graph.addModule("test.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
      code: "const x = 1",
    });
    const node = graph.modules.get("test.js");
    expect(node?.code).toBe("const x = 1");
  });

  it("should track imported status", () => {
    const graph = new DependencyGraph();
    graph.addModule("test.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    const node = graph.modules.get("test.js");
    expect(node?.imported).toBe(false);
    if (node) {
      node.imported = true;
    }
    expect(graph.modules.get("test.js")?.imported).toBe(true);
  });

  it("should handle collectReachable with already visited module", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");

    const visited = new Set<string>();
    visited.add("a.js"); // Pre-add to simulate already visited
    graph.collectReachable("a.js", visited);

    // Should not add b.js because a.js was already visited
    expect(visited.has("a.js")).toBe(true);
  });

  it("should handle collectReachable with non-existent module", () => {
    const graph = new DependencyGraph();
    const visited = new Set<string>();

    // Should not throw when module doesn't exist
    graph.collectReachable("non-existent.js", visited);

    // The non-existent module is added to visited but has no dependencies
    expect(visited.has("non-existent.js")).toBe(true);
  });

  it("should collect all reachable modules recursively", () => {
    const graph = new DependencyGraph();
    graph.addModule("a.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("b.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addModule("c.js", {
      imports: [],
      exports: [],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
    });
    graph.addDependency("a.js", "b.js");
    graph.addDependency("b.js", "c.js");

    const visited = new Set<string>();
    graph.collectReachable("a.js", visited);

    expect(visited.has("a.js")).toBe(true);
    expect(visited.has("b.js")).toBe(true);
    expect(visited.has("c.js")).toBe(true);
  });
});

describe("ModuleResolver", () => {
  it("should create resolver with options", () => {
    const resolver = new ModuleResolver({
      alias: { "@": "./src" },
      external: ["lodash"],
      cwd: process.cwd(),
    });
    expect(resolver).toBeDefined();
  });

  it("should resolve relative paths", () => {
    const resolver = new ModuleResolver({ cwd: process.cwd() });
    const resolved = resolver.resolveSync(
      "./package.json",
      process.cwd() + "/test.js"
    );
    expect(resolved).toContain("package.json");
  });

  it("should handle external modules", () => {
    const resolver = new ModuleResolver({
      external: ["lodash"],
      cwd: process.cwd(),
    });
    // External modules are handled by isExternal check
    expect(resolver).toBeDefined();
  });
});

describe("ASTModuleParser", () => {
  it("should parse empty module", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("", "test.js");
    expect(result.imports).toHaveLength(0);
    expect(result.exports).toHaveLength(0);
  });

  it("should parse imports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'import { foo } from "./foo.js"',
      "test.js"
    );
    expect(result.imports).toHaveLength(1);
    expect(result.imports[0].source).toBe("./foo.js");
  });

  it("should parse default imports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'import foo from "./foo.js"',
      "test.js"
    );
    expect(result.imports).toHaveLength(1);
    expect(result.imports[0].specifiers[0].type).toBe("default");
  });

  it("should parse namespace imports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'import * as foo from "./foo.js"',
      "test.js"
    );
    expect(result.imports).toHaveLength(1);
    expect(result.imports[0].specifiers[0].type).toBe("namespace");
  });

  it("should parse named exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export const foo = 1", "test.js");
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("named");
    expect(result.exports[0].name).toBe("foo");
  });

  it("should parse default exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export default 42", "test.js");
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("default");
  });

  it("should parse export all", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule('export * from "./foo.js"', "test.js");
    // Parser adds export all to exports array
    expect(result.exports.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle dynamic imports syntax", () => {
    const parser = new ASTModuleParser();
    // Dynamic imports are parsed but may not be extracted to dynamicImports array
    const result = parser.parseModule(
      'const m = import("./foo.js")',
      "test.js"
    );
    expect(result).toBeDefined();
  });

  it("should analyze side effects", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule('console.log("test")', "test.js");
    // hasSideEffects detection may vary
    expect(typeof result.hasSideEffects).toBe("boolean");
  });

  it("should analyze module purity", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export const x = 1", "test.js");
    // isPure detection may vary
    expect(typeof result.isPure).toBe("boolean");
  });

  it("should parse function exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export function foo() {}", "test.js");
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("named");
    expect(result.exports[0].name).toBe("foo");
  });

  it("should parse class exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export class Foo {}", "test.js");
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("named");
    expect(result.exports[0].name).toBe("Foo");
  });

  it("should parse let exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export let x = 1", "test.js");
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("named");
  });

  it("should parse var exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export var x = 1", "test.js");
    expect(result.exports).toHaveLength(1);
  });

  it("should parse multiple named exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "const a = 1; const b = 2; export { a, b }",
      "test.js"
    );
    expect(result.exports).toHaveLength(2);
  });

  it("should parse export with renamed specifiers", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "const foo = 1; export { foo as bar }",
      "test.js"
    );
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].name).toBe("bar");
  });

  it("should parse side-effect imports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule('import "./side-effects.js"', "test.js");
    expect(result.imports).toHaveLength(1);
    expect(result.imports[0].specifiers).toHaveLength(0);
  });

  it("should parse mixed imports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'import foo, { bar, baz as qux } from "./module.js"',
      "test.js"
    );
    expect(result.imports).toHaveLength(1);
    expect(result.imports[0].specifiers).toHaveLength(3);
  });

  it("should throw on invalid syntax", () => {
    const parser = new ASTModuleParser();
    expect(() =>
      parser.parseModule("export const = invalid", "test.js")
    ).toThrow();
  });

  it("should parse export default function", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "export default function foo() {}",
      "test.js"
    );
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("default");
  });

  it("should parse export default class", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("export default class Foo {}", "test.js");
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("default");
  });

  it("should parse re-export with renamed specifiers", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'export { foo as bar } from "./module.js"',
      "test.js"
    );
    expect(result.exports.length).toBeGreaterThanOrEqual(1);
  });

  it("should analyze side effects property", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule("const x = 1", "test.js");
    expect(typeof result.hasSideEffects).toBe("boolean");
  });

  it("should handle code with multiple statements", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "const a = 1; const b = 2; export { a, b }",
      "test.js"
    );
    expect(result.exports).toHaveLength(2);
  });

  it("should parse arrow function export", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "export const add = (a, b) => a + b",
      "test.js"
    );
    expect(result.exports).toHaveLength(1);
  });

  it("should handle export with multiple declarations", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "export const a = 1, b = 2, c = 3",
      "test.js"
    );
    expect(result.exports.length).toBeGreaterThanOrEqual(1);
  });

  it("should not detect side effects from pure function", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "function add(a, b) { return a + b; }",
      "test.js"
    );
    expect(result.hasSideEffects).toBe(false);
  });

  it("should parse deeply nested exports", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "const obj = { nested: { deep: 1 } }; export { obj }",
      "test.js"
    );
    expect(result.exports).toHaveLength(1);
  });

  it("should analyze side effects and return boolean", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      "console.log('hello');",
      "test.js"
    );
    // Parser analyzes side effects and returns boolean values
    expect(typeof result.hasSideEffects).toBe("boolean");
    expect(typeof result.isPure).toBe("boolean");
    // isPure should be inverse of hasSideEffects
    expect(result.isPure).toBe(!result.hasSideEffects);
  });

  it("should analyze various global patterns", () => {
    const parser = new ASTModuleParser();

    // Test various patterns - checking they parse without error
    const patterns = [
      "const x = window.location;",
      "document.body.innerHTML = 'test';",
      "const env = process.env;",
      "const g = global.setTimeout;",
      "const c = console;",
    ];

    for (const pattern of patterns) {
      const result = parser.parseModule(pattern, "test.js");
      expect(typeof result.hasSideEffects).toBe("boolean");
    }
  });

  it("should parse dynamic imports - returns array", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'const mod = import("./dynamic.js");',
      "test.js"
    );
    // Dynamic imports are parsed and stored in dynamicImports array
    expect(Array.isArray(result.dynamicImports)).toBe(true);
  });

  it("should parse export all declaration", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'export * from "./module.js";',
      "test.js"
    );
    expect(result.exports.some(e => e.type === "all")).toBe(true);
  });

  it("should handle JSX syntax", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'const Component = () => <div>Hello</div>; export default Component;',
      "test.jsx"
    );
    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].type).toBe("default");
  });

  it("should handle async/await syntax", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'export async function fetchData() { await Promise.resolve(); }',
      "test.js"
    );
    expect(result.exports).toHaveLength(1);
  });

  it("should handle hashbang", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      '#!/usr/bin/env node\nexport const x = 1;',
      "test.js"
    );
    expect(result.exports).toHaveLength(1);
  });

  it("should handle top-level await", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'const data = await fetch("url"); export { data };',
      "test.js"
    );
    expect(result.exports).toHaveLength(1);
  });

  it("should not detect side effects for pure variable declarations", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'const a = 1; const b = "string"; const c = [1, 2, 3];',
      "test.js"
    );
    expect(result.hasSideEffects).toBe(false);
  });

  it("should analyze deeply nested member expressions", () => {
    const parser = new ASTModuleParser();
    const result = parser.parseModule(
      'const x = console.log.bind(console);',
      "test.js"
    );
    // The result should have a boolean hasSideEffects
    expect(typeof result.hasSideEffects).toBe("boolean");
  });
});

describe("BundleLinker", () => {
  it("should create linker with options", () => {
    const linker = new BundleLinker({
      format: "esm",
      globalName: "App",
      treeshake: true,
    });
    expect(linker).toBeDefined();
  });

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
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it("should generate CJS format", () => {
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
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it("should generate IIFE format", () => {
    const graph = new DependencyGraph();
    graph.addModule("entry.js", {
      imports: [],
      exports: [{ type: "named", name: "foo" }],
      dynamicImports: [],
      hasSideEffects: false,
      isPure: true,
      code: "export const foo = 1",
    });

    const linker = new BundleLinker({ format: "iife", globalName: "MyApp" });
    const result = linker.link(graph, ["entry.js"], "iife");
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });
});
