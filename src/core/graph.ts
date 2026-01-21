import type {
  DependencyGraph as IDependencyGraph,
  ModuleNode,
  ModuleInfo,
} from '../types.js'

export class DependencyGraph implements IDependencyGraph {
  modules = new Map<string, ModuleNode>()

  addModule(id: string, info: ModuleInfo): void {
    this.modules.set(id, {
      id,
      info,
      dependencies: new Set(),
      dependents: new Set(),
      imported: false,
      pure: info.isPure,
      code: info.code,
    })
  }

  addDependency(from: string, to: string): void {
    const fromNode = this.modules.get(from)
    const toNode = this.modules.get(to)

    if (!fromNode) {
      throw new Error(`Module not found: ${from}`)
    }

    if (!toNode) {
      throw new Error(`Module not found: ${to}`)
    }

    fromNode.dependencies.add(to)
    toNode.dependents.add(from)
  }

  getDependencies(id: string): string[] {
    const node = this.modules.get(id)
    if (!node) {
      return []
    }
    return Array.from(node.dependencies)
  }

  getDependents(id: string): string[] {
    const node = this.modules.get(id)
    if (!node) {
      return []
    }
    return Array.from(node.dependents)
  }

  detectCircular(id: string): string[] | null {
    const visited = new Set<string>()
    const path: string[] = []

    const visit = (nodeId: string): boolean => {
      if (path.includes(nodeId)) {
        const cycleStart = path.indexOf(nodeId)
        return true
      }

      if (visited.has(nodeId)) {
        return false
      }

      visited.add(nodeId)
      path.push(nodeId)

      const node = this.modules.get(nodeId)
      if (!node) {
        path.pop()
        return false
      }

      for (const dep of node.dependencies) {
        if (visit(dep)) {
          if (path[0] === dep) {
            return true
          }
          return true
        }
      }

      path.pop()
      return false
    }

     if (visit(id)) {
       return [...path, path[0] || '']
     }

    return null
  }

  getBuildOrder(): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (id: string): void => {
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected: ${Array.from(visiting).join(' → ')} → ${id}`)
      }

      if (visited.has(id)) {
        return
      }

      visiting.add(id)

      const node = this.modules.get(id)
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep)
        }
      }

      visiting.delete(id)
      visited.add(id)
      order.push(id)
    }

    for (const id of this.modules.keys()) {
      visit(id)
    }

    return order
  }

  prune(entryPoints: string[]): void {
    const keepSet = new Set(entryPoints)
    const toRemove = new Set<string>()

    for (const [id, node] of this.modules) {
      if (!keepSet.has(id) && !node.imported) {
        toRemove.add(id)
      }
    }

    for (const id of toRemove) {
      this.modules.delete(id)

      for (const node of this.modules.values()) {
        node.dependencies.delete(id)
        node.dependents.delete(id)
      }
    }
  }
}
