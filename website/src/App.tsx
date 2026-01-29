import { useState } from 'react'
import { Github, Package, Zap, TreeDeciduous, Layers, ArrowRight, Copy, Check, Terminal, FileCode, Settings } from 'lucide-react'
import { CodeBlock } from './components/CodeBlock'

const installCode = `npm install @oxog/bundler`

const quickStartCode = `// bundler.config.mjs
import { defineConfig } from '@oxog/bundler'

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  treeshake: true,
})`

const cliUsageCode = `# Bundle your project
npx oxog-bundler

# Or with custom config
npx oxog-bundler --config bundler.config.mjs

# Watch mode
npx oxog-bundler --watch`

const apiUsageCode = `import { bundle } from '@oxog/bundler'

const result = await bundle({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  treeshake: true,
})

console.log(\`Built \${result.outputs.length} files in \${result.duration}ms\`)`

const pluginCode = `import { definePlugin } from '@oxog/bundler'

export const myPlugin = definePlugin({
  name: 'my-plugin',
  apply: (kernel) => {
    kernel.hooks.buildStart.tap('my-plugin', (context) => {
      console.log('Build started!')
    })
  },
})`

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
    </button>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Zap; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900/80">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
        <Icon className="w-6 h-6 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function CodeSection({ title, description, code, language = 'typescript' }: { title: string; description: string; code: string; language?: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-zinc-400">{description}</p>
      </div>
      <CodeBlock
        code={code}
        language={language}
        showLineNumbers
      />
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
    >
      {children}
    </a>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">@oxog/bundler</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#quickstart">Quick Start</NavLink>
            <NavLink href="#api">API</NavLink>
            <NavLink href="#plugins">Plugins</NavLink>
          </nav>
          <a
            href="https://github.com/nicholasoxog/bundler"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-zinc-300">v1.0.0 Released</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Zero-Config JavaScript
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Bundler</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Fast, lightweight bundler with tree shaking, code splitting, and ESM/CJS/IIFE output formats.
            Built with TypeScript for modern JavaScript projects.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#quickstart"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <div className="relative group">
              <code className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-sm">
                <Terminal className="w-4 h-4 text-zinc-500" />
                {installCode}
              </code>
              <CopyButton text={installCode} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why @oxog/bundler?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Everything you need to bundle modern JavaScript applications, without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Optimized for speed with efficient parsing and minimal overhead. Bundle your projects in milliseconds."
            />
            <FeatureCard
              icon={TreeDeciduous}
              title="Tree Shaking"
              description="Automatically removes unused code to keep your bundles lean and optimize load times."
            />
            <FeatureCard
              icon={Layers}
              title="Code Splitting"
              description="Split your code into chunks with manual chunk configuration for optimal loading strategies."
            />
            <FeatureCard
              icon={FileCode}
              title="Multiple Formats"
              description="Output ESM, CommonJS, or IIFE formats. Build libraries or applications with ease."
            />
            <FeatureCard
              icon={Settings}
              title="Zero Config"
              description="Works out of the box with sensible defaults. Add configuration only when you need it."
            />
            <FeatureCard
              icon={Package}
              title="Plugin System"
              description="Extend functionality with a powerful plugin API using hooks for complete control."
            />
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quickstart" className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Quick Start</h2>
            <p className="text-zinc-400">Get up and running in under a minute.</p>
          </div>

          <div className="space-y-12">
            <CodeSection
              title="1. Install"
              description="Add @oxog/bundler to your project."
              code={installCode}
              language="bash"
            />
            <CodeSection
              title="2. Configure (Optional)"
              description="Create a configuration file for custom settings."
              code={quickStartCode}
              language="typescript"
            />
            <CodeSection
              title="3. Bundle"
              description="Run the bundler via CLI or watch mode for development."
              code={cliUsageCode}
              language="bash"
            />
          </div>
        </div>
      </section>

      {/* API */}
      <section id="api" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Programmatic API</h2>
            <p className="text-zinc-400">Use the bundler programmatically in your Node.js applications.</p>
          </div>

          <CodeSection
            title="bundle()"
            description="Bundle your project programmatically with full control over the configuration."
            code={apiUsageCode}
            language="typescript"
          />
        </div>
      </section>

      {/* Plugins */}
      <section id="plugins" className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Plugin System</h2>
            <p className="text-zinc-400">Extend the bundler with custom plugins using the hook-based API.</p>
          </div>

          <CodeSection
            title="Create a Plugin"
            description="Plugins can tap into various build lifecycle hooks."
            code={pluginCode}
            language="typescript"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Bundle?</h2>
          <p className="text-zinc-400 mb-8">Start building faster with @oxog/bundler today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/nicholasoxog/bundler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@oxog/bundler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 hover:border-zinc-600 text-zinc-300 font-medium transition-colors"
            >
              <Package className="w-4 h-4" />
              View on npm
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Package className="w-4 h-4" />
            <span>@oxog/bundler</span>
          </div>
          <div className="text-zinc-500 text-sm">
            Built with TypeScript. MIT License.
          </div>
        </div>
      </footer>
    </div>
  )
}
