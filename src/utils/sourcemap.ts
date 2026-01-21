import type { SourceMap } from '../types.js'

// Base64 VLQ character set per source map spec
const VLQ_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const VLQ_CHAR_TO_INT = new Map<string, number>()
for (let i = 0; i < VLQ_CHARS.length; i++) {
  VLQ_CHAR_TO_INT.set(VLQ_CHARS[i]!, i)
}

// VLQ constants
const VLQ_BASE_SHIFT = 5
const VLQ_BASE = 1 << VLQ_BASE_SHIFT // 32
const VLQ_BASE_MASK = VLQ_BASE - 1 // 31
const VLQ_CONTINUATION_BIT = VLQ_BASE // 32

/**
 * Encode a number as a Base64 VLQ string per source map spec
 */
export function encodeVLQ(value: number): string {
  let result = ''

  // Convert to VLQ signed representation:
  // - Positive numbers: value << 1
  // - Negative numbers: (-value << 1) + 1
  let vlq = value < 0 ? ((-value) << 1) + 1 : value << 1

  do {
    // Take 5 bits at a time
    let digit = vlq & VLQ_BASE_MASK
    vlq >>>= VLQ_BASE_SHIFT

    // Set continuation bit if there are more digits
    if (vlq > 0) {
      digit |= VLQ_CONTINUATION_BIT
    }

    result += VLQ_CHARS[digit]
  } while (vlq > 0)

  return result
}

/**
 * Decode a Base64 VLQ string to an array of numbers
 */
export function decodeVLQ(encoded: string): number[] {
  const values: number[] = []
  let shift = 0
  let value = 0

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i]!
    const digit = VLQ_CHAR_TO_INT.get(char)

    if (digit === undefined) {
      throw new Error(`Invalid VLQ character: ${char}`)
    }

    const hasContinuation = (digit & VLQ_CONTINUATION_BIT) !== 0
    value += (digit & VLQ_BASE_MASK) << shift

    if (hasContinuation) {
      shift += VLQ_BASE_SHIFT
    } else {
      // Decode sign: LSB is sign bit
      const isNegative = (value & 1) === 1
      const absValue = value >>> 1
      values.push(isNegative ? -absValue : absValue)

      // Reset for next value
      value = 0
      shift = 0
    }
  }

  return values
}

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
    // Sort mappings by generated position
    const sorted = [...this.mappings].sort((a, b) => {
      if (a.generated.line !== b.generated.line) {
        return a.generated.line - b.generated.line
      }
      return a.generated.column - b.generated.column
    })

    const lines: string[][] = []
    let lastGenLine = 0
    let lastGenCol = 0
    let lastOrigLine = 0
    let lastOrigCol = 0
    let lastSourceIndex = 0
    let lastNameIndex = 0

    for (const mapping of sorted) {
      const genLine = mapping.generated.line
      const genCol = mapping.generated.column
      const origLine = mapping.original.line
      const origCol = mapping.original.column
      const sourceIndex = this.sources.indexOf(mapping.source)
      const nameIndex = mapping.name ? this.names.indexOf(mapping.name) : -1

      // Add empty lines if needed
      while (lines.length <= genLine) {
        lines.push([])
      }

      // Reset column tracking when moving to a new line
      if (genLine > lastGenLine) {
        lastGenCol = 0
      }

      // Build segment
      let segment = encodeVLQ(genCol - lastGenCol)
      segment += encodeVLQ(sourceIndex - lastSourceIndex)
      segment += encodeVLQ(origLine - lastOrigLine)
      segment += encodeVLQ(origCol - lastOrigCol)

      if (nameIndex >= 0) {
        segment += encodeVLQ(nameIndex - lastNameIndex)
        lastNameIndex = nameIndex
      }

      lines[genLine]!.push(segment)

      lastGenLine = genLine
      lastGenCol = genCol
      lastSourceIndex = sourceIndex
      lastOrigLine = origLine
      lastOrigCol = origCol
    }

    return lines.map(segments => segments.join(',')).join(';')
  }
}

export interface DecodedMapping {
  genLine: number
  genCol: number
  origLine: number
  origCol: number
  source: string
  name?: string
}

export class SourceMapConsumer {
  private sourceMap: SourceMap
  private decodedMappings: DecodedMapping[] = []

  constructor(sourceMap: SourceMap) {
    this.sourceMap = sourceMap
    this.decodeMappings()
  }

  getOriginalPosition(generated: { line: number; column: number }): { line: number; column: number; source: string; name?: string } | null {
    // Find the best matching mapping for the given generated position
    let bestMatch: DecodedMapping | null = null

    for (const mapping of this.decodedMappings) {
      if (mapping.genLine === generated.line && mapping.genCol <= generated.column) {
        // Prefer the mapping closest to the generated column
        if (!bestMatch || mapping.genCol > bestMatch.genCol) {
          bestMatch = mapping
        }
      }
    }

    if (bestMatch) {
      return {
        line: bestMatch.origLine,
        column: bestMatch.origCol,
        source: bestMatch.source,
        name: bestMatch.name,
      }
    }

    return null
  }

  getAllMappings(): DecodedMapping[] {
    return [...this.decodedMappings]
  }

  private decodeMappings(): void {
    const encoded = this.sourceMap.mappings
    if (!encoded) return

    let genLine = 0
    let genCol = 0
    let origLine = 0
    let origCol = 0
    let sourceIndex = 0
    let nameIndex = 0

    // Split by semicolons (line separators) first
    const lines = encoded.split(';')

    for (const line of lines) {
      // Reset column for each new line
      genCol = 0

      if (line.length === 0) {
        genLine++
        continue
      }

      // Split by commas (segment separators)
      const segments = line.split(',')

      for (const segment of segments) {
        if (segment.length === 0) continue

        // Decode VLQ values for this segment
        const values = decodeVLQ(segment)

        if (values.length === 0) continue

        // Field 1: Generated column (relative)
        genCol += values[0]!

        // Fields 2-5 are optional
        if (values.length >= 4) {
          // Field 2: Source index (relative)
          sourceIndex += values[1]!
          // Field 3: Original line (relative)
          origLine += values[2]!
          // Field 4: Original column (relative)
          origCol += values[3]!

          const source = this.sourceMap.sources[sourceIndex]
          if (source === undefined) continue

          let name: string | undefined
          if (values.length >= 5) {
            // Field 5: Name index (relative)
            nameIndex += values[4]!
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

      genLine++
    }

    // Sort by generated position for efficient lookup
    this.decodedMappings.sort((a, b) => {
      if (a.genLine !== b.genLine) return a.genLine - b.genLine
      return a.genCol - b.genCol
    })
  }
}

export function generateSourceMap(code: string, mappings: Mapping[]): string {
  const generator = new SourceMapGenerator()
  generator.addMappings(mappings)
  return generator.toString()
}
