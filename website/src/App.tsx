import { Github, Package, Zap, TreeDeciduous, Layers, ArrowRight, FileCode, Settings, ChevronRight, Sparkles, Copy, Check, Menu, X, Clock, Box, Code2, Heart } from 'lucide-react'
import { CodeBlock } from '@oxog/codeshine/react'
import { useState } from 'react'

const installCmd = 'npm install @oxog/bundler'

const configCode = `import { defineConfig } from '@oxog/bundler'

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  treeshake: true,
  sourcemap: true,
})`

const cliCode = `# Bundle your project
npx oxog-bundler

# Watch mode
npx oxog-bundler --watch

# With custom config
npx oxog-bundler --config bundler.config.mjs`

const apiCode = `import { bundle } from '@oxog/bundler'

const result = await bundle({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  treeshake: true,
})

console.log(\`Built \${result.outputs.length} files\`)`

const pluginCode = `import { definePlugin } from '@oxog/bundler'

export const myPlugin = definePlugin({
  name: 'my-plugin',
  apply: (kernel) => {
    kernel.hooks.buildStart.tap('my-plugin', () => {
      console.log('Build started!')
    })

    kernel.hooks.buildEnd.tap('my-plugin', (ctx) => {
      console.log(\`Done in \${ctx.duration}ms\`)
    })
  },
})`

const treeshakeCode = `// Only used exports are included
import { usedFunction } from './utils'

// unusedFunction is removed from bundle
usedFunction()

// Result: 40% smaller bundle`

const codeSplitCode = `export default defineConfig({
  entry: 'src/index.ts',
  codeSplitting: {
    manualChunks: {
      vendor: ['lodash', 'axios'],
      utils: ['src/utils/**/*.ts'],
    },
  },
})`

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-zinc-400" />
      )}
    </button>
  )
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: typeof Zap
  title: string
  description: string
}) {
  return (
    <div className="feature-card">
      <div className="icon-container relative z-10">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 relative z-10">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed relative z-10">{description}</p>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color }: {
  icon: typeof Zap
  value: string
  label: string
  color: string
}) {
  return (
    <div className="text-center p-6">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">{value}</div>
      <div className="text-zinc-500 text-sm">{label}</div>
    </div>
  )
}

function Terminal({ children }: { children: React.ReactNode }) {
  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-3 text-sm text-zinc-500 font-mono">Terminal</span>
      </div>
      <div className="terminal-body font-mono text-sm">
        {children}
      </div>
    </div>
  )
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-0 right-0 w-64 h-full bg-zinc-900 border-l border-zinc-800 p-6 animate-slide-in">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <nav className="flex flex-col gap-4 mt-12">
          <a href="#features" onClick={onClose} className="text-zinc-300 hover:text-white py-2 border-b border-zinc-800">Features</a>
          <a href="#quickstart" onClick={onClose} className="text-zinc-300 hover:text-white py-2 border-b border-zinc-800">Quick Start</a>
          <a href="#api" onClick={onClose} className="text-zinc-300 hover:text-white py-2 border-b border-zinc-800">API</a>
          <a href="#plugins" onClick={onClose} className="text-zinc-300 hover:text-white py-2 border-b border-zinc-800">Plugins</a>
          <a
            href="https://github.com/ersinkoc/Bundler"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-300 hover:text-white py-2"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </nav>
      </div>
    </div>
  )
}

