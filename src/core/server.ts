// Claude-LaTeX MCP Integration - Core Server Implementation
// src/core/server.ts

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { 
  MCPServer, 
  ListToolsRequestSchema,
  ExecuteToolRequestSchema,
  ExecuteToolResponseSchema,
  ToolDefinition,
  MCPRequest,
  MCPResponse
} from '@anthropic-ai/mcp-typescript-sdk';
import { Claude } from '@anthropic/sdk';
import dotenv from 'dotenv';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();
fs.mkdirSync('logs', { recursive: true });

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

/**
 * Configuration interface for the LaTeX MCP Server
 */
interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  apiKey: string;
  claudeModel: string;
  maxRequestSize: string;
  toolsPath: string;
  extensionsPath: string;
}

/**
 * LaTeXMCPServer
 * Core server implementation for Claude-LaTeX MCP integration
 */
export class LaTeXMCPServer {
  private config: ServerConfig;
  private app: Express;
  private mcpServer: MCPServer;
  private claude: Claude;
  private tools: Map<string, ToolDefinition> = new Map();
  private toolHandlers: Map<string, Function> = new Map();
  private isInitialized: boolean = false;
  private requestCounts: Map<string, number[]> = new Map();
  /**
   * Constructor
   * @param configPath Path to configuration file (optional)
   */
  constructor(configPath?: string) {
    // Load configuration
    this.config = this.loadConfig(configPath);
    
    // Initialize Express app
    this.app = express();
    
    // Initialize MCP server
    this.mcpServer = new MCPServer();
    
    // Initialize Claude client
    this.claude = new Claude({
      apiKey: this.config.apiKey
    });
  }

