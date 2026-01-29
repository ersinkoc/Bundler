import type {
  Chunk,
  OutputBundle,
  OutputFormat,
  Export,
  ModuleInfo,
} from "../types.js";
import { DependencyGraph } from ".";
import { pathUtils } from "../utils/path.js";

export interface LinkerOptions {
  format: OutputFormat;
  globalName?: string;
  treeshake?: boolean;
  manualChunks?: Record<string, string[]>;
}

export class BundleLinker {
  private options: LinkerOptions;
  private moduleIdToVarName: Map<string, string> = new Map();
  private varNameCounter: number = 0;
  private usedExports: Map<string, Set<string>> = new Map();

  constructor(options: LinkerOptions) {
    this.options = options;
    this.usedExports = new Map<string, Set<string>>();
  }

  link(
    graph: DependencyGraph,
    entryPoints: string[],
    format: "esm" | "cjs" | "iife",
  ): OutputBundle {
    this.moduleIdToVarName = new Map();
    this.varNameCounter = 0;
    this.usedExports = this.collectUsedExports(graph, entryPoints);

    const buildOrder = graph.getBuildOrder();
    return this.generateChunks(graph, entryPoints, buildOrder, format);
  }

  private generateChunks(
    graph: DependencyGraph,
    entryPoints: string[],
    buildOrder: string[],
    format: "esm" | "cjs" | "iife",
  ): OutputBundle {
    const chunks = new Map<string, any>();

    const modules = buildOrder.filter(
      (id) => entryPoints.includes(id) || this.isImported(id, graph),
    );

    if (this.options.manualChunks) {
      for (const [chunkName, moduleIds] of Object.entries(
        this.options.manualChunks,
      )) {
        const chunkModules = moduleIds.filter((id) => modules.includes(id));
        let code = "";

        for (const moduleId of chunkModules) {
          const module = graph.modules.get(moduleId);
          if (!module) continue;

          const isEntryModule = entryPoints.includes(moduleId);
          const moduleCode = this.transformModule(
            moduleId,
            module.info,
            graph,
            modules,
            [],
          );

          code += moduleCode + "\n";
        }

        code =
          this.injectModuleExports(code, new Map(), chunkModules, graph) +
          "\n" +
          code;

        if (this.options.format === "iife") {
          code = this.wrapInIIFE(code, this.options.globalName || "App", []);
        } else if (this.options.format === "cjs") {
          code = this.wrapInCJS(code, []);
        } else {
          code = code;
        }

        chunks.set(chunkName, {
          id: chunkName,
          code: code.trim(),
          fileName: `${chunkName}.js`,
          modules: new Map(),
          imports: [],
          exports: [],
          isEntry: chunkName === "main",
        });
      }

      // Add entry point chunk for imports
      chunks.set("main", {
        id: "main",
        code: "",
        fileName: "main.js",
        modules: new Map(),
        imports: Array.from(new Set()),
        exports: [],
        isEntry: true,
      });
    } else {
      const entryChunkCode = this.generateEntryChunk(
        graph,
        entryPoints,
        buildOrder,
        format,
      );
      chunks.set("main", entryChunkCode);
    }

    const outputBundle: OutputBundle = {};
    for (const [name, chunk] of chunks) {
      outputBundle[chunk.fileName] = {
        path: chunk.fileName,
        contents: chunk.code,
        size: chunk.code.length,
        format: this.options.format,
      };
    }

    return outputBundle;
  }

  private generateEntryChunk(
    graph: DependencyGraph,
    entryPoints: string[],
    buildOrder: string[],
    format: "esm" | "cjs" | "iife",
  ): any {
    const modules = buildOrder.filter(
      (id) => entryPoints.includes(id) || this.isImported(id, graph),
    );

    let code = "";
    const imports: string[] = [];
    const exports: Export[] = [];
    const externalImports = new Set<string>();

    for (const moduleId of modules) {
      const module = graph.modules.get(moduleId);
      if (!module) continue;

      const isEntryModule = entryPoints.includes(moduleId);

      for (const imp of module.info.imports) {
        const isExternal = !modules.some(
          (m) => m.endsWith(imp.source) || m.includes(imp.source),
        );
        if (
          isExternal &&
          !imp.source.startsWith(".") &&
          !imp.source.startsWith("/")
        ) {
          const importCode = this.generateImportStatement(
            imp.source,
            imp.specifiers,
          );
          code += importCode + "\n";
          externalImports.add(imp.source);
        }
      }

      const moduleCode = this.transformModule(
        moduleId,
        module.info,
        graph,
        modules,
        entryPoints,
      );

      code += moduleCode + "\n";
    }

    code =
      this.injectModuleExports(code, new Map(), modules, graph) + "\n" + code;

    if (format === "iife") {
      code = this.wrapInIIFE(code, this.options.globalName || "App", exports);
    } else if (format === "cjs") {
      code = this.wrapInCJS(code, exports);
    }

    return {
      id: "main",
      code: code.trim(),
      fileName: "main.js",
      modules: new Map(),
      imports: Array.from(externalImports),
      exports,
      isEntry: true,
    };
  }

