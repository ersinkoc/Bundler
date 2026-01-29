import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { bundle } from "../../src/index.js";

describe("Entry Module Export Preservation", () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await fs.mkdtemp(path.join(process.cwd(), "bundler-test-"));
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to cleanup test directory:", error);
    }
  });

  it("should preserve export statements in ESM format", async () => {
    await fs.mkdir(path.join(testDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "src", "index.js"),
      "export const foo = 1\nexport const bar = 2",
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      format: "esm",
    });

    const outputPath = path.join(testDir, "dist", "main.js");
    const outputContent = await fs.readFile(outputPath, "utf-8");

    expect(outputContent).toContain("export const foo");
    expect(outputContent).toContain("export const bar");
    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should preserve export statements in CJS format", async () => {
    await fs.mkdir(path.join(testDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "src", "index.js"),
      "export const foo = 1\nexport const bar = 2",
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      format: "cjs",
    });

    const outputPath = path.join(testDir, "dist", "main.js");
    const outputContent = await fs.readFile(outputPath, "utf-8");

    expect(outputContent).toContain("exports.foo = ");
    expect(outputContent).toContain("exports.bar = ");
    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should preserve export statements in IIFE format", async () => {
    await fs.mkdir(path.join(testDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "src", "index.js"),
      "export const foo = 1\nexport const bar = 2",
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      format: "iife",
      globalName: "MyBundle",
    });

    const outputPath = path.join(testDir, "dist", "main.js");
    const outputContent = await fs.readFile(outputPath, "utf-8");

    // IIFE should preserve export statements as-is in output
    expect(outputContent).toContain("export const foo");
    expect(outputContent).toContain("export const bar");
    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it("should not preserve exports for non-entry modules", async () => {
    await fs.mkdir(path.join(testDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "src", "utils.js"),
      "export const getValue = 42",
    );
    await fs.writeFile(
      path.join(testDir, "src", "index.js"),
      `import { getValue } from "./utils.js"
export const foo = getValue + 1`,
    );

    const result = await bundle({
      entry: "src/index.js",
      outDir: "dist",
      cwd: testDir,
      format: "esm",
    });

    const outputPath = path.join(testDir, "dist", "main.js");
    const outputContent = await fs.readFile(outputPath, "utf-8");

    expect(outputContent).not.toContain("export const getValue");
    expect(outputContent).toContain("export const foo");
    expect(result.outputs.length).toBeGreaterThan(0);
  });
});
