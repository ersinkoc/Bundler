import type { SourceMap } from '../types.js'

export interface Mapping {
  generated: { line: number; column: number }
  original: { line: number; column: number }
  source: string
  name?: string
}

export class SourceMapGenerator {
  private mappings: Mapping[] = []
  private sources: string[] = []
  private names: string[] = []
  private sourceSet = new Set<string>()
  private nameSet = new Set<string>()

  addMapping(mapping: Mapping): void {
    this.mappings.push(mapping)

    if (!this.sourceSet.has(mapping.source)) {
      this.sourceSet.add(mapping.source)
      this.sources.push(mapping.source)
    }

    if (mapping.name && !this.nameSet.has(mapping.name)) {
      this.nameSet.add(mapping.name)
      this.names.push(mapping.name)
    }
  }

  addMappings(mappings: Mapping[]): void {
    for (const mapping of mappings) {
      this.addMapping(mapping)
    }
  }

  toString(): string {
    return JSON.stringify({
      version: 3,
      sources: this.sources,
      names: this.names,
      mappings: this.encodeMappings(),
    })
  }

  toObject(): SourceMap {
    return {
      version: 3,
      sources: this.sources,
      names: this.names,
      mappings: this.encodeMappings(),
    }
  }

  private encodeMappings(): string {
    const encoded: string[] = []
    let lastGenLine = 0
    let lastGenCol = 0
    let lastOrigLine = 0
    let lastOrigCol = 0
    let lastSourceIndex = 0
    let lastNameIndex = 0

    for (const mapping of this.mappings) {
      const genLine = mapping.generated.line
      const genCol = mapping.generated.column
      const origLine = mapping.original.line
      const origCol = mapping.original.column
      const sourceIndex = this.sources.indexOf(mapping.source)
      const nameIndex = mapping.name ? this.names.indexOf(mapping.name) : -1

      if (genLine > lastGenLine) {
        for (let i = lastGenLine; i < genLine; i++) {
          encoded.push(';')
        }
        lastGenCol = 0
      } else if (encoded.length > 0) {
        encoded.push(',')
      }

      encoded.push(this.encodeVLQ(genCol - lastGenCol))
      lastGenCol = genCol

      encoded.push(this.encodeVLQ(sourceIndex - lastSourceIndex))
      lastSourceIndex = sourceIndex

      encoded.push(this.encodeVLQ(origLine - lastOrigLine))
      lastOrigLine = origLine

      encoded.push(this.encodeVLQ(origCol - lastOrigCol))
      lastOrigCol = origCol

      if (nameIndex >= 0) {
        encoded.push(this.encodeVLQ(nameIndex - lastNameIndex))
        lastNameIndex = nameIndex
      }

      lastGenLine = genLine
    }

    return encoded.join('')
  }

  private encodeVLQ(value: number): string {
    const signBit = value < 0 ? 1 : 0
    const absValue = Math.abs(value)

    const vlq = this.toVLQ(absValue)
    const vlqWithSign = (vlq << 1) | signBit

    return this.encodeBase64(vlqWithSign)
  }

  private toVLQ(value: number): number {
    let result = 0
    let shift = 0

    do {
      const byte = value & 0b1111
      result |= (byte << shift)
      value >>>= 5
      shift += 5
    } while (value > 0)

    return result
  }

  private encodeBase64(value: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const result: string[] = []

    do {
      const byte = value & 0b111111
      const char = chars[byte]
      if (char) {
        result.unshift(char)
      }
      value >>>= 6
    } while (value > 0)

    return result.join('')
  }
}

export class SourceMapConsumer {
  private sourceMap: SourceMap
  private decodedMappings: Array<{
    genLine: number
    genCol: number
    origLine: number
    origCol: number
    source: string
    name?: string
  }> = []

  constructor(sourceMap: SourceMap) {
    this.sourceMap = sourceMap
    this.decodeMappings()
  }

  getOriginalPosition(generated: { line: number; column: number }): { line: number; column: number; source: string } | null {
    for (const mapping of this.decodedMappings) {
      if (
        mapping.genLine === generated.line &&
        mapping.genCol <= generated.column
      ) {
        return {
          line: mapping.origLine,
          column: mapping.origCol,
          source: mapping.source,
        }
      }
    }
    return null
  }

  private decodeMappings(): void {
    const encoded = this.sourceMap.mappings
    let genLine = 0
    let genCol = 0
    let origLine = 0
    let origCol = 0
    let sourceIndex = 0
    let nameIndex = 0

    const segments = encoded.split(/[;,]/)
    let segIndex = 0

    for (const segment of segments) {
      if (segment === '') {
        continue
      }

      if (segment === ';') {
        genLine++
        genCol = 0
        continue
      }

      const values = segment.split('').map((c: string) => this.decodeBase64(c))
      let valIndex = 0

      genCol += this.decodeVLQ(values[valIndex++])
      sourceIndex += this.decodeVLQ(values[valIndex++])
      origLine += this.decodeVLQ(values[valIndex++])
      origCol += this.decodeVLQ(values[valIndex++])

      const source = this.sourceMap.sources[sourceIndex]
      let name: string | undefined

      if (valIndex < values.length) {
        nameIndex += this.decodeVLQ(values[valIndex])
        name = this.sourceMap.names[nameIndex]
      }

      this.decodedMappings.push({
        genLine,
        genCol,
        origLine,
        origCol,
        source,
        name,
      })
    }
  }

  private decodeBase64(char: string): number {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    return chars.indexOf(char)
  }

  private decodeVLQ(value: number): number {
    const sign = value & 1
    let absValue = value >>> 1

    let result = 0
    let shift = 0

    while (absValue > 0) {
      const byte = absValue & 0b1111
      result |= (byte << shift)
      absValue >>>= 5
      shift += 5
    }

    return sign === 1 ? -result : result
  }
}

export function generateSourceMap(code: string, mappings: Mapping[]): string {
  const generator = new SourceMapGenerator()
  generator.addMappings(mappings)
  return generator.toString()
}
