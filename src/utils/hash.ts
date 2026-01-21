import * as crypto from "node:crypto";

export class HashUtils {
  hash(content: string): string {
    if (content.length === 0) return "0";

    const hash = crypto.createHash("sha256");
    hash.update(content);
    return hash.digest("hex").substring(0, 12);
  }

  hashNumber(num: number): string {
    return this.hash(num.toString());
  }

  hashFile(content: string | Buffer): string {
    if (typeof content === "string") {
      return this.hash(content);
    }
    const hash = crypto.createHash("sha256");
    hash.update(content);
    return hash.digest("hex").substring(0, 12);
  }
}

export const hashUtils = new HashUtils();
