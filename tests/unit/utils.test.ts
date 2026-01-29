import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fsUtils, FS } from "../../src/utils/fs.js";
import { pathUtils, PathUtils } from "../../src/utils/path.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

describe("PathUtils", () => {
  it("should be exported as singleton", () => {
    expect(pathUtils).toBeInstanceOf(PathUtils);
  });

  describe("join", () => {
    it("should join paths", () => {
      const result = pathUtils.join("a", "b", "c");
      expect(result).toContain("a");
      expect(result).toContain("b");
      expect(result).toContain("c");
    });
  });

  describe("dirname", () => {
    it("should get directory name", () => {
      const result = pathUtils.dirname("/foo/bar/baz.js");
      expect(result).toContain("bar");
    });
  });

  describe("basename", () => {
    it("should get base name", () => {
      const result = pathUtils.basename("/foo/bar/baz.js");
      expect(result).toBe("baz.js");
    });

    it("should get base name without extension", () => {
      const result = pathUtils.basename("/foo/bar/baz.js", ".js");
      expect(result).toBe("baz");
    });
  });

  describe("relative", () => {
    it("should get relative path", () => {
      const from = "/foo/bar";
      const to = "/foo/baz/qux";
      const result = pathUtils.relative(from, to);
      expect(result).toContain("baz");
    });
  });

  describe("normalize", () => {
    it("should normalize path", () => {
      const result = pathUtils.normalize("/foo/bar/../baz");
      expect(result).toContain("baz");
      expect(result).not.toContain("..");
    });
  });

  describe("resolve", () => {
    it("should resolve paths", () => {
      const result = pathUtils.resolve("/foo", "bar", "baz");
      expect(result).toContain("foo");
      expect(result).toContain("baz");
    });
  });

  describe("extname", () => {
    it("should get extension", () => {
      expect(pathUtils.extname("file.js")).toBe(".js");
      expect(pathUtils.extname("file.min.js")).toBe(".js");
      expect(pathUtils.extname("file")).toBe("");
    });
  });

  describe("isAbsolute", () => {
    it("should detect absolute paths", () => {
      expect(pathUtils.isAbsolute("/foo/bar")).toBe(true);
      expect(pathUtils.isAbsolute("./foo")).toBe(false);
      expect(pathUtils.isAbsolute("foo")).toBe(false);
    });

    it("should detect Windows absolute paths", () => {
      expect(pathUtils.isAbsolute("C:\\foo")).toBe(true);
    });
  });

  describe("parse", () => {
    it("should parse path", () => {
      const result = pathUtils.parse("/foo/bar/baz.js");
      expect(result.base).toBe("baz.js");
      expect(result.ext).toBe(".js");
      expect(result.name).toBe("baz");
    });
  });

  describe("format", () => {
    it("should format path object", () => {
      const result = pathUtils.format({
        root: "/",
        dir: "/foo/bar",
        base: "baz.js",
        ext: ".js",
        name: "baz"
      });
      expect(result).toContain("baz.js");
    });
  });

  describe("sep", () => {
    it("should have separator", () => {
      expect(pathUtils.sep).toBeDefined();
      expect(typeof pathUtils.sep).toBe("string");
    });
  });
});

