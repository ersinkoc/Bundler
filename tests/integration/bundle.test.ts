import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SimpleModuleParser } from '../../src/core/parser/parser'
import { bundle } from '../../src/index'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'

describe('SimpleModuleParser', () => {
  it('should parse simple module', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('export const foo = 1', 'test.js')

    expect(result.imports).toHaveLength(0)
    expect(result.exports).toHaveLength(1)
    expect(result.exports[0]).toEqual({ type: 'named', name: 'foo' })
  })

  it('should parse imports', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('import { bar } from "./foo"', 'test.js')

    expect(result.imports).toHaveLength(1)
    expect(result.imports[0].source).toBe('./foo')
    expect(result.imports[0].specifiers).toHaveLength(1)
    expect(result.imports[0].specifiers[0].local).toBe('bar')
  })

  it('should parse default import', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('import foo from "./foo"', 'test.js')

    expect(result.imports[0].specifiers[0]).toEqual({ type: 'default', local: 'foo' })
  })

  it('should parse namespace import', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('import * as foo from "./foo"', 'test.js')

    expect(result.imports[0].specifiers[0]).toEqual({ type: 'namespace', local: 'foo' })
  })

  it('should parse re-export', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('export { bar } from "./foo"', 'test.js')

    expect(result.exports).toHaveLength(1)
    expect(result.exports[0]).toEqual({ type: 'named', name: 'bar', source: './foo' })
  })

  it('should parse export *', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('export * from "./foo"', 'test.js')

    expect(result.exports).toHaveLength(1)
    expect(result.exports[0]).toEqual({ type: 'all', source: './foo' })
  })

  it('should parse export default', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('export default foo = 1', 'test.js')

    expect(result.exports).toHaveLength(1)
    expect(result.exports[0]).toEqual({ type: 'default' })
  })

  it('should parse dynamic imports', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('const foo = import("./foo")', 'test.js')

    expect(result.dynamicImports).toContain('./foo')
  })

  it('should detect side effects', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('console.log("test")', 'test.js')

    expect(result.hasSideEffects).toBe(true)
    expect(result.isPure).toBe(false)
  })

  it('should detect pure module', () => {
    const parser = new SimpleModuleParser()
    const result = parser.parseModule('export const foo = 1', 'test.js')

    expect(result.hasSideEffects).toBe(false)
    expect(result.isPure).toBe(true)
  })
})

describe('bundle integration', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await fs.mkdtemp(`${os.tmpdir()}/bundle-test-`)
    await fs.mkdir(`${testDir}/src`, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should bundle single entry', async () => {
    await fs.writeFile(`${testDir}/src/index.js`, 'export const foo = 1')

    const result = await bundle({
      entry: 'src/index.js',
      outDir: 'dist',
      cwd: testDir,
    })

    expect(result.outputs).toHaveLength(1)
    expect(result.duration).toBeGreaterThan(0)
    expect(result.outputs[0].path).toBe('main.js')
  })

  it('should create output files', async () => {
    await fs.writeFile(`${testDir}/src/index.js`, 'export const foo = 1')

    const result = await bundle({
      entry: 'src/index.js',
      outDir: 'dist',
      cwd: testDir,
    })

    const outputContent = await fs.readFile(`${testDir}/dist/main.js`, 'utf-8')
    expect(outputContent).toContain('export const foo')
    })

  it('should handle multiple formats', async () => {
    await fs.writeFile(`${testDir}/src/index.js`, 'export const bar = 2')

    const result = await bundle({
      entry: 'src/index.js',
      outDir: 'dist',
      format: ['esm', 'cjs'],
      cwd: testDir,
    })

    expect(result.outputs.length).toBeGreaterThanOrEqual(2)
    const formats = result.outputs.map((o) => o.format)
    expect(formats).toContain('esm')
    expect(formats).toContain('cjs')
  })

  it('should handle imports', async () => {
    await fs.writeFile(`${testDir}/src/utils.js`, 'export const add = (a, b) => a + b')
    await fs.writeFile(
      `${testDir}/src/index.js`,
      `import { add } from './utils.js'
export const value = add(1, 1)`
    )

    const result = await bundle({
      entry: 'src/index.js',
      outDir: 'dist',
      cwd: testDir,
    })

    expect(result.outputs.length).toBeGreaterThan(0)
    expect(result.graph.modules.size).toBe(2)
  })

  it('should throw for non-existent entry', async () => {
    await expect(
      bundle({
        entry: 'src/non-existent.js',
        outDir: 'dist',
        cwd: testDir,
      })
    ).rejects.toThrow()
  })
})