  /**
   * Load server configuration
   * @param configPath Path to configuration file
   * @returns Server configuration
   */
  private loadConfig(configPath?: string): ServerConfig {
    const defaultConfig: ServerConfig = {
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || 'localhost',
      corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      claudeModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620',
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '50mb',
      toolsPath: process.env.TOOLS_PATH || './tools',
      extensionsPath: process.env.EXTENSIONS_PATH || './extensions'
    };

    if (!configPath) {
      return defaultConfig;
    }

    try {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configFile);
      return { ...defaultConfig, ...config };
    } catch (error) {
      logger.error(`Failed to load configuration from ${configPath}:`, error);
      return defaultConfig;
    }
  }

  /**
   * Initialize the server
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Server is already initialized');
      return;
    }

    logger.info('Initializing LaTeX MCP Server...');

    // Validate configuration
    this.validateConfig();

    // Configure Express middleware
    this.configureMiddleware();

    // Configure routes
    this.configureRoutes();

    // Register MCP protocol handlers
    this.registerMCPHandlers();

    // Load tools
    await this.loadTools();

    // Load extensions
    await this.loadExtensions();

    this.isInitialized = true;
    logger.info('LaTeX MCP Server initialized successfully');
  }

  /**
   * Validate server configuration
   * @throws Error if configuration is invalid
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    if (!this.config.port || isNaN(this.config.port)) {
      throw new Error('Valid port number is required');
    }
  }

  /**
   * Configure Express middleware
   */
  private configureMiddleware(): void {
    // Parse JSON request bodies
    this.app.use(express.json({ limit: this.config.maxRequestSize }));
    
    // Parse URL-encoded request bodies
    this.app.use(express.urlencoded({ 
      extended: true,
      limit: this.config.maxRequestSize 
    }));
    
    // Enable CORS
    this.app.use(cors({
      origin: this.config.corsOrigins
    }));

    // Simple rate limiting middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 30;
      const timestamps = this.requestCounts.get(ip) || [];
      const recent = timestamps.filter(ts => now - ts < windowMs);
      recent.push(now);
      this.requestCounts.set(ip, recent);
      if (recent.length > maxRequests) {
        res.status(429).json({ error: 'Too many requests' });
      } else {
        next();
      }
    });
    
    // Add security headers
    this.app.use(helmet());
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
    
    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Server error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }

  /**
   * Configure Express routes
   */
  private configureRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });
    
    // MCP connection endpoint
    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        const request = req.body as MCPRequest;
        const response = await this.mcpServer.handleRequest(request);
        res.status(200).json(response);
      } catch (error) {
        logger.error('Error handling MCP request:', error);
        res.status(500).json({ 
          error: 'Error handling MCP request',
          message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
      }
    });
    
    // List available tools endpoint
    this.app.get('/tools', (req: Request, res: Response) => {
      const tools = Array.from(this.tools.values());
      res.status(200).json({ tools });
    });
  }

  /**
   * Register MCP protocol handlers
   */
  private registerMCPHandlers(): void {
    // Handler for ListTools requests
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values())
      };
    });
    
    // Handler for ExecuteTool requests
    this.mcpServer.setRequestHandler(ExecuteToolRequestSchema, async (request) => {
      const { tool, parameters } = request;
      
      // Check if tool exists
      if (!this.toolHandlers.has(tool)) {
        throw new Error(`Tool not found: ${tool}`);
      }
      
      try {
        // Execute tool handler
        const handler = this.toolHandlers.get(tool);
        const result = await handler!(parameters);
        return result as ExecuteToolResponseSchema;
      } catch (error) {
        logger.error(`Error executing tool ${tool}:`, error);
        throw new Error(`Error executing tool ${tool}: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Load tools from the tools directory
   */
  private async loadTools(): Promise<void> {
    try {
      // Ensure tools directory exists
      if (!fs.existsSync(this.config.toolsPath)) {
        logger.warn(`Tools directory ${this.config.toolsPath} does not exist`);
        return;
      }
      
      const toolDirs = fs.readdirSync(this.config.toolsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const toolDir of toolDirs) {
        const toolPath = path.join(this.config.toolsPath, toolDir);
        const indexPath = path.join(toolPath, 'index.js');
        
        if (fs.existsSync(indexPath)) {
          try {
            // Import tool module
            const toolModule = await import(indexPath);
            
            if (toolModule.default && typeof toolModule.default === 'object') {
              const { toolDefinition, handler } = toolModule.default;
              
              if (toolDefinition && handler && typeof handler === 'function') {
                // Register tool
                this.registerTool(toolDefinition, handler);
                logger.info(`Loaded tool: ${toolDefinition.name}`);
              } else {
                logger.warn(`Invalid tool module in ${toolDir}: missing toolDefinition or handler`);
              }
            } else {
              logger.warn(`Invalid tool module in ${toolDir}: missing default export`);
            }
          } catch (error) {
            logger.error(`Error loading tool from ${toolDir}:`, error);
          }
        } else {
          logger.warn(`No index.js found in tool directory ${toolDir}`);
        }
      }
      
      logger.info(`Loaded ${this.tools.size} tools`);
    } catch (error) {
      logger.error('Error loading tools:', error);
      throw new Error(`Failed to load tools: ${(error as Error).message}`);
    }
  }

  /**
   * Load extensions from the extensions directory
   */
  private async loadExtensions(): Promise<void> {
    try {
      // Ensure extensions directory exists
      if (!fs.existsSync(this.config.extensionsPath)) {
        logger.warn(`Extensions directory ${this.config.extensionsPath} does not exist`);
        return;
      }
      
      const extensionDirs = fs.readdirSync(this.config.extensionsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const extensionDir of extensionDirs) {
        const extensionPath = path.join(this.config.extensionsPath, extensionDir);
        const indexPath = path.join(extensionPath, 'index.js');
        
        if (fs.existsSync(indexPath)) {
          try {
            // Import extension module
            const extensionModule = await import(indexPath);
            
            if (extensionModule.default && typeof extensionModule.default === 'function') {
              // Initialize extension
              await extensionModule.default(this);
              logger.info(`Loaded extension: ${extensionDir}`);
            } else if (extensionModule.configureExtension && typeof extensionModule.configureExtension === 'function') {
              // Initialize extension using configureExtension function
              await extensionModule.configureExtension(this);
              logger.info(`Loaded extension: ${extensionDir}`);
            } else {
              logger.warn(`Invalid extension module in ${extensionDir}: missing default export or configureExtension function`);
            }
          } catch (error) {
            logger.error(`Error loading extension from ${extensionDir}:`, error);
          }
        } else {
          logger.warn(`No index.js found in extension directory ${extensionDir}`);
        }
      }
    } catch (error) {
      logger.error('Error loading extensions:', error);
      throw new Error(`Failed to load extensions: ${(error as Error).message}`);
    }
  }

  /**
   * Register a tool with the server
   * @param toolDefinition Tool definition
   * @param handler Tool handler function
   */
  public registerTool(toolDefinition: ToolDefinition, handler: Function): void {
    const { name } = toolDefinition;
    
    if (this.tools.has(name)) {
      throw new Error(`Tool with name ${name} is already registered`);
    }
    
    this.tools.set(name, toolDefinition);
    this.toolHandlers.set(name, handler);
    
    logger.info(`Registered tool: ${name}`);
  }

  /**
   * Get the Claude client
   * @returns Claude client
   */
  public getClaudeClient(): Claude {
    return this.claude;
  }

  /**
   * Get the MCP server
   * @returns MCP server
   */
  public getMCPServer(): MCPServer {
    return this.mcpServer;
  }

  /**
   * Get server configuration
   * @returns Server configuration
   */
  public getConfig(): ServerConfig {
    return { ...this.config };
  }

  /**
   * Start the server
   * @returns Promise that resolves when server is started
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return new Promise<void>((resolve) => {
      this.app.listen(this.config.port, () => {
        logger.info(`LaTeX MCP Server listening at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }
}

/**
 * EquationTool definition for the equation generation tool
 */
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
    },
  },
};

