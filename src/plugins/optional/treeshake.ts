import type {
  Plugin,
  Kernel,
  ModuleNode,
  DependencyGraph as IDependencyGraph,
} from "../../types.js";
import type { DependencyGraph } from "../../core/graph.js";

export interface TreeshakeOptions {
  pureExternalModules?: boolean;
  propertyReadSideEffects?: boolean;
  tryCatchDeoptimization?: boolean;
}

export function treeshakePlugin(options?: TreeshakeOptions): Plugin {
  const pureExternal = options?.pureExternalModules ?? true;

  return {
    name: "treeshake",
    apply(kernel: Kernel) {
      const graph = kernel.context.graph as DependencyGraph;

      kernel.hooks.buildStart.tapAsync("treeshake", async () => {
        if (graph) {
          performTreeShaking(graph, pureExternal);
        }
      });
    },
  };
}

function performTreeShaking(
  graph: DependencyGraph,
  pureExternal: boolean,
): void {
  const usedExports = new Map<string, Set<string>>();
  const analyzedModules = new Set<string>();

  for (const [id, node] of graph.modules) {
    if (node.imported || node.dependents.size > 0) {
      markModuleExportsUsed(
        graph,
        id,
        usedExports,
        analyzedModules,
        pureExternal,
      );
    }
  }

  for (const [id, node] of graph.modules) {
    if (!analyzedModules.has(id)) {
      markModuleUsed(graph, id, usedExports, analyzedModules);
    }
  }

  pruneUnusedModules(graph, usedExports, analyzedModules);
}

function markModuleExportsUsed(
  graph: DependencyGraph,
  moduleId: string,
  usedExports: Map<string, Set<string>>,
  analyzedModules: Set<string>,
  pureExternal: boolean,
): void {
  if (analyzedModules.has(moduleId)) {
    return;
  }

  analyzedModules.add(moduleId);

  const module = graph.modules.get(moduleId);
  if (!module) {
    return;
  }

  const exportsUsed = new Set<string>();

  for (const dependentId of module.dependents) {
    const dependentModule = graph.modules.get(dependentId);
    if (!dependentModule) {
      continue;
    }

    for (const imp of dependentModule.info.imports) {
      if (graph.modules.get(imp.source)?.id === moduleId) {
        for (const spec of imp.specifiers) {
          if (spec.type === "default") {
            exportsUsed.add("default");
          } else if (spec.type === "named") {
            exportsUsed.add(spec.imported || spec.local);
          } else if (spec.type === "namespace") {
            for (const exp of module.info.exports) {
              if (exp.type === "named" && exp.name) {
                exportsUsed.add(exp.name);
              }
            }
          }
        }
      }
    }
  }

  if (module.imported) {
    for (const exp of module.info.exports) {
      if (exp.type === "default") {
        exportsUsed.add("default");
      } else if (exp.type === "named" && exp.name) {
        exportsUsed.add(exp.name);
      }
    }
  }

  usedExports.set(moduleId, exportsUsed);

  for (const depId of module.dependencies) {
    markModuleExportsUsed(
      graph,
      depId,
      usedExports,
      analyzedModules,
      pureExternal,
    );
  }
}

function markModuleUsed(
  graph: DependencyGraph,
  moduleId: string,
  usedExports: Map<string, Set<string>>,
  analyzedModules: Set<string>,
): void {
  if (analyzedModules.has(moduleId)) {
    return;
  }

  analyzedModules.add(moduleId);

  const module = graph.modules.get(moduleId);
  if (!module) {
    return;
  }

  const exportsUsed = usedExports.get(moduleId) || new Set<string>();

  for (const depId of module.dependencies) {
    const depModule = graph.modules.get(depId);
    if (!depModule) {
      continue;
    }

    for (const imp of module.info.imports) {
      if (imp.source === depId) {
        for (const spec of imp.specifiers) {
          if (spec.type === "default") {
            exportsUsed.add("default");
          } else if (spec.type === "named") {
            exportsUsed.add(spec.imported || spec.local);
          }
        }
      }
    }

    markModuleUsed(graph, depId, usedExports, analyzedModules);
  }

  if (exportsUsed.size > 0 || !usedExports.has(moduleId)) {
    usedExports.set(moduleId, exportsUsed);
  }
}

function pruneUnusedModules(
  _graph: DependencyGraph,
  _usedExports: Map<string, Set<string>>,
  _analyzedModules: Set<string>,
): void {
  // All modules are already analyzed by markModuleExportsUsed/markModuleUsed
  // before this function is called, so there's nothing to prune here.
  // The actual pruning happens via graph.prune() called after tree shaking.
}

export function analyzeModuleSideEffects(
  moduleInfo: any,
  code?: string,
): boolean {
  if (!code) {
    return moduleInfo.hasSideEffects;
  }

  const hasSideEffects = moduleInfo.hasSideEffects;

  if (!hasSideEffects) {
    return false;
  }

  const lines = code.split("\n");
  const nonDeclarationLines = lines.filter(
    (line) =>
      !line.trim().startsWith("//") &&
      !line.trim().startsWith("/*") &&
      !line.trim().startsWith("*") &&
      !line.trim().startsWith("import ") &&
      !line.trim().startsWith("export ") &&
      line.trim() !== "" &&
      !line.trim().startsWith("const ") &&
      !line.trim().startsWith("let ") &&
      !line.trim().startsWith("var ") &&
      !line.trim().startsWith("function ") &&
      !line.trim().startsWith("class ") &&
      !line.trim().startsWith("interface ") &&
      !line.trim().startsWith("type ") &&
      !line.trim().startsWith("enum "),
  );

  return nonDeclarationLines.length > 0;
}
