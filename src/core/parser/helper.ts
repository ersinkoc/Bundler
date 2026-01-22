import type { ModuleInfo } from "../../types.js";
import * as acorn from "acorn";

export function isIdentifier(node: any): node is acorn.Identifier {
  return node && node.type === "Identifier";
}

export function isLiteral(node: any): node is acorn.Literal {
  return node && node.type === "Literal";
}

export function isStringLiteral(node: any): node is acorn.Literal {
  return node && node.type === "Literal" && typeof node.value === "string";
}

export function isNumericLiteral(node: any): node is acorn.Literal {
  return node && node.type === "Literal" && typeof node.value === "number";
}

export function isBooleanLiteral(node: any): node is acorn.Literal {
  return node && node.type === "Literal" && node.value === true;
}

export function isNullLiteral(node: any): node is acorn.Literal {
  return node && node.type === "Literal" && node.value === null;
}

export function isUndefinedLiteral(node: any): node is acorn.Literal {
  return node && node.type === "Identifier" && node.name === "undefined";
}

export function isBinaryExpression(node: any): node is acorn.BinaryExpression {
  return node && node.type === "BinaryExpression";
}

export function isLogicalExpression(
  node: any,
): node is acorn.LogicalExpression {
  return node && node.type === "LogicalExpression";
}

export function isUnaryExpression(node: any): node is acorn.UnaryExpression {
  return node && node.type === "UnaryExpression";
}

export function isAssignmentExpression(
  node: any,
): node is acorn.AssignmentExpression {
  return node && node.type === "AssignmentExpression";
}

export function isSequenceExpression(
  node: any,
): node is acorn.SequenceExpression {
  return node && node.type === "SequenceExpression";
}

export function isCallExpression(node: any): node is acorn.CallExpression {
  return node && node.type === "CallExpression";
}

export function isMemberExpression(node: any): node is acorn.MemberExpression {
  return node && node.type === "MemberExpression";
}

export function isObjectExpression(node: any): node is acorn.ObjectExpression {
  return node && node.type === "ObjectExpression";
}

export function isArrayExpression(node: any): node is acorn.ArrayExpression {
  return node && node.type === "ArrayExpression";
}

export function isFunctionExpression(
  node: any,
): node is acorn.FunctionExpression {
  return node && node.type === "FunctionExpression";
}

export function isClassExpression(node: any): node is acorn.ClassExpression {
  return node && node.type === "ClassExpression";
}

export function isNewExpression(node: any): node is acorn.NewExpression {
  return node && node.type === "NewExpression";
}

export function isConditionalExpression(
  node: any,
): node is acorn.ConditionalExpression {
  return node && node.type === "ConditionalExpression";
}

export function isTemplateElement(node: any): node is acorn.TemplateElement {
  return node && node.type === "TemplateElement";
}

export function isImportDeclaration(
  node: any,
): node is acorn.ImportDeclaration {
  return node && node.type === "ImportDeclaration";
}

export function isExportNamedDeclaration(
  node: any,
): node is acorn.ExportNamedDeclaration {
  return node && node.type === "ExportNamedDeclaration";
}

export function isExportDefaultDeclaration(
  node: any,
): node is acorn.ExportDefaultDeclaration {
  return node && node.type === "ExportDefaultDeclaration";
}

export function isExportAllDeclaration(
  node: any,
): node is acorn.ExportAllDeclaration {
  return node && node.type === "ExportAllDeclaration";
}

export function isVariableDeclaration(
  node: any,
): node is acorn.VariableDeclaration {
  return node && node.type === "VariableDeclaration";
}

export function isFunctionDeclaration(
  node: any,
): node is acorn.FunctionDeclaration {
  return node && node.type === "FunctionDeclaration";
}

export function isClassDeclaration(node: any): node is acorn.ClassDeclaration {
  return node && node.type === "ClassDeclaration";
}

export function isTryStatement(node: any): node is acorn.TryStatement {
  return node && node.type === "TryStatement";
}

export function isCatchClause(node: any): node is acorn.CatchClause {
  return node && node.type === "CatchClause";
}

export function isFinallyClause(node: any): node is acorn.TryStatement {
  return node && node.type === "TryStatement" && !!node.finalizer;
}

export function isBlockStatement(node: any): node is acorn.BlockStatement {
  return node && node.type === "BlockStatement";
}

export function isEmpty(node: any): boolean {
  if (!node) return true;
  if (node.type === "EmptyStatement") {
    return true;
  }
  if (node.type === "BlockStatement") {
    return node.body.length === 0;
  }
  if (node.type === "Program") {
    return node.body.length === 0;
  }
  return false;
}
