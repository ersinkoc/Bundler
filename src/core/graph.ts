import type {
  DependencyGraph as IDependencyGraph,
  ModuleNode,
  ModuleInfo,
} from "../types.js";

export class DependencyGraph implements IDependencyGraph {
  modules = new Map<string, ModuleNode>();

  addModule(id: string, info: ModuleInfo): void {
    this.modules.set(id, {
      id,
      info,
      dependencies: new Set(),
      dependents: new Set(),
      imported: false,
      pure: info.isPure,
      code: info.code,
    });
  }

  addDependency(from: string, to: string): void {
    const fromNode = this.modules.get(from);
    const toNode = this.modules.get(to);

    if (!fromNode) {
      throw new Error(`Module not found: ${from}`);
    }

    if (!toNode) {
      throw new Error(`Module not found: ${to}`);
    }

    fromNode.dependencies.add(to);
    toNode.dependents.add(from);
  }

  getDependencies(id: string): string[] {
    const node = this.modules.get(id);
    if (!node) {
      return [];
    }
    return Array.from(node.dependencies);
  }

  getDependents(id: string): string[] {
    const node = this.modules.get(id);
    if (!node) {
      return [];
    }
    return Array.from(node.dependents);
  }

  detectCircular(id: string): string[] | null {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const path: string[] = [];

    const visit = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) {
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visiting.add(nodeId);
      path.push(nodeId);

      const node = this.modules.get(nodeId);
      if (!node) {
        path.pop();
        visiting.delete(nodeId);
        return false;
      }

      for (const dep of node.dependencies) {
        if (visit(dep)) {
          path.push(dep);
          return true;
        }
      }

      path.pop();
      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };

    if (visit(id)) {
      return path;
    }

    return null;
  }

  getBuildOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (id: string): void => {
      if (visiting.has(id)) {
        const cycle = Array.from(visiting).concat(id);
        throw new Error(`Circular dependency detected: ${cycle.join(" → ")}`);
      }

      if (visited.has(id)) {
        return;
      }

      visiting.add(id);

      const node = this.modules.get(id);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    for (const id of this.modules.keys()) {
      visit(id);
    }

    return order;
  }

  prune(entryPoints: string[]): void {
    const keepSet = new Set<string>();

    for (const entryId of entryPoints) {
      this.collectReachable(entryId, keepSet);
    }

    const dependencyRemovals = new Map<string, Set<string>>();
    const dependentRemovals = new Map<string, Set<string>>();

    for (const [id] of this.modules) {
      if (!keepSet.has(id)) {
        const node = this.modules.get(id);
        if (!node) continue;

        for (const depId of node.dependencies) {
          if (!dependencyRemovals.has(depId)) {
            dependencyRemovals.set(depId, new Set());
          }
          dependencyRemovals.get(depId)!.add(id);
        }

        for (const depId of node.dependents) {
          if (!dependentRemovals.has(depId)) {
            dependentRemovals.set(depId, new Set());
          }
          dependentRemovals.get(depId)!.add(id);
        }
      }
    }

    for (const [nodeId, toRemoveFromDeps] of dependencyRemovals) {
      const node = this.modules.get(nodeId);
      if (node) {
        for (const idToRemove of toRemoveFromDeps) {
          node.dependencies.delete(idToRemove);
        }
      }
    }

    for (const [nodeId, toRemoveFromDeps] of dependentRemovals) {
      const node = this.modules.get(nodeId);
      if (node) {
        for (const idToRemove of toRemoveFromDeps) {
          node.dependents.delete(idToRemove);
        }
      }
    }

    for (const id of this.modules.keys()) {
      if (!keepSet.has(id)) {
        this.modules.delete(id);
      }
    }
  }

  collectReachable(moduleId: string, visited: Set<string>): void {
    if (visited.has(moduleId)) {
      return;
    }
    visited.add(moduleId);

    const node = this.modules.get(moduleId);
    if (!node) {
      return;
    }

    for (const depId of node.dependencies) {
      this.collectReachable(depId, visited);
    }
  }
}
