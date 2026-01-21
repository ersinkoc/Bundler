import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";

export interface FileStats {
  size: number;
  mtime: Date;
  isFile(): boolean;
  isDirectory(): boolean;
}

class Stats implements FileStats {
  constructor(private _stats: fsSync.Stats) {}

  get size(): number {
    return this._stats.size;
  }

  get mtime(): Date {
    return this._stats.mtime;
  }

  isFile(): boolean {
    return this._stats.isFile();
  }

  isDirectory(): boolean {
    return this._stats.isDirectory();
  }
}

export class FS {
  async readFile(path: string): Promise<string> {
    return await fs.readFile(path, "utf-8");
  }

  async readFileBuffer(path: string): Promise<Uint8Array> {
    const buffer = await fs.readFile(path);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  async writeFile(
    path: string,
    content: string | Uint8Array | Buffer,
  ): Promise<void> {
    await fs.writeFile(path, content);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  isFile(path: string): boolean {
    try {
      const stat = fsSync.statSync(path);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  isDirectory(path: string): boolean {
    try {
      const stat = fsSync.statSync(path);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async mkdir(path: string): Promise<void> {
    await fs.mkdir(path, { recursive: true });
  }

  async readDir(path: string): Promise<string[]> {
    const entries = await fs.readdir(path, { withFileTypes: true });
    return entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => entry.name);
  }

  async stat(path: string): Promise<FileStats> {
    const stats = await fs.stat(path);
    return new Stats(stats);
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await fs.copyFile(src, dest);
  }

  async unlink(path: string): Promise<void> {
    await fs.unlink(path);
  }

  async rm(path: string): Promise<void> {
    await fs.rm(path, { recursive: true, force: true });
  }
}

export const fsUtils = new FS();
