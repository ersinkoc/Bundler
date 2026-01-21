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

          if (exportDecl.specifiers) {
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
        } else if (node.type === "FunctionDeclaration") {
          const funcDecl = node as acorn.FunctionDeclaration;
          if (funcDecl.id?.name) {
            exports.push({ type: "named", name: funcDecl.id.name });
          }
        } else if (node.type === "ClassDeclaration") {
          const classDecl = node as acorn.ClassDeclaration;
          if (classDecl.id?.name) {
            exports.push({ type: "named", name: classDecl.id.name });
          }
        } else if (node.type === "VariableDeclaration") {
          const varDecl = node as acorn.VariableDeclaration;
          if (varDecl.declarations) {
            for (const decl of varDecl.declarations) {
              if (decl.id.type === "Identifier") {
                exports.push({ type: "named", name: decl.id.name });
              }
            }
          }
        } else if (node.type === "TSTypeAliasDeclaration") {
          const typeAlias = node as any;
          if (typeAlias.id?.name) {
            exports.push({ type: "named", name: typeAlias.id.name });
          }
        } else if (node.type === "TSEnumDeclaration") {
          const enumDecl = node as any;
          if (enumDecl.id?.name) {
            exports.push({ type: "named", name: enumDecl.id.name });
          }
        } else if (node.type === "TSInterfaceDeclaration") {
          const interfaceDecl = node as any;
          if (interfaceDecl.id?.name) {
            exports.push({ type: "named", name: interfaceDecl.id.name });
          }
        } else if (node.type === "CallExpression") {
          const callExpr = node as acorn.CallExpression;
          if ((callExpr.callee as any).type === "Import") {
            if (callExpr.arguments.length > 0) {
              const arg = callExpr.arguments[0];
              if (
                arg &&
                arg.type === "Literal" &&
                typeof arg.value === "string"
              ) {
                dynamicImports.push(arg.value);
              }
            }
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
          if (child && typeof child === "object" && child.type) {
            walk(child);
          }
        }
      };

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
        if (child && typeof child === "object" && child.type) {
          walk(child);
        }
      }
    };

    walk(ast);
    return hasEffects;
  }
}