describe("FS", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(`${os.tmpdir()}/fs-test-`);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should be exported as singleton", () => {
    expect(fsUtils).toBeInstanceOf(FS);
  });

  describe("readFile", () => {
    it("should read file content", async () => {
      await fs.writeFile(`${testDir}/test.txt`, "hello world");
      const content = await fsUtils.readFile(`${testDir}/test.txt`);
      expect(content).toBe("hello world");
    });
  });

  describe("readFileBuffer", () => {
    it("should read file as buffer", async () => {
      await fs.writeFile(`${testDir}/test.bin`, Buffer.from([1, 2, 3]));
      const buffer = await fsUtils.readFileBuffer(`${testDir}/test.bin`);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(1);
      expect(buffer[1]).toBe(2);
      expect(buffer[2]).toBe(3);
    });
  });

  describe("writeFile", () => {
    it("should write string content", async () => {
      await fsUtils.writeFile(`${testDir}/out.txt`, "content");
      const content = await fs.readFile(`${testDir}/out.txt`, "utf-8");
      expect(content).toBe("content");
    });

    it("should write buffer content", async () => {
      await fsUtils.writeFile(`${testDir}/out.bin`, Buffer.from([4, 5, 6]));
      const buffer = await fs.readFile(`${testDir}/out.bin`);
      expect(buffer[0]).toBe(4);
    });

    it("should write Uint8Array content", async () => {
      await fsUtils.writeFile(`${testDir}/out.bin`, new Uint8Array([7, 8, 9]));
      const buffer = await fs.readFile(`${testDir}/out.bin`);
      expect(buffer[0]).toBe(7);
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      await fs.writeFile(`${testDir}/exists.txt`, "");
      const exists = await fsUtils.exists(`${testDir}/exists.txt`);
      expect(exists).toBe(true);
    });

    it("should return false for non-existing file", async () => {
      const exists = await fsUtils.exists(`${testDir}/not-exists.txt`);
      expect(exists).toBe(false);
    });
  });

  describe("isFile", () => {
    it("should return true for file", async () => {
      await fs.writeFile(`${testDir}/file.txt`, "");
      expect(fsUtils.isFile(`${testDir}/file.txt`)).toBe(true);
    });

    it("should return false for directory", async () => {
      await fs.mkdir(`${testDir}/dir`);
      expect(fsUtils.isFile(`${testDir}/dir`)).toBe(false);
    });

    it("should return false for non-existing path", () => {
      expect(fsUtils.isFile(`${testDir}/not-exists`)).toBe(false);
    });
  });

  describe("isDirectory", () => {
    it("should return true for directory", async () => {
      await fs.mkdir(`${testDir}/dir`);
      expect(fsUtils.isDirectory(`${testDir}/dir`)).toBe(true);
    });

    it("should return false for file", async () => {
      await fs.writeFile(`${testDir}/file.txt`, "");
      expect(fsUtils.isDirectory(`${testDir}/file.txt`)).toBe(false);
    });

    it("should return false for non-existing path", () => {
      expect(fsUtils.isDirectory(`${testDir}/not-exists`)).toBe(false);
    });
  });

  describe("mkdir", () => {
    it("should create directory", async () => {
      await fsUtils.mkdir(`${testDir}/new-dir`);
      const stat = await fs.stat(`${testDir}/new-dir`);
      expect(stat.isDirectory()).toBe(true);
    });

    it("should create nested directories", async () => {
      await fsUtils.mkdir(`${testDir}/a/b/c`);
      const stat = await fs.stat(`${testDir}/a/b/c`);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe("readDir", () => {
    it("should read directory contents", async () => {
      await fs.writeFile(`${testDir}/file1.txt`, "");
      await fs.writeFile(`${testDir}/file2.txt`, "");

      const entries = await fsUtils.readDir(testDir);
      expect(entries).toContain("file1.txt");
      expect(entries).toContain("file2.txt");
    });

    it("should filter hidden files", async () => {
      await fs.writeFile(`${testDir}/visible.txt`, "");
      await fs.writeFile(`${testDir}/.hidden`, "");

      const entries = await fsUtils.readDir(testDir);
      expect(entries).toContain("visible.txt");
      expect(entries).not.toContain(".hidden");
    });
  });

  describe("stat", () => {
    it("should return file stats", async () => {
      await fs.writeFile(`${testDir}/file.txt`, "content");
      const stats = await fsUtils.stat(`${testDir}/file.txt`);

      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.mtime).toBeInstanceOf(Date);
    });

    it("should return directory stats", async () => {
      await fs.mkdir(`${testDir}/dir`);
      const stats = await fsUtils.stat(`${testDir}/dir`);

      expect(stats.isFile()).toBe(false);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe("copyFile", () => {
    it("should copy file", async () => {
      await fs.writeFile(`${testDir}/source.txt`, "original");
      await fsUtils.copyFile(`${testDir}/source.txt`, `${testDir}/dest.txt`);

      const content = await fs.readFile(`${testDir}/dest.txt`, "utf-8");
      expect(content).toBe("original");
    });
  });

  describe("unlink", () => {
    it("should delete file", async () => {
      await fs.writeFile(`${testDir}/to-delete.txt`, "");
      await fsUtils.unlink(`${testDir}/to-delete.txt`);

      const exists = await fsUtils.exists(`${testDir}/to-delete.txt`);
      expect(exists).toBe(false);
    });
  });

  describe("rm", () => {
    it("should remove file", async () => {
      await fs.writeFile(`${testDir}/file.txt`, "");
      await fsUtils.rm(`${testDir}/file.txt`);

      const exists = await fsUtils.exists(`${testDir}/file.txt`);
      expect(exists).toBe(false);
    });

    it("should remove directory recursively", async () => {
      await fs.mkdir(`${testDir}/dir/subdir`, { recursive: true });
      await fs.writeFile(`${testDir}/dir/subdir/file.txt`, "");
      await fsUtils.rm(`${testDir}/dir`);

      const exists = await fsUtils.exists(`${testDir}/dir`);
      expect(exists).toBe(false);
    });
  });
});
