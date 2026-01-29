import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
}

export function CodeBlock({ code, language = 'typescript', showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split('\n')

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#1e1e2e] border border-zinc-800">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-700">
        <span className="text-xs text-zinc-500 font-mono">{language}</span>
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono">
            {lines.map((line, i) => (
              <div key={i} className="table-row">
                {showLineNumbers && (
                  <span className="table-cell pr-4 text-zinc-600 select-none text-right w-8">
                    {i + 1}
                  </span>
                )}
                <span className="table-cell text-zinc-300">
                  {highlightLine(line, language)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

function highlightLine(line: string, _language: string): React.ReactNode {
  // Simple syntax highlighting
  const keywords = ['import', 'export', 'from', 'const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'default', 'class', 'extends', 'new', 'throw', 'try', 'catch']
  const builtins = ['console', 'require', 'module', 'process', 'npm', 'npx']

  let result = line

  // Highlight strings
  result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="text-emerald-400">$&</span>')

  // Highlight comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
    return <span className="text-zinc-500 italic">{line}</span>
  }

  // Highlight keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
    result = result.replace(regex, '<span class="text-purple-400">$1</span>')
  })

  // Highlight builtins
  builtins.forEach(builtin => {
    const regex = new RegExp(`\\b(${builtin})\\b`, 'g')
    result = result.replace(regex, '<span class="text-blue-400">$1</span>')
  })

  // Highlight numbers
  result = result.replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>')

  return <span dangerouslySetInnerHTML={{ __html: result }} />
}

export default CodeBlock
