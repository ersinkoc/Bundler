// @ts-nocheck
export enum TokenType {
  KEYWORD = 'KEYWORD',
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  OPERATOR = 'OPERATOR',
  PUNCTUATOR = 'PUNCTUATOR',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
}

export enum Keyword {
  IMPORT = 'import',
  EXPORT = 'export',
  FROM = 'from',
  AS = 'as',
  DEFAULT = 'default',
  CONST = 'const',
  LET = 'let',
  VAR = 'var',
  FUNCTION = 'function',
  CLASS = 'class',
  RETURN = 'return',
  IF = 'if',
  ELSE = 'else',
  FOR = 'for',
  WHILE = 'while',
  DO = 'do',
  SWITCH = 'switch',
  CASE = 'case',
  BREAK = 'break',
  CONTINUE = 'continue',
  NEW = 'new',
  THIS = 'this',
  SUPER = 'super',
  EXTENDS = 'extends',
  TYPEOF = 'typeof',
  INSTANCEOF = 'instanceof',
  TRY = 'try',
  CATCH = 'catch',
  FINALLY = 'finally',
  THROW = 'throw',
  ASYNC = 'async',
  AWAIT = 'await',
  YIELD = 'yield',
  TYPE = 'type',
  INTERFACE = 'interface',
  ENUM = 'enum',
  DECLARE = 'declare',
  NAMESPACE = 'namespace',
  MODULE = 'module',
}

export const KEYWORDS = new Set<Keyword>([
  Keyword.IMPORT,
  Keyword.EXPORT,
  Keyword.FROM,
  Keyword.AS,
  Keyword.DEFAULT,
  Keyword.CONST,
  Keyword.LET,
  Keyword.VAR,
  Keyword.FUNCTION,
  Keyword.CLASS,
  Keyword.RETURN,
  Keyword.IF,
  Keyword.ELSE,
  Keyword.FOR,
  Keyword.WHILE,
  Keyword.DO,
  Keyword.SWITCH,
  Keyword.CASE,
  Keyword.BREAK,
  Keyword.CONTINUE,
  Keyword.NEW,
  Keyword.THIS,
  Keyword.SUPER,
  Keyword.EXTENDS,
  Keyword.TYPEOF,
  Keyword.INSTANCEOF,
  Keyword.TRY,
  Keyword.CATCH,
  Keyword.FINALLY,
  Keyword.THROW,
  Keyword.ASYNC,
  Keyword.AWAIT,
  Keyword.YIELD,
  Keyword.TYPE,
  Keyword.INTERFACE,
  Keyword.ENUM,
  Keyword.DECLARE,
  Keyword.NAMESPACE,
  Keyword.MODULE,
])

export interface Token {
  type: TokenType
  value: string
  loc: { line: number; column: number }
}

export class Tokenizer {
  private code: string
  private pos = 0
  private line = 1
  private column = 1

  constructor(code: string) {
    this.code = code
  }

  tokenize(): Token[] {
    const tokens: Token[] = []

    while (this.pos < this.code.length) {
      const token = this.nextToken()
      if (token) {
        tokens.push(token)
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      loc: { line: this.line, column: this.column },
    })

    return tokens
  }

  private nextToken(): Token | null {
    this.skipWhitespace()

    if (this.pos >= this.code.length) {
      return null
    }

    const char = this.code[this.pos]

    if (char === '/' && this.code[this.pos + 1] === '/') {
      return this.readSingleLineComment()
    }

    if (char === '/' && this.code[this.pos + 1] === '*') {
      return this.readMultiLineComment()
    }

    if (char === '"' || char === "'" || char === '`') {
      return this.readString()
    }

    if (this.isDigit(char)) {
      return this.readNumber()
    }

    if (this.isIdentifierStart(char)) {
      return this.readIdentifier()
    }

    if (this.isOperator(char)) {
      return this.readOperator()
    }

    if (this.isPunctuator(char)) {
      return this.readPunctuator()
    }

    throw this.syntaxError(`Unexpected character: ${char}`)
  }

  private skipWhitespace(): void {
    while (this.pos < this.code.length && /\s/.test(this.code[this.pos])) {
      if (this.code[this.pos] === '\n') {
        this.line++
        this.column = 1
      } else {
        this.column++
      }
      this.pos++
    }
  }

  private readSingleLineComment(): Token {
    const startLoc = { line: this.line, column: this.column }
    this.pos += 2
    this.column += 2

    let value = ''
    while (this.pos < this.code.length && this.code[this.pos] !== '\n') {
      value += this.code[this.pos]
      this.pos++
      this.column++
    }

    return { type: TokenType.COMMENT, value, loc: startLoc }
  }