function ComparisonTable() {
  const features = [
    { name: 'Zero Dependencies', oxog: true, webpack: false, rollup: false, esbuild: true },
    { name: 'TypeScript Native', oxog: true, webpack: false, rollup: false, esbuild: true },
    { name: 'Tree Shaking', oxog: true, webpack: true, rollup: true, esbuild: true },
    { name: 'Code Splitting', oxog: true, webpack: true, rollup: true, esbuild: true },
    { name: 'Zero Config', oxog: true, webpack: false, rollup: false, esbuild: true },
    { name: 'Plugin System', oxog: true, webpack: true, rollup: true, esbuild: true },
    { name: 'Watch Mode', oxog: true, webpack: true, rollup: true, esbuild: true },
    { name: 'Source Maps', oxog: true, webpack: true, rollup: true, esbuild: true },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
            <th className="text-center py-4 px-4">
              <span className="text-indigo-400 font-semibold">@oxog/bundler</span>
            </th>
            <th className="text-center py-4 px-4 text-zinc-500">Webpack</th>
            <th className="text-center py-4 px-4 text-zinc-500">Rollup</th>
            <th className="text-center py-4 px-4 text-zinc-500">esbuild</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
              <td className="py-4 px-4 text-zinc-300">{feature.name}</td>
              <td className="text-center py-4 px-4">
                {feature.oxog ? (
                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-zinc-600 mx-auto" />
                )}
              </td>
              <td className="text-center py-4 px-4">
                {feature.webpack ? (
                  <Check className="w-5 h-5 text-zinc-500 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-zinc-600 mx-auto" />
                )}
              </td>
              <td className="text-center py-4 px-4">
                {feature.rollup ? (
                  <Check className="w-5 h-5 text-zinc-500 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-zinc-600 mx-auto" />
                )}
              </td>
              <td className="text-center py-4 px-4">
                {feature.esbuild ? (
                  <Check className="w-5 h-5 text-zinc-500 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-zinc-600 mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="nav">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">@oxog/bundler</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="nav-link">Features</a>
            <a href="#quickstart" className="nav-link">Quick Start</a>
            <a href="#api" className="nav-link">API</a>
            <a href="#plugins" className="nav-link">Plugins</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ersinkoc/Bundler"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary !py-2 !px-4 hidden sm:flex"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-zinc-400 hover:text-white md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Hero */}
      <section className="hero-bg min-h-[90vh] flex items-center justify-center px-6 relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="pill mb-8 fade-in">
            <div className="pulse-dot" />
            <span>v1.0.0 Released</span>
            <ChevronRight className="w-4 h-4" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight fade-in fade-in-delay-1">
            Zero-Config
            <br />
            <span className="gradient-text">JavaScript Bundler</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed fade-in fade-in-delay-2">
            Fast, lightweight bundler with tree shaking, code splitting,
            and ESM/CJS/IIFE output. Built with TypeScript.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in fade-in-delay-3">
            <a href="#quickstart" className="btn-primary w-full sm:w-auto justify-center">
              <Sparkles className="w-4 h-4" />
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="flex items-center gap-2 px-5 py-3 rounded-xl glass font-mono text-sm w-full sm:w-auto justify-center">
              <span className="text-zinc-500">$</span>
              <span className="text-zinc-300">{installCmd}</span>
              <CopyButton text={installCmd} />
            </div>
          </div>

          <div className="mt-16 fade-in fade-in-delay-4">
            <Terminal>
              <div className="text-green-400">$ npx oxog-bundler</div>
              <div className="mt-2 text-zinc-500">
                <span className="text-indigo-400">@oxog/bundler</span> v1.0.0
              </div>
              <div className="text-zinc-400 mt-1">
                <span className="text-emerald-400">✓</span> Built 3 files in <span className="text-yellow-400">42ms</span>
              </div>
              <div className="text-zinc-500 mt-1">
                └─ dist/index.js <span className="text-zinc-600">(12.4 KB)</span>
              </div>
              <div className="text-zinc-500">
                └─ dist/index.cjs <span className="text-zinc-600">(12.8 KB)</span>
              </div>
              <div className="text-zinc-500">
                └─ dist/index.d.ts <span className="text-zinc-600">(2.1 KB)</span>
              </div>
            </Terminal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Clock} value="<50ms" label="Average Build" color="bg-gradient-to-br from-emerald-500 to-teal-600" />
            <StatCard icon={Box} value="0" label="Dependencies" color="bg-gradient-to-br from-indigo-500 to-purple-600" />
            <StatCard icon={Code2} value="100%" label="TypeScript" color="bg-gradient-to-br from-blue-500 to-cyan-600" />
            <StatCard icon={TreeDeciduous} value="40%" label="Smaller Bundles" color="bg-gradient-to-br from-orange-500 to-red-600" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why <span className="gradient-text">@oxog/bundler</span>?
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Everything you need to bundle modern JavaScript applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              description="Split your code into chunks with manual chunk configuration for optimal loading."
            />
            <FeatureCard
              icon={FileCode}
              title="Multiple Formats"
              description="Output ESM, CommonJS, or IIFE formats. Build libraries or applications with ease."
            />
            <FeatureCard
              icon={Settings}
              title="Zero Config"
              description="Works out of the box with sensible defaults. Add configuration only when needed."
            />
            <FeatureCard
              icon={Package}
              title="Plugin System"
              description="Extend functionality with a powerful plugin API using hooks for complete control."
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section section-alt">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Compare</h2>
            <p className="text-zinc-400 text-lg">
              See how @oxog/bundler stacks up against other bundlers
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quickstart" className="section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Start</h2>
            <p className="text-zinc-400 text-lg">Get up and running in seconds</p>
          </div>

          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold text-sm">1</div>
                <h3 className="text-lg font-medium">Install the package</h3>
              </div>
              <CodeBlock
                code={installCmd}
                language="bash"
                theme="github-dark"
                copyButton
                className="codeshine-container"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold text-sm">2</div>
                <h3 className="text-lg font-medium">Create a config <span className="text-zinc-500 font-normal">(optional)</span></h3>
              </div>
              <CodeBlock
                code={configCode}
                language="typescript"
                theme="github-dark"
                lineNumbers
                copyButton
                filename="bundler.config.mjs"
                className="codeshine-container"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold text-sm">3</div>
                <h3 className="text-lg font-medium">Bundle your project</h3>
              </div>
              <CodeBlock
                code={cliCode}
                language="bash"
                theme="github-dark"
                copyButton
                className="codeshine-container"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tree Shaking */}
      <section className="section section-alt">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="pill mb-6">
                <TreeDeciduous className="w-4 h-4 text-emerald-400" />
                <span>Tree Shaking</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ship only what you use
              </h2>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                Our advanced tree shaking algorithm analyzes your code and removes
                all unused exports, reducing bundle size by up to 40%.
              </p>
              <ul className="space-y-3">
                {['Dead code elimination', 'Side-effect detection', 'Pure function marking'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <CodeBlock
                code={treeshakeCode}
                language="typescript"
                theme="github-dark"
                lineNumbers
                copyButton
                highlightLines={[2, 5, 7]}
                className="codeshine-container"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Code Splitting */}
      <section className="section">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <CodeBlock
                code={codeSplitCode}
                language="typescript"
                theme="github-dark"
                lineNumbers
                copyButton
                highlightLines={[3, 4, 5, 6, 7]}
                className="codeshine-container"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="pill mb-6">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Code Splitting</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Optimize loading performance
              </h2>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                Split your code into separate chunks for optimal loading.
                Configure manual chunks to group dependencies strategically.
              </p>
              <ul className="space-y-3">
                {['Manual chunk configuration', 'Vendor code separation', 'Dynamic imports support'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-blue-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* API */}
      <section id="api" className="section section-alt">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Programmatic API</h2>
            <p className="text-zinc-400 text-lg">
              Use the bundler programmatically in your Node.js applications
            </p>
          </div>

          <CodeBlock
            code={apiCode}
            language="typescript"
            theme="github-dark"
            lineNumbers
            copyButton
            filename="build.mjs"
            className="codeshine-container"
          />
        </div>
      </section>

      {/* Plugins */}
      <section id="plugins" className="section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Plugin System</h2>
            <p className="text-zinc-400 text-lg">
              Extend the bundler with custom plugins using lifecycle hooks
            </p>
          </div>

          <CodeBlock
            code={pluginCode}
            language="typescript"
            theme="github-dark"
            lineNumbers
            copyButton
            filename="my-plugin.ts"
            className="codeshine-container"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="section section-alt">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20" />
            <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-xl" />
            <div className="relative px-8 py-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Bundle?</h2>
              <p className="text-zinc-400 text-lg mb-8">
                Start building faster with @oxog/bundler today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://github.com/ersinkoc/Bundler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary justify-center"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/@oxog/bundler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary justify-center"
                >
                  <Package className="w-4 h-4" />
                  View on npm
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">@oxog/bundler</div>
                <div className="text-zinc-500 text-sm">Zero-Config JavaScript Bundler</div>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <a href="https://github.com/ersinkoc/Bundler" className="text-zinc-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://www.npmjs.com/package/@oxog/bundler" className="text-zinc-400 hover:text-white transition-colors">
                npm
              </a>
              <a href="https://github.com/ersinkoc/Bundler/issues" className="text-zinc-400 hover:text-white transition-colors">
                Issues
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> by Ersin KOC
            </div>
            <div>MIT License</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