  /**
   * Collect used exports for tree shaking
   */
  private collectUsedExports(
    graph: DependencyGraph,
    entryPoints: string[],
  ): Map<string, Set<string>> {
    const usedExports = new Map<string, Set<string>>();

    // Mark all exports from entry points as used
    for (const entryId of entryPoints) {
      const entryModule = graph.modules.get(entryId);
      if (entryModule) {
        for (const exp of entryModule.info.exports) {
          const moduleName = usedExports.get(entryId) || new Set();
          if (exp.type === "default") {
            moduleName.add("default");
          } else if (exp.type === "named" && exp.name) {
            moduleName.add(exp.name);
          }
          usedExports.set(entryId, moduleName);
        }
      }
    }

    // Trace used exports through the graph
    const visit = (moduleId: string) => {
      const module = graph.modules.get(moduleId);
      if (!module) return;

      const moduleUsed = usedExports.get(moduleId) || new Set();

      for (const dependentId of module.dependents) {
        const dependentModule = graph.modules.get(dependentId);
        if (!dependentModule) continue;

        // Find which exports from this module are used
        for (const imp of dependentModule.info.imports) {
          if (graph.modules.get(imp.source)?.id === moduleId) {
            for (const spec of imp.specifiers) {
              if (spec.type === "default") {
                moduleUsed.add("default");
              } else if (spec.type === "named") {
                const exportedName = spec.imported || spec.local;
                moduleUsed.add(exportedName);
              } else if (spec.type === "namespace") {
                // Namespace imports mark all exports as used
                for (const exp of module.info.exports) {
                  if (exp.type === "named" && exp.name) {
                    moduleUsed.add(exp.name);
                  }
                }
              }
            }
          }
        }
      }

      usedExports.set(moduleId, moduleUsed);

      // Recursively visit dependencies
      for (const depId of module.dependencies) {
        visit(depId);
      }
    };

    for (const entryId of entryPoints) {
      visit(entryId);
    }

    return usedExports;
  }
  private getModuleVarName(moduleId: string): string {
    if (this.moduleIdToVarName.has(moduleId)) {
      return this.moduleIdToVarName.get(moduleId)!;
    }
    const baseName = pathUtils
      .basename(moduleId)
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_]/g, "_");
    const varName = `__module_${baseName}_${this.varNameCounter++}`;
    this.moduleIdToVarName.set(moduleId, varName);
    return varName;
  }

  private generateChunk(
    graph: DependencyGraph,
    entryPoints: string[],
    buildOrder: string[],
  ): Chunk {
    const modules = buildOrder.filter(
      (id) => entryPoints.includes(id) || this.isImported(id, graph),
    );

    let code = "";
    const imports: string[] = [];
    const exports: Export[] = [];
    const externalImports: Set<string> = new Set();

    // Collect all external imports first
    for (const moduleId of modules) {
      const module = graph.modules.get(moduleId);
      if (!module) continue;

      for (const imp of module.info.imports) {
        // Check if this import is to an external module (not in our graph)
        const isExternal = !modules.some(
          (m) => m.endsWith(imp.source) || m.includes(imp.source),
        );
        if (
          isExternal &&
          !imp.source.startsWith(".") &&
          !imp.source.startsWith("/")
        ) {
          externalImports.add(imp.source);
        }
      }
    }

    // Generate bundled code with scope isolation
    const moduleExports = new Map<string, any>();
    for (const moduleId of modules) {
      const module = graph.modules.get(moduleId);
      if (!module) continue;

      const isEntryModule = entryPoints.includes(moduleId);

      // Filter module exports based on tree shaking
      const moduleUsedExports = this.usedExports.get(moduleId) || new Set();
      const filteredExports = module.info.exports.filter((exp) => {
        if (!this.options.treeshake) return true;
        if (exp.type === "default") return moduleUsedExports.has("default");
        if (exp.type === "named" && exp.name)
          return moduleUsedExports.has(exp.name);
        return true;
      });

      const moduleInfoWithCode = {
        ...module.info,
        code: module.code,
        exports: filteredExports,
      };
      const moduleCode = this.transformModule(
        moduleId,
        moduleInfoWithCode,
        graph,
        modules,
        entryPoints,
      );

      if (isEntryModule) {
        // For entry modules, append code directly (without wrapping)
        code += moduleCode + "\n";
      } else {
        // Wrap non-entry modules in IIFE for scope isolation
        const wrappedModule = this.wrapModuleForScope(
          moduleId,
          moduleCode,
          module.info.exports,
          this.options.format,
        );
        const moduleVarName = this.getModuleVarName(moduleId);

        code += `const ${moduleVarName} = ${wrappedModule}\n`;

        // Store module exports for use by other modules
        const exportsObj = this.getExportsObject(
          module.info.exports,
          moduleVarName,
          this.options.format,
        );
        moduleExports.set(moduleId, exportsObj);
      }

      // Collect exports from entry points
      if (entryPoints.includes(moduleId)) {
        exports.push(...module.info.exports);
      }
    }

    // Inject module exports for use by imports
    code =
      this.injectModuleExports(code, moduleExports, modules, graph) +
      "\n" +
      code;

    // Wrap based on format
    if (this.options.format === "iife") {
      code = this.wrapInIIFE(code, this.options.globalName || "App", exports);
    } else if (this.options.format === "cjs") {
      code = this.wrapInCJS(code, exports);
    } else if (this.options.format === "esm") {
      code = this.wrapInESM(code, exports);
    }

    return {
      id: "main",
      code: code.trim(),
      fileName: "main.js",
      modules: new Map<string, ModuleInfo>(),
      imports,
      exports,
      isEntry: true,
    };
  }

  private isImported(moduleId: string, graph: DependencyGraph): boolean {
    const module = graph.modules.get(moduleId);
    if (!module) return false;
    return module.imported || module.dependents.size > 0;
  }

  private transformModule(
    moduleId: string,
    moduleInfo: any,
    graph: DependencyGraph,
    bundledModules: string[],
    entryPoints: string[] = [],
  ): string {
    let code = "";

    if (this.options.format === "esm") {
      code = this.transformToESM(
        moduleId,
        moduleInfo,
        graph,
        bundledModules,
        entryPoints,
      );
    } else if (this.options.format === "cjs") {
      code = this.transformToCJS(
        moduleId,
        moduleInfo,
        graph,
        bundledModules,
        entryPoints,
      );
    } else if (this.options.format === "iife") {
      code = this.transformToIIFE(
        moduleId,
        moduleInfo,
        graph,
        bundledModules,
        entryPoints,
      );
    }

    return code;
  }

  /**
   * Strip import/export statements from module code
   */
  private stripModuleSyntax(
    code: string,
    preserveExports: boolean = false,
    moduleId: string = "",
  ): string {
    const lines = code.split("\n");
    const result: string[] = [];

    const moduleUsedExports = this.usedExports.get(moduleId) || new Set();

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip import statements
      if (trimmed.startsWith("import ") && trimmed.includes(" from ")) {
        continue;
      }
      // Skip side-effect imports
      if (trimmed.match(/^import\s+['"][^'"]+['"]$/)) {
        continue;
      }
      // For entry modules, preserve export statements as-is
      if (preserveExports) {
        result.push(line);
        continue;
      }
      // Skip export { ... } from statements
      if (trimmed.startsWith("export {") && trimmed.includes(" from ")) {
        continue;
      }
      // Skip export * from statements
      if (trimmed.startsWith("export * from ")) {
        continue;
      }
      // Skip export default statements
      if (trimmed.startsWith("export default")) {
        result.push(
          line.replace("export default ", "const __default_export__ = "),
        );
        continue;
      }

      // Handle export const/let/var/class/function declarations
      if (trimmed.startsWith("export ")) {
        const declMatch = trimmed.match(/^export\s+(.+)$/);
        if (declMatch && declMatch[1]) {
          result.push(declMatch[1]);
        }
        continue;
      }

      result.push(line);
    }

    return result.join("\n");
  }

  private transformToESM(
    moduleId: string,
    moduleInfo: any,
    graph: DependencyGraph,
    bundledModules: string[],
    entryPoints: string[] = [],
  ): string {
    const isEntry = entryPoints.includes(moduleId);
    let code = "";

    if (isEntry) {
      // For entry modules, preserve all imports and exports as-is
      code = moduleInfo.code || "";
    } else {
      // Only keep external imports
      for (const imp of moduleInfo.imports) {
        const isExternal = !bundledModules.some(
          (m) => m.endsWith(imp.source) || m.includes(imp.source),
        );
        if (
          isExternal &&
          !imp.source.startsWith(".") &&
          !imp.source.startsWith("/")
        ) {
          const importCode = this.generateImportStatement(
            imp.source,
            imp.specifiers,
          );
          code += importCode + "\n";
        }
      }

      // Transform bundled module imports to variable accesses
      const transformedCode = this.transformBundledImports(
        moduleInfo,
        graph,
        bundledModules,
      );

      // Strip module syntax
      code += this.stripModuleSyntax(transformedCode, false, moduleId);
    }

    return code;
  }

  private transformBundledImports(
    moduleInfo: any,
    graph: DependencyGraph,
    bundledModules: string[],
  ): string {
    let code = moduleInfo.code || "";

    for (const imp of moduleInfo.imports) {
      const isBundled = bundledModules.some(
        (m) => m.endsWith(imp.source) || m.includes(imp.source),
      );
      if (isBundled) {
        const depModule = graph.modules.get(imp.source);
        if (depModule) {
          for (const spec of imp.specifiers) {
            const importRegex = this.getImportRegex(spec);
            const replacement = this.getImportReplacement(spec, depModule);
            code = code.replace(importRegex, replacement);
          }
        }
      }
    }

    return code;
  }

  private getImportRegex(specifier: any): RegExp {
    if (specifier.type === "default") {
      return new RegExp(`\\b${specifier.local}\\b`, "g");
    } else if (specifier.type === "named") {
      return new RegExp(`\\b${specifier.local}\\b`, "g");
    } else if (specifier.type === "namespace") {
      return new RegExp(`\\b${specifier.local}\\b`, "g");
    }
    return /\b\w+\b/g;
  }

  private getImportReplacement(specifier: any, depModule: any): string {
    const moduleName =
      depModule.id
        .split("/")
        .pop()
        ?.replace(/\.(ts|js|mjs|cjs)$/, "") || "module";
    if (specifier.type === "default") {
      return `__${moduleName}__default`;
    } else if (specifier.type === "named") {
      return `__${moduleName}__${specifier.imported || specifier.local}`;
    } else if (specifier.type === "namespace") {
      return `__${moduleName}__ns`;
    }
    return specifier.local;
  }

  private transformToCJS(
    moduleId: string,
    moduleInfo: any,
    graph: DependencyGraph,
    bundledModules: string[],
    entryPoints: string[] = [],
  ): string {
    const isEntry = entryPoints.includes(moduleId);
    let code = "";

    for (const imp of moduleInfo.imports) {
      const isExternal = !bundledModules.some(
        (m) => m.endsWith(imp.source) || m.includes(imp.source),
      );
      if (
        isExternal &&
        !imp.source.startsWith(".") &&
        !imp.source.startsWith("/")
      ) {
        code += this.generateCJSImport(imp.source, imp.specifiers) + "\n";
      }
    }

    if (isEntry) {
      // For entry modules, transform ESM exports to CJS format
      const moduleCode = moduleInfo.code || "";
      const lines = moduleCode.split("\n");
      const transformedLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        const exportConstMatch = trimmed.match(/^export\s+const\s+(\w+)\s*=/);
        if (exportConstMatch) {
          const varName = exportConstMatch[1];
          transformedLines.push(line.replace(/^export\s+/, ""));
          transformedLines.push("exports." + varName + " = " + varName + ";");
        } else if (trimmed.startsWith("export default ")) {
          transformedLines.push(
            line.replace("export default ", "const __default_export__ = "),
          );
          transformedLines.push("module.exports = __default_export__;");
          transformedLines.push("module.exports.default = __default_export__;");
        } else if (trimmed.startsWith("export ")) {
          transformedLines.push(line.replace(/^export\s+/, ""));
        } else {
          transformedLines.push(line);
        }
      }

      code += transformedLines.join("\n");
    } else {
      code += this.stripModuleSyntax(moduleInfo.code || "", false, moduleId);
      // Export statements at module level
      for (const exp of moduleInfo.exports) {
        if (exp.type === "default") {
          code += "\nmodule.exports.default = __default_export__";
        } else if (exp.type === "named") {
          const name = exp.name as string;
          code += "\nexports." + name + " = " + name;
        } else if (exp.type === "all") {
          code += "\nObject.assign(exports, require('" + exp.source + "'))";
        }
      }
    }

    return code;
  }

  private transformToIIFE(
    moduleId: string,
    moduleInfo: any,
    graph: DependencyGraph,
    bundledModules: string[],
    entryPoints: string[] = [],
  ): string {
    const isEntry = entryPoints.includes(moduleId);
    let code = "";

    for (const imp of moduleInfo.imports) {
      const isExternal = !bundledModules.some(
        (m) => m.endsWith(imp.source) || m.includes(imp.source),
      );
      if (
        isExternal &&
        !imp.source.startsWith(".") &&
        !imp.source.startsWith("/")
      ) {
        for (const spec of imp.specifiers) {
          if (spec.type === "default") {
            code += `const ${spec.local} = ${imp.source}\n`;
          } else if (spec.type === "named") {
            code += `const ${spec.local} = ${imp.source}.${spec.imported || spec.local}\n`;
          } else if (spec.type === "namespace") {
            code += `const ${spec.local} = ${imp.source}\n`;
          }
        }
      }
    }

    if (isEntry) {
      // For entry modules in IIFE format, preserve exports as-is
      code = moduleInfo.code || "";
    } else {
      code += this.stripModuleSyntax(moduleInfo.code || "", false, moduleId);

      let wrapperCode = "";

      if (this.options.globalName) {
        wrapperCode += `(function() {\n`;
      } else {
        wrapperCode += `(function() {\n`;
      }

      wrapperCode += code + "\n";

      if (moduleInfo.exports.length > 0) {
        for (const exp of moduleInfo.exports) {
          if (exp.type === "default") {
            wrapperCode += `  return __default_export__\n`;
          }
        }
      }

      wrapperCode += "})";

      if (this.options.globalName) {
        wrapperCode += `(${this.options.globalName})`;
      }

      return wrapperCode;
    }

    return code;
  }

  /**
   * Wrap CJS output with proper exports
   */
  private wrapInCJS(code: string, exports: Export[]): string {
    let exportCode = "";

    for (const exp of exports) {
      if (exp.type === "default") {
        exportCode += "\nmodule.exports = __default_export__;";
        exportCode += "\nmodule.exports.default = __default_export__;";
      } else if (exp.type === "named" && exp.name) {
        const name = exp.name as string;
        exportCode += "\nexports." + name + " = " + name + ";";
      }
    }

    return code + exportCode;
  }

  private wrapInESM(code: string, exports: Export[]): string {
    let exportCode = "";

    for (const exp of exports) {
      if (exp.type === "default") {
        exportCode += "\nexport default __default_export__;";
      } else if (exp.type === "named" && exp.name) {
        const name = exp.name as string;
        exportCode += "\nexport { " + name + " };";
      }
    }

    return code + exportCode;
  }

  private generateImportStatement(source: string, specifiers: any[]): string {
    if (specifiers.length === 0) {
      return `import '${source}'`;
    }

    const namedSpecifiers = specifiers.filter((s) => s.type === "named");
    const defaultSpec = specifiers.find((s) => s.type === "default");
    const namespaceSpec = specifiers.find((s) => s.type === "namespace");

    if (namespaceSpec) {
      return `import * as ${namespaceSpec.local} from '${source}'`;
    }

    const parts: string[] = [];

    if (defaultSpec) {
      parts.push(defaultSpec.local);
    }

    if (namedSpecifiers.length > 0) {
      const named = namedSpecifiers.map((s) =>
        s.imported ? `${s.imported} as ${s.local}` : s.local,
      );
      parts.push(`{ ${named.join(", ")} }`);
    }

    return `import ${parts.join(", ")} from '${source}'`;
  }

  private generateCJSImport(source: string, specifiers: any[]): string {
    const defaultSpec = specifiers.find((s) => s.type === "default");
    const namespaceSpec = specifiers.find((s) => s.type === "namespace");
    const namedSpecifiers = specifiers.filter((s) => s.type === "named");

    if (namespaceSpec) {
      return `const ${namespaceSpec.local} = require('${source}')`;
    }

    if (defaultSpec) {
      return `const { default: ${defaultSpec.local} } = require('${source}')`;
    }

    if (namedSpecifiers.length > 0) {
      const named = namedSpecifiers.map((s) =>
        s.imported ? `${s.imported}: ${s.local}` : s.local,
      );
      return `const { ${named.join(", ")} } = require('${source}')`;
    }

    return `require('${source}')`;
  }

  /**
   * Wrap IIFE output with proper global export
   */
  private wrapInIIFE(
    code: string,
    globalName: string,
    exports: Export[],
  ): string {
    const indentedCode = code
      .split("\n")
      .map((line) => "  " + line)
      .join("\n");

    // Build return object from exports
    const exportedNames: string[] = [];
    let hasDefault = false;

    for (const exp of exports) {
      if (exp.type === "default") {
        hasDefault = true;
      } else if (exp.type === "named" && exp.name) {
        exportedNames.push(exp.name);
      }
    }

    let returnStatement = "";
    if (hasDefault && exportedNames.length === 0) {
      returnStatement = "  return __default_export__;";
    } else if (hasDefault) {
      returnStatement = `  return { default: __default_export__, ${exportedNames.join(", ")} };`;
    } else if (exportedNames.length > 0) {
      returnStatement = `  return { ${exportedNames.join(", ")} };`;
    } else {
      returnStatement = "  return {};";
    }

    return `var ${globalName} = (function() {
'use strict';
${indentedCode}
${returnStatement}
})();`;
  }

  private wrapModuleForScope(
    moduleId: string,
    code: string,
    exports: Export[],
    format: string,
  ): string {
    if (format === "iife") {
      return `(function() {\n'use strict';\n${code}\n  return this.exports;\n})()`;
    } else if (format === "cjs") {
      return `(function() {\n'use strict';\n${code}\n  return module.exports;\n})()`;
    } else {
      return `(function() {\n'use strict';\n${code}\n  return { default: this.default, ...this.namedExports };\n})()`;
    }
  }

  private getExportsObject(
    exports: Export[],
    moduleVarName: string,
    format: string,
  ): any {
    const result: any = {};

    if (format === "iife" || format === "cjs") {
      if (exports.find((e) => e.type === "default")) {
        result.default = `${moduleVarName}.default`;
      }
      for (const exp of exports) {
        if (exp.type === "named" && exp.name) {
          result[exp.name] = `${moduleVarName}.${exp.name}`;
        }
      }
    } else {
      for (const exp of exports) {
        if (exp.type === "default") {
          result.default = `${moduleVarName}.default`;
        } else if (exp.type === "named" && exp.name) {
          result[exp.name] = `${moduleVarName}.${exp.name}`;
        }
      }
    }

    return result;
  }

  private injectModuleExports(
    code: string,
    moduleExports: Map<string, any>,
    modules: string[],
    graph: DependencyGraph,
  ): string {
    let injected = "";

    for (const moduleId of modules) {
      const module = graph.modules.get(moduleId);
      if (!module) continue;

      const exports = moduleExports.get(moduleId);
      if (!exports) continue;

      const moduleVarName = this.getModuleVarName(moduleId);

      for (const imp of module.info.imports) {
        const isBundled = modules.some(
          (m) => m.endsWith(imp.source) || m.includes(imp.source),
        );
        if (isBundled) {
          const depExports = moduleExports.get(imp.source);
          if (depExports) {
            for (const spec of imp.specifiers) {
              if (spec.type === "default" && depExports.default) {
                injected += `const ${spec.local} = ${depExports.default};\n`;
              } else if (
                spec.type === "named" &&
                depExports[spec.imported || spec.local]
              ) {
                injected += `const ${spec.local} = ${depExports[spec.imported || spec.local]};\n`;
              } else if (spec.type === "namespace") {
                injected += `const ${spec.local} = { ${Object.entries(
                  depExports,
                )
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")} };\n`;
              }
            }
          }
        }
      }
    }

    return injected;
  }
}
