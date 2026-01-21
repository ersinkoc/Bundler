import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  generateConfig,
  diagnoseError,
  analyzeBundle,
  suggestSplitting,
  migrateFrom,
} from './tools/index.js'

const server = new Server(
  {
    name: '@oxog/bundler-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {}
  }
)

server.setRequestHandler(generateConfig)
server.setRequestHandler(diagnoseError)
server.setRequestHandler(analyzeBundle)
server.setRequestHandler(suggestSplitting)
server.setRequestHandler(migrateFrom)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
