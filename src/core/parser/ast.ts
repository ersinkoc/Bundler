export interface ASTNode {
  type: string
  loc?: { line: number; column: number }
}

export interface Program extends ASTNode {
  type: 'Program'
  body: Statement[]
}

export interface ImportDeclaration extends ASTNode {
  type: 'ImportDeclaration'
  source: string
  specifiers: ImportSpecifier[]
}

export interface ExportDeclaration extends ASTNode {
  type: 'ExportDeclaration'
  kind: 'named' | 'default' | 'all' | 'namespace'
  source?: string
  specifiers?: ExportSpecifier[]
}

export interface ExportSpecifier {
  name: string
}

export interface ImportSpecifier {
  type: 'named' | 'default' | 'namespace'
  local: string
  imported?: string
}

export type Statement = ImportDeclaration | ExportDeclaration
