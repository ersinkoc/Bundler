import * as path from 'node:path'

export class PathUtils {
  join(...paths: string[]): string {
    return path.join(...paths)
  }

  dirname(p: string): string {
    return path.dirname(p)
  }

  basename(p: string, ext?: string): string {
    return path.basename(p, ext)
  }

  relative(from: string, to: string): string {
    return path.relative(from, to)
  }

  normalize(p: string): string {
    return path.normalize(p)
  }

  resolve(...paths: string[]): string {
    return path.resolve(...paths)
  }

  extname(p: string): string {
    return path.extname(p)
  }

  isAbsolute(p: string): boolean {
    return path.isAbsolute(p)
  }

  parse(p: string): path.ParsedPath {
    return path.parse(p)
  }

  format(p: path.ParsedPath): string {
    return path.format(p)
  }

  sep: string = path.sep
}

export const pathUtils = new PathUtils()
