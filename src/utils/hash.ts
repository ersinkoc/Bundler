export class HashUtils {
  hash(content: string): string {
    let hash = 0
    if (content.length === 0) return '0'

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }

    return Math.abs(hash).toString(36)
  }

  hashNumber(num: number): string {
    return this.hash(num.toString())
  }
}

export const hashUtils = new HashUtils()
