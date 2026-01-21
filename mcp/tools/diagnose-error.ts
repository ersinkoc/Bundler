import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export const diagnoseError: Tool = {
  name: 'diagnose-error',
  description: 'Analyze build errors and suggest fixes',
  inputSchema: {
    type: 'object',
    properties: {
      errorMessage: {
        type: 'string',
        description: 'Error message from build',
      },
      errorCode: {
        type: 'string',
        description: 'Error code if available',
      },
    },
  },
}

export async function handleDiagnoseError(args: any): Promise<string> {
  const { errorMessage, errorCode } = args

  const solutions: Record<string, string[]> = {
    'ENTRY_NOT_FOUND': [
      'Check if the entry file path is correct',
      'Ensure the file exists in the specified location',
      'Use an absolute path or a path relative to the project root',
    ],
    'PARSE_ERROR': [
      'Check the syntax of your source files',
      'Ensure all imports are properly formatted',
      'Verify that TypeScript files are valid if using TS',
    ],
    'RESOLVE_ERROR': [
      'Check if the imported package is installed',
      'Verify the import path spelling',
      'Check if the module is in node_modules or external',
    ],
    'CIRCULAR_DEP': [
      'Refactor your imports to break the cycle',
      'Use lazy loading or dynamic imports',
      'Extract common code into a separate module',
    ],
  }

  const suggestions = errorCode
    ? solutions[errorCode] || ['Check the error details and consult documentation']
    : ['Check the error message and try to identify the issue']

  return JSON.stringify({ diagnosis: suggestions }, null, 2)
}
