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

// Only run the main function when this file is executed directly
if (require.main === module) {
  main();
}

export default LaTeXMCPServer;