  private readMultiLineComment(): Token {
    const startLoc = { line: this.line, column: this.column }
    this.pos += 2
    this.column += 2

    let value = '/*'
    while (this.pos < this.code.length - 1) {
      const next = this.code[this.pos]
      value += next

      if (next === '\n') {
        this.line++
        this.column = 1
      } else {
        this.column++
      }

      this.pos++

      if (next === '*' && this.code[this.pos] === '/') {
        value += '/'
        this.pos++
        this.column++
        break
      }
    }

    return { type: TokenType.COMMENT, value, loc: startLoc }
  }

  private readString(): Token {
    const quote = this.code[this.pos]
    const startLoc = { line: this.line, column: this.column }
    this.pos++
    this.column++

    let value = ''
    while (this.pos < this.code.length && this.code[this.pos] !== quote) {
      const char = this.code[this.pos]

      if (char === '\\' && this.pos + 1 < this.code.length) {
        const next = this.code[this.pos + 1]
        value += this.escapeChar(next)
        this.pos += 2
        this.column += 2
      } else {
        value += char
        this.pos++
        this.column++
      }
    }

    if (this.pos >= this.code.length) {
      throw this.syntaxError('Unterminated string literal')
    }

    this.pos++
    this.column++

    return { type: TokenType.STRING, value, loc: startLoc }
  }

  private escapeChar(char: string): string {
    switch (char) {
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      case 'b':
        return '\b'
      case 'f':
        return '\f'
      case 'v':
        return '\v'
      case '0':
        return '\0'
      case "'":
        return "'"
      case '"':
        return '"'
      case '`':
        return '`'
      case '\\':
        return '\\'
      default:
        return char
    }
  }

  private readNumber(): Token {
    const startLoc = { line: this.line, column: this.column }
    let value = ''

    while (this.pos < this.code.length && this.isDigit(this.code[this.pos])) {
      value += this.code[this.pos]
      this.pos++
      this.column++
    }

    if (this.pos < this.code.length && this.code[this.pos] === '.') {
      value += this.code[this.pos]
      this.pos++
      this.column++

      while (this.pos < this.code.length && this.isDigit(this.code[this.pos])) {
        value += this.code[this.pos]
        this.pos++
        this.column++
      }
    }

    if (this.pos < this.code.length && (this.code[this.pos] === 'e' || this.code[this.pos] === 'E')) {
      value += this.code[this.pos]
      this.pos++
      this.column++

      if (this.pos < this.code.length && (this.code[this.pos] === '+' || this.code[this.pos] === '-')) {
        value += this.code[this.pos]
        this.pos++
        this.column++
      }

      while (this.pos < this.code.length && this.isDigit(this.code[this.pos])) {
        value += this.code[this.pos]
        this.pos++
        this.column++
      }
    }

    return { type: TokenType.NUMBER, value, loc: startLoc }
  }

  private readIdentifier(): Token {
    const startLoc = { line: this.line, column: this.column }
    let value = ''

    while (this.pos < this.code.length && this.isIdentifierChar(this.code[this.pos])) {
      value += this.code[this.pos]
      this.pos++
      this.column++
    }

    const type = KEYWORDS.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER

    return { type, value, loc: startLoc }
  }

  private readOperator(): Token {
    const startLoc = { line: this.line, column: this.column }
    const char = this.code[this.pos]

    let value = char
    this.pos++
    this.column++

    if (this.pos < this.code.length) {
      const twoCharOps = ['==', '!=', '===', '!==', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '=>']

      const twoChar = value + this.code[this.pos]
      if (twoCharOps.includes(twoChar) || (char === '=' && this.code[this.pos] === '=')) {
        value = twoChar
        this.pos++
        this.column++

        if (this.pos < this.code.length && (value === '=' || value === '!') && this.code[this.pos] === '=') {
          value += this.code[this.pos]
          this.pos++
          this.column++
        }
      }
    }

    return { type: TokenType.OPERATOR, value, loc: startLoc }
  }

  private readPunctuator(): Token {
    const startLoc = { line: this.line, column: this.column }
    const char = this.code[this.pos]

    let value = char
    this.pos++
    this.column++

    return { type: TokenType.PUNCTUATOR, value, loc: startLoc }
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char)
  }

  private isIdentifierStart(char: string): boolean {
    return /[a-zA-Z_$]/.test(char)
  }

  private isIdentifierChar(char: string): boolean {
    return /[a-zA-Z0-9_$]/.test(char)
  }

  private isOperator(char: string): boolean {
    return /[=+\-*/%&|^!<>?~]/.test(char)
  }

  private isPunctuator(char: string): boolean {
    return /[(){}[\].,;:]/.test(char)
  }

  private syntaxError(message: string): SyntaxError {
    return new SyntaxError(`[Line ${this.line}:${this.column}] ${message}`)
  }
}
