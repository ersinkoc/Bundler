import type {
  ModuleInfo,
  Import,
  ImportSpecifier,
  Export,
} from "../../types.js";
import * as acorn from "acorn";
import acornJsx from "acorn-jsx";

// @ts-ignore
const parser = acorn.Parser.extend(acornJsx());

export class ASTModuleParser {
  parseModule(code: string, id: string): ModuleInfo {
    const imports: Import[] = [];
    const exports: Export[] = [];
    const dynamicImports: string[] = [];

    try {
      const ast = parser.parse(code, {
        ecmaVersion: "latest",
        sourceType: "module",
        allowAwaitOutsideFunction: true,
        allowHashBang: true,
        locations: true,
      }) as acorn.Program;

      const walk = (node: acorn.Node): void => {
        if (node.type === "ImportDeclaration") {
          const importDecl = node as acorn.ImportDeclaration;
          const import_: Import = {
            source: importDecl.source.value as string,
            specifiers: [],
          };

          for (const spec of importDecl.specifiers) {
            if (spec.type === "ImportDefaultSpecifier") {
              import_.specifiers.push({
                type: "default",
                local: (spec as any).local.name,
              });
            } else if (spec.type === "ImportSpecifier") {
              import_.specifiers.push({
                type: "named",
                local: (spec as any).local.name,
                imported: (spec as any).imported.name,
              });
            } else if (spec.type === "ImportNamespaceSpecifier") {
              import_.specifiers.push({
                type: "namespace",
                local: (spec as any).local.name,
              });
            }
          }

          imports.push(import_);
        } else if (node.type === "ExportNamedDeclaration") {
          const exportDecl = node as acorn.ExportNamedDeclaration;
          const source = exportDecl.source?.value as string | undefined;

          // Handle: export const foo = 1, export function bar() {}, export class Baz {}
          if (exportDecl.declaration) {
            const decl = exportDecl.declaration as any;
            if (decl.type === "VariableDeclaration") {
              for (const d of decl.declarations) {
                if (d.id.type === "Identifier") {
                  exports.push({ type: "named", name: d.id.name });
                }
              }
            } else if (decl.type === "FunctionDeclaration" && decl.id?.name) {
              exports.push({ type: "named", name: decl.id.name });
            } else if (decl.type === "ClassDeclaration" && decl.id?.name) {
              exports.push({ type: "named", name: decl.id.name });
            }
          }

          // Handle: export { foo, bar }
          if (exportDecl.specifiers && exportDecl.specifiers.length > 0) {
            for (const spec of exportDecl.specifiers) {
              exports.push({
                type: "named",
                name: (spec as any).exported.name,
                source,
              });
            }
          }
        } else if (node.type === "ExportDefaultDeclaration") {
          exports.push({ type: "default" });
        } else if (node.type === "ExportAllDeclaration") {
          const exportAll = node as acorn.ExportAllDeclaration;
          const source = exportAll.source.value as string;
          exports.push({
            type: "all",
            source,
          });
        } else if (node.type === "ImportExpression") {
          // Handle dynamic import() expressions
          const importExpr = node as any;
          if (
            importExpr.source &&
            importExpr.source.type === "Literal" &&
            typeof importExpr.source.value === "string"
          ) {
            dynamicImports.push(importExpr.source.value);
          }
        }

        for (const key in node) {
          if (
            key === "type" ||
            key === "start" ||
            key === "end" ||
            key === "loc"
          )
            continue;
          const child = (node as any)[key];
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === "object" && item.type) {
                walk(item);
              }
            }
          } else if (child && typeof child === "object" && child.type) {
            walk(child);
          }
        }
      };

      // Walk through all top-level statements
      for (const node of ast.body) {
        walk(node);
      }

      return {
        imports,
        exports,
        dynamicImports,
        hasSideEffects: this.analyzeSideEffects(ast),
        isPure: !this.analyzeSideEffects(ast),
      };
    } catch (error) {
      throw new Error(
        `Failed to parse ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private analyzeSideEffects(ast: acorn.Program): boolean {
    let hasEffects = false;

    const walk = (node: acorn.Node): void => {
      if (hasEffects) return;

      if (node.type === "Identifier") {
        const id = (node as acorn.Identifier).name;
        if (
          ["console", "window", "document", "process", "global"].includes(id)
        ) {
          hasEffects = true;
          return;
        }
      }
      if (node.type === "MemberExpression") {
        const expr = node as acorn.MemberExpression;
        const obj = expr.object;
        if (
          obj.type === "Identifier" &&
          ["console", "window", "document", "process", "global"].includes(
            (obj as acorn.Identifier).name,
          )
        ) {
          hasEffects = true;
          return;
        }
      }
      if (node.type === "CallExpression") {
        const callExpr = node as acorn.CallExpression;
        if (callExpr.callee.type === "MemberExpression") {
          const member = callExpr.callee as acorn.MemberExpression;
          const obj = member.object;
          if (
            obj.type === "Identifier" &&
            ["console", "window", "document", "process", "global"].includes(
              (obj as acorn.Identifier).name,
            )
          ) {
            hasEffects = true;
            return;
          }
        }
      }

      for (const key in node) {
        if (key === "type" || key === "start" || key === "end" || key === "loc")
          continue;
        const child = (node as any)[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === "object" && item.type) {
              walk(item);
            }
          }
        } else if (child && typeof child === "object" && child.type) {
          walk(child);
        }
      }
    };

    walk(ast);
    return hasEffects;
  }
}
