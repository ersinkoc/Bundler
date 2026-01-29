import { Github, Package, Zap, TreeDeciduous, Layers, ArrowRight, Terminal, FileCode, Settings, ExternalLink } from 'lucide-react'
import { CodeBlock } from '@oxog/codeshine/react'

const installCode = `npm install @oxog/bundler`

const configCode = `// bundler.config.mjs
import { defineConfig } from '@oxog/bundler'

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  treeshake: true,
  sourcemap: true,
})`

const cliCode = `# Bundle your project
npx oxog-bundler

# Watch mode for development
npx oxog-bundler --watch

# Custom config file
npx oxog-bundler --config bundler.config.mjs`

const apiCode = `import { bundle } from '@oxog/bundler'

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
    kernel.hooks.buildStart.tap('my-plugin', (ctx) => {
      console.log('Build started!')
    })

    kernel.hooks.buildEnd.tap('my-plugin', (ctx) => {
      console.log(\`Built in \${ctx.duration}ms\`)
    })
  },
})`

const codeSplittingCode = `export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  codeSplitting: {
    manualChunks: {
      vendor: ['lodash', 'axios'],
      utils: ['src/utils/**/*.ts'],
    },
  },
})`

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Zap; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/50 transition-all">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function Section({ id, children, className = '' }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-20 px-6 ${className}`}>
      <div className="max-w-5xl mx-auto">
        {children}
      </div>
    </section>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h2>
      <p className="text-zinc-400 max-w-xl mx-auto">{description}</p>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">@oxog/bundler</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#quickstart" className="text-zinc-400 hover:text-white transition-colors">Quick Start</a>
            <a href="#api" className="text-zinc-400 hover:text-white transition-colors">API</a>
            <a href="#plugins" className="text-zinc-400 hover:text-white transition-colors">Plugins</a>
          </nav>
          <a
            href="https://github.com/ersinkoc/Bundler"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors text-sm"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <Section className="pt-24 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-6 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300">v1.0.0</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            Zero-Config JavaScript
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Bundler</span>
          </h1>

          <p className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
            Fast, lightweight bundler with tree shaking, code splitting, and ESM/CJS/IIFE output. Built with TypeScript.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 font-mono text-sm">
              <Terminal className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-300">{installCode}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section id="features">
        <SectionHeader
          title="Why @oxog/bundler?"
          description="Everything you need to bundle modern JavaScript, without the complexity."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={Zap}
            title="Lightning Fast"
            description="Optimized for speed with efficient parsing and minimal overhead."
          />
          <FeatureCard
            icon={TreeDeciduous}
            title="Tree Shaking"
            description="Automatically removes unused code to keep bundles lean."
          />
          <FeatureCard
            icon={Layers}
            title="Code Splitting"
            description="Split code into chunks with manual chunk configuration."
          />
          <FeatureCard
            icon={FileCode}
            title="Multiple Formats"
            description="Output ESM, CommonJS, or IIFE formats for any target."
          />
          <FeatureCard
            icon={Settings}
            title="Zero Config"
            description="Works out of the box with sensible defaults."
          />
          <FeatureCard
            icon={Package}
            title="Plugin System"
            description="Extend with custom plugins using the hook-based API."
          />
        </div>
      </Section>

      {/* Quick Start */}
      <Section id="quickstart" className="bg-zinc-900/30">
        <SectionHeader
          title="Quick Start"
          description="Get up and running in seconds."
        />
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">1. Install</h3>
            <CodeBlock
              code={installCode}
              language="bash"
              theme="github-dark"
              copyButton
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">2. Configure (Optional)</h3>
            <CodeBlock
              code={configCode}
              language="typescript"
              theme="github-dark"
              lineNumbers
              copyButton
              filename="bundler.config.mjs"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">3. Bundle</h3>
            <CodeBlock
              code={cliCode}
              language="bash"
              theme="github-dark"
              copyButton
            />
          </div>
        </div>
      </Section>

      {/* API */}
      <Section id="api">
        <SectionHeader
          title="Programmatic API"
          description="Use the bundler programmatically in your Node.js applications."
        />
        <CodeBlock
          code={apiCode}
          language="typescript"
          theme="github-dark"
          lineNumbers
          copyButton
          filename="build.mjs"
        />
      </Section>

      {/* Code Splitting */}
      <Section className="bg-zinc-900/30">
        <SectionHeader
          title="Code Splitting"
          description="Split your bundle into separate chunks for optimal loading."
        />
        <CodeBlock
          code={codeSplittingCode}
          language="typescript"
          theme="github-dark"
          lineNumbers
          copyButton
          highlightLines={[6, 7, 8, 9]}
        />
      </Section>

      {/* Plugins */}
      <Section id="plugins">
        <SectionHeader
          title="Plugin System"
          description="Extend the bundler with custom plugins using lifecycle hooks."
        />
        <CodeBlock
          code={pluginCode}
          language="typescript"
          theme="github-dark"
          lineNumbers
          copyButton
          filename="my-plugin.ts"
        />
      </Section>

      {/* CTA */}
      <Section className="bg-gradient-to-b from-zinc-900/50 to-zinc-950">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Bundle?</h2>
          <p className="text-zinc-400 mb-6">Start building faster with @oxog/bundler.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://github.com/ersinkoc/Bundler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
            <a
              href="https://www.npmjs.com/package/@oxog/bundler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-600 text-zinc-300 font-medium transition-colors"
            >
              <Package className="w-4 h-4" />
              View on npm
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>@oxog/bundler</span>
          </div>
          <div>MIT License</div>
        </div>
      </footer>
    </div>
  )
}
