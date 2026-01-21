import { describe, it, expect } from 'vitest'
import { SimpleModuleParser } from '../../src/core/parser/parser'
import { bundle } from '../../src/index'

describe('SimpleModuleParser - Direct Test', () => {
  it('should parse empty module', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('', 'test.js')

    expect(result.imports).toHaveLength(0)
    expect(result.exports).toHaveLength(0)
    expect(result.dynamicImports).toHaveLength(0)
    expect(result.hasSideEffects).toBe(false)
    expect(result.isPure).toBe(true)
  })

  it('should parse exports', () => {
    const parser = new SimpleModuleParser()

    const result1 = parser.parseModule('export const foo = 1', 'test.js')
    expect(result1.exports).toHaveLength(1)
    expect(result1.exports[0]).toEqual({ type: 'named', name: 'foo' })

    const result2 = parser.parseModule('export default class Foo {}', 'test.js')
    expect(result2.exports).toHaveLength(1)
    expect(result2.exports[0]).toEqual({ type: 'default' })
  })
})
