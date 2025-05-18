import dotenv from 'dotenv';
import LaTeXMCPServer from './core/server';
import { configureSpeculativePhilosophyExtension } from './extensions/speculative-philosophy';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Create server instance
    const server = new LaTeXMCPServer();
    
    // Load extensions - passing the raw MCP server instance
    await configureSpeculativePhilosophyExtension(server.getMCPServer());
    
    // Start the server
    await server.start();
    
    console.log(`Claude-LaTeX MCP Server running at http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
import { ToolDefinition, ExecuteToolResponseSchema } from '@anthropic-ai/mcp-typescript-sdk';
import { generateEquation } from './extensions/equation/equation-generator';

// Define the tool
const EquationTool: ToolDefinition = {
  name: 'generate-latex-equation',
  description: 'Converts natural language descriptions into properly formatted LaTeX equations',
  parameters: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Natural language description of the equation to generate',
      },
      format: {
        type: 'string',
        enum: ['inline', 'display', 'align', 'gather', 'multline'],
        description: 'LaTeX environment to use for the equation',
        default: 'display',
      },
      numbered: {
        type: 'boolean',
        description: 'Whether the equation should be numbered',
        default: false,
      },
      additionalContext: {
        type: 'string',
        description: 'Additional context to help with equation generation',
      },
    },
    required: ['description'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the equation',
      },
      preview: {
        type: 'string',
        description: 'Plain text preview of how the equation might render',
      },
      explanation: {
        type: 'string',
        description: 'Explanation of the equation',
      },
    },
  },
};

// Handler function
async function handler(params: any): Promise<ExecuteToolResponseSchema> {
  return generateEquation({ ...params, model: process.env.CLAUDE_MODEL });
}

// Export the equation generation tool and handler
export const equationTool = {
  toolDefinition: EquationTool,
  handler,
};
// Only run the main function when this file is executed directly
if (require.main === module) {
  main();
}

export default LaTeXMCPServer;