/**
 * DocumentStructureTool definition for the document structure tool
 */
const DocumentStructureTool: ToolDefinition = {
  name: 'create-document-structure',
  description: 'Creates LaTeX document structure based on natural language description',
  parameters: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Natural language description of the document to create',
      },
      documentType: {
        type: 'string',
        enum: ['article', 'report', 'book', 'letter', 'presentation', 'thesis'],
        description: 'Type of document to create',
        default: 'article',
      },
      includePackages: {
        type: 'boolean',
        description: 'Whether to include recommended packages based on content',
        default: true,
      },
    },
    required: ['description'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the document structure',
      },
      sections: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of sections created in the document',
      },
    },
  },
};

/**
 * Handle equation generation requests using Claude
 * @param parameters Request parameters
 * @returns Response with generated equation
 */
async function handleEquationGeneration(server: LaTeXMCPServer, parameters: any): Promise<ExecuteToolResponseSchema> {
  const { description, format = 'display', numbered = false } = parameters;
  const claude = server.getClaudeClient();
  const config = server.getConfig();
  
  // Build prompt for Claude
  const prompt = `
You are a LaTeX expert specializing in converting natural language descriptions into precise LaTeX equations.

Description: ${description}

Please generate the LaTeX code for this equation. Only include the mathematical expression itself, not the surrounding environment tags like \\begin{equation} or $.

The equation should be mathematically correct and follow standard notation.
`;

  try {
    // Call Claude to generate the equation
    const response = await claude.messages.create({
      model: config.claudeModel,
      max_tokens: 1000,
      temperature: 0.2, // Low temperature for more deterministic results
      system: "You are a LaTeX expert focused on mathematical and scientific equations. Provide precise, correct LaTeX code for equations based on natural language descriptions.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the LaTeX code from Claude's response
    const fullResponse = response.content[0].text;
    
    // Parse the response to extract the equation
    const latexMatch = fullResponse.match(/```latex\n([\s\S]*?)\n```/) || 
                       fullResponse.match(/`(.*?)`/) ||
                       fullResponse.match(/LaTeX code:([\s\S]*?)(?:\n\n|$)/);
    
    let latexCode = '';
    if (latexMatch) {
      latexCode = latexMatch[1].trim();
    } else {
      // Fallback: try to extract anything that looks like LaTeX
      latexCode = fullResponse.trim();
    }
    
    // Format the equation with the appropriate environment
    let formattedLatex = '';
    
    switch (format) {
      case 'inline':
        formattedLatex = `$${latexCode}$`;
        break;
      case 'display':
        formattedLatex = numbered
          ? `\\begin{equation}\n  ${latexCode}\n\\end{equation}`
          : `\\begin{equation*}\n  ${latexCode}\n\\end{equation*}`;
        break;
      case 'align':
        formattedLatex = numbered
          ? `\\begin{align}\n  ${latexCode}\n\\end{align}`
          : `\\begin{align*}\n  ${latexCode}\n\\end{align*}`;
        break;
      case 'gather':
        formattedLatex = numbered
          ? `\\begin{gather}\n  ${latexCode}\n\\end{gather}`
          : `\\begin{gather*}\n  ${latexCode}\n\\end{gather*}`;
        break;
      case 'multline':
        formattedLatex = numbered
          ? `\\begin{multline}\n  ${latexCode}\n\\end{multline}`
          : `\\begin{multline*}\n  ${latexCode}\n\\end{multline*}`;
        break;
      default:
        formattedLatex = `\\begin{equation*}\n  ${latexCode}\n\\end{equation*}`;
    }
    
    return {
      result: {
        latex: formattedLatex,
        preview: `Preview: ${latexCode}`,
      },
    };
  } catch (error) {
    logger.error('Error generating equation with Claude:', error);
    throw new Error(`Failed to generate equation: ${(error as Error).message}`);
  }
}

/**
 * Handle document structure creation requests using Claude
 * @param parameters Request parameters
 * @returns Response with generated document structure
 */
async function handleDocumentStructure(server: LaTeXMCPServer, parameters: any): Promise<ExecuteToolResponseSchema> {
  const { description, documentType = 'article', includePackages = true } = parameters;
  const claude = server.getClaudeClient();
  const config = server.getConfig();
  
  // Build prompt for Claude
  const prompt = `
You are a LaTeX expert specializing in document structure and organization.

Description: ${description}
Document Type: ${documentType}
Include Packages: ${includePackages ? 'Yes' : 'No'}

Please create a complete LaTeX document structure based on this description. Include:
1. Document class and preamble
2. Appropriate sections and subsections
3. Basic placeholder content structure
${includePackages ? '4. Necessary packages for this type of document' : ''}

Return the complete LaTeX code for the document structure.
`;

  try {
    // Call Claude to generate the document structure
    const response = await claude.messages.create({
      model: config.claudeModel,
      max_tokens: 2000,
      temperature: 0.2,
      system: "You are a LaTeX expert focused on document structure and organization. Provide complete, well-organized LaTeX document structures based on natural language descriptions.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the LaTeX code from Claude's response
    const fullResponse = response.content[0].text;
    
    // Parse the response to extract the document structure
    const latexMatch = fullResponse.match(/```latex\n([\s\S]*?)\n```/) || 
                       fullResponse.match(/```\n([\s\S]*?)\n```/) ||
                       { 1: fullResponse.trim() };
    
    const latexCode = latexMatch[1].trim();
    
    // Extract sections from the document
    const sectionRegex = /\\section\{([^}]+)\}/g;
    const sections: string[] = [];
    let match;
    
    while ((match = sectionRegex.exec(latexCode)) !== null) {
      sections.push(match[1]);
    }
    
    return {
      result: {
        latex: latexCode,
        sections,
      },
    };
  } catch (error) {
    logger.error('Error generating document structure with Claude:', error);
    throw new Error(`Failed to generate document structure: ${(error as Error).message}`);
  }
}

/**
 * Main function to create and start the server
 */
async function main() {
  try {
    const server = new LaTeXMCPServer();
    
    // Register core tools
    server.registerTool(
      EquationTool, 
      (parameters: any) => handleEquationGeneration(server, parameters)
    );
    
    server.registerTool(
      DocumentStructureTool,
      (parameters: any) => handleDocumentStructure(server, parameters)
    );
    
    // Start the server
    await server.start();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server if this file is executed directly
if (require.main === module) {
  main();
}

// Export the server class
export default LaTeXMCPServer;
