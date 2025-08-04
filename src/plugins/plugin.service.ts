import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { BrowserService } from '../browser/browser.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  permissions?: string[];
  category: 'ai-tool' | 'data-processor' | 'integration' | 'utility' | 'custom';
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginConfig {
  enabled: boolean;
  settings?: Record<string, any>;
  apiKeys?: Record<string, string>;
  webhooks?: Record<string, string>;
}

export interface PluginManifest {
  metadata: PluginMetadata;
  config: PluginConfig;
  entryPoint: string;
  tools?: PluginTool[];
  hooks?: PluginHook[];
}

export interface PluginTool {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  method: string;
  endpoint?: string;
  permissions?: string[];
}

export interface PluginHook {
  event: string;
  handler: string;
  priority?: number;
  condition?: string;
}

export interface PluginExecutionContext {
  userId: string;
  sessionId?: string;
  requestId: string;
  timestamp: Date;
  permissions: string[];
}

export interface PluginExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    resourceUsage?: Record<string, number>;
  };
}

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name);
  private readonly pluginsDir: string;
  private loadedPlugins: Map<string, PluginManifest> = new Map();
  private pluginInstances: Map<string, any> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly aiService: AIService,
    private readonly browserService: BrowserService,
  ) {
    this.pluginsDir = this.configService.get<string>('PLUGINS_DIR', './plugins');
    this.initializePluginsDirectory();
    this.loadPlugins();
  }

  private async initializePluginsDirectory(): Promise<void> {
    try {
      await mkdir(this.pluginsDir, { recursive: true });
      await mkdir(path.join(this.pluginsDir, 'installed'), { recursive: true });
      await mkdir(path.join(this.pluginsDir, 'cache'), { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to initialize plugins directory: ${error.message}`);
    }
  }

  private async loadPlugins(): Promise<void> {
    try {
      // Load built-in plugins
      await this.loadBuiltInPlugins();
      
      // Load user-installed plugins
      await this.loadUserPlugins();
      
      this.logger.log(`Loaded ${this.loadedPlugins.size} plugins`);
    } catch (error) {
      this.logger.error(`Failed to load plugins: ${error.message}`);
    }
  }

  private async loadBuiltInPlugins(): Promise<void> {
    const builtInPlugins: PluginManifest[] = [
      {
        metadata: {
          id: 'text-processor',
          name: 'Text Processor',
          version: '1.0.0',
          description: 'Advanced text processing and analysis tools',
          author: 'System',
          category: 'ai-tool',
          keywords: ['text', 'nlp', 'analysis'],
          permissions: ['text:read', 'text:process'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: true,
          settings: {
            maxTextLength: 50000,
            supportedLanguages: ['en', 'es', 'fr', 'de'],
          },
        },
        entryPoint: 'built-in:text-processor',
        tools: [
          {
            id: 'analyze-sentiment',
            name: 'Sentiment Analysis',
            description: 'Analyze the sentiment of text content',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', maxLength: 50000 },
                language: { type: 'string', default: 'en' },
              },
              required: ['text'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                details: { type: 'object' },
              },
            },
            method: 'analyzeSentiment',
          },
          {
            id: 'extract-keywords',
            name: 'Keyword Extraction',
            description: 'Extract key terms and phrases from text',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', maxLength: 50000 },
                maxKeywords: { type: 'number', default: 10, minimum: 1, maximum: 50 },
              },
              required: ['text'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                keywords: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      term: { type: 'string' },
                      score: { type: 'number' },
                      frequency: { type: 'number' },
                    },
                  },
                },
              },
            },
            method: 'extractKeywords',
          },
        ],
      },
      {
        metadata: {
          id: 'data-transformer',
          name: 'Data Transformer',
          version: '1.0.0',
          description: 'Data format conversion and transformation utilities',
          author: 'System',
          category: 'data-processor',
          keywords: ['data', 'transform', 'convert'],
          permissions: ['data:read', 'data:transform'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: true,
          settings: {
            maxDataSize: 1024 * 1024, // 1MB
            supportedFormats: ['json', 'xml', 'csv', 'yaml'],
          },
        },
        entryPoint: 'built-in:data-transformer',
        tools: [
          {
            id: 'convert-format',
            name: 'Format Converter',
            description: 'Convert data between different formats',
            inputSchema: {
              type: 'object',
              properties: {
                data: { type: 'string' },
                fromFormat: { type: 'string', enum: ['json', 'xml', 'csv', 'yaml'] },
                toFormat: { type: 'string', enum: ['json', 'xml', 'csv', 'yaml'] },
              },
              required: ['data', 'fromFormat', 'toFormat'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                convertedData: { type: 'string' },
                format: { type: 'string' },
                metadata: { type: 'object' },
              },
            },
            method: 'convertFormat',
          },
        ],
      },
      {
        metadata: {
          id: 'web-scraper',
          name: 'Web Scraper',
          version: '1.0.0',
          description: 'Extract data from web pages and APIs',
          author: 'System',
          category: 'integration',
          keywords: ['web', 'scraping', 'data', 'extraction'],
          permissions: ['web:read', 'http:request'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: true,
          settings: {
            maxRequests: 100,
            timeout: 30000,
            userAgent: 'AI-API-Bot/1.0',
          },
        },
        entryPoint: 'built-in:web-scraper',
        tools: [
          {
            id: 'scrape-url',
            name: 'URL Scraper',
            description: 'Extract content from a web page using browser automation',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri' },
                selector: { type: 'string' },
                extractText: { type: 'boolean', default: true },
                extractLinks: { type: 'boolean', default: false },
                takeScreenshot: { type: 'boolean', default: false },
              },
              required: ['url'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                links: { type: 'array', items: { type: 'string' } },
                screenshot: { type: 'string' },
                metadata: { type: 'object' },
              },
            },
            method: 'scrapeUrl',
          },
          {
            id: 'automate-browser',
            name: 'Browser Automation',
            description: 'Perform automated browser actions',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri' },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['click', 'type', 'wait', 'extract', 'screenshot'] },
                      selector: { type: 'string' },
                      value: { type: 'string' },
                      timeout: { type: 'number', default: 5000 },
                    },
                    required: ['type'],
                  },
                },
              },
              required: ['url', 'actions'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                results: { type: 'array', items: { type: 'object' } },
                screenshots: { type: 'array', items: { type: 'string' } },
                finalUrl: { type: 'string' },
              },
            },
            method: 'automateBrowser',
          },
        ],
      },
      {
        metadata: {
          id: 'docker-executor',
          name: 'Docker Code Executor',
          version: '1.0.0',
          description: 'Execute code in sandboxed Docker containers',
          author: 'System',
          category: 'utility',
          keywords: ['docker', 'execution', 'sandbox', 'code'],
          permissions: ['docker:create', 'docker:execute'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: true,
          settings: {
            maxExecutionTime: 60000, // 1 minute
            maxMemory: '512m',
            networkMode: 'none', // No network access for security
            supportedLanguages: ['python', 'node', 'bash'],
          },
        },
        entryPoint: 'built-in:docker-executor',
        tools: [
          {
            id: 'execute-code',
            name: 'Execute Code in Container',
            description: 'Run code in a secure Docker container',
            inputSchema: {
              type: 'object',
              properties: {
                language: { type: 'string', enum: ['python', 'node', 'bash'] },
                code: { type: 'string', maxLength: 10000 },
                timeout: { type: 'number', default: 30000, maximum: 60000 },
                packages: { type: 'array', items: { type: 'string' } },
              },
              required: ['language', 'code'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                stdout: { type: 'string' },
                stderr: { type: 'string' },
                exitCode: { type: 'number' },
                executionTime: { type: 'number' },
                containerId: { type: 'string' },
              },
            },
            method: 'executeCode',
          },
        ],
      },
    ];

    for (const plugin of builtInPlugins) {
      this.loadedPlugins.set(plugin.metadata.id, plugin);
      this.logger.debug(`Loaded built-in plugin: ${plugin.metadata.name}`);
    }
  }

  private async loadUserPlugins(): Promise<void> {
    // Implementation for loading user-installed plugins would go here
    // This would scan the plugins directory for plugin manifests and load them
    this.logger.debug('User plugin loading not implemented yet');
  }

  async getInstalledPlugins(): Promise<PluginManifest[]> {
    return Array.from(this.loadedPlugins.values());
  }

  async getPlugin(pluginId: string): Promise<PluginManifest | null> {
    return this.loadedPlugins.get(pluginId) || null;
  }

  async getPluginTools(pluginId: string): Promise<PluginTool[]> {
    const plugin = this.loadedPlugins.get(pluginId);
    return plugin?.tools || [];
  }

  async executePluginTool(
    pluginId: string,
    toolId: string,
    input: any,
    context: PluginExecutionContext,
  ): Promise<PluginExecutionResult> {
    const startTime = Date.now();
    
    try {
      const plugin = this.loadedPlugins.get(pluginId);
      if (!plugin) {
        throw new NotFoundException(`Plugin not found: ${pluginId}`);
      }

      if (!plugin.config.enabled) {
        throw new BadRequestException(`Plugin is disabled: ${pluginId}`);
      }

      const tool = plugin.tools?.find(t => t.id === toolId);
      if (!tool) {
        throw new NotFoundException(`Tool not found: ${toolId} in plugin ${pluginId}`);
      }

      // Check permissions
      this.checkPermissions(tool.permissions || [], context.permissions);

      // Validate input
      this.validateInput(input, tool.inputSchema);

      // Execute the tool
      const result = await this.executeTool(plugin, tool, input, context);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Tool execution failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime,
        },
      };
    }
  }

  async installPlugin(pluginPackage: Buffer | string, userId: string): Promise<void> {
    try {
      // Implementation for installing a plugin from a package
      // This would extract the plugin, validate it, and add it to the system
      throw new Error('Plugin installation not implemented yet');
    } catch (error) {
      this.logger.error(`Plugin installation failed: ${error.message}`);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string, userId: string): Promise<void> {
    try {
      const plugin = this.loadedPlugins.get(pluginId);
      if (!plugin) {
        throw new NotFoundException(`Plugin not found: ${pluginId}`);
      }

      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginId);
      this.pluginInstances.delete(pluginId);

      // Remove plugin files (for user-installed plugins)
      // Built-in plugins cannot be uninstalled

      this.logger.log(`Plugin uninstalled: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Plugin uninstallation failed: ${error.message}`);
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new NotFoundException(`Plugin not found: ${pluginId}`);
    }

    plugin.config.enabled = true;
    this.logger.log(`Plugin enabled: ${pluginId}`);
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new NotFoundException(`Plugin not found: ${pluginId}`);
    }

    plugin.config.enabled = false;
    this.logger.log(`Plugin disabled: ${pluginId}`);
  }

  async updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new NotFoundException(`Plugin not found: ${pluginId}`);
    }

    plugin.config = { ...plugin.config, ...config };
    this.logger.log(`Plugin config updated: ${pluginId}`);
  }

  private checkPermissions(required: string[], available: string[]): void {
    for (const permission of required) {
      if (!available.includes(permission) && !available.includes('*')) {
        throw new BadRequestException(`Insufficient permissions: ${permission}`);
      }
    }
  }

  private validateInput(input: any, schema: any): void {
    // Basic validation - in a real implementation, use a proper JSON schema validator
    if (schema.required) {
      for (const field of schema.required) {
        if (input[field] === undefined) {
          throw new BadRequestException(`Required field missing: ${field}`);
        }
      }
    }
  }

  private async executeTool(
    plugin: PluginManifest,
    tool: PluginTool,
    input: any,
    context: PluginExecutionContext,
  ): Promise<any> {
    // Mock implementation for built-in tools
    if (plugin.entryPoint.startsWith('built-in:')) {
      return this.executeBuiltInTool(plugin, tool, input, context);
    }

    // For user plugins, this would load and execute the actual plugin code
    throw new Error('User plugin execution not implemented yet');
  }

  private async executeBuiltInTool(
    plugin: PluginManifest,
    tool: PluginTool,
    input: any,
    context: PluginExecutionContext,
  ): Promise<any> {
    const pluginType = plugin.entryPoint.split(':')[1];

    switch (pluginType) {
      case 'text-processor':
        return this.executeTextProcessorTool(tool, input, context);
      
      case 'data-transformer':
        return this.executeDataTransformerTool(tool, input, context);
      
      case 'web-scraper':
        return this.executeWebScraperTool(tool, input, context);
      
      case 'docker-executor':
        return this.executeDockerExecutorTool(tool, input, context);
      
      default:
        throw new Error(`Unknown built-in plugin type: ${pluginType}`);
    }
  }

  private async executeTextProcessorTool(tool: PluginTool, input: any, context: PluginExecutionContext): Promise<any> {
    switch (tool.id) {
      case 'analyze-sentiment':
        // Use AI service for real sentiment analysis
        const sentimentPrompt = `Analyze the sentiment of the following text and return a JSON response with "sentiment" (positive/negative/neutral), "confidence" (0-1), and "details":

Text: "${input.text}"

Response format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "details": {
    "textLength": ${input.text.length},
    "language": "${input.language || 'en'}",
    "reasoning": "Brief explanation"
  }
}`;

        const response = await this.aiService.generateText(sentimentPrompt, { maxTokens: 200 });
        
        try {
          const result = JSON.parse(response);
          return result;
        } catch (error) {
          // Fallback if AI doesn't return valid JSON
          return {
            sentiment: 'neutral',
            confidence: 0.5,
            details: {
              textLength: input.text.length,
              language: input.language || 'en',
              reasoning: 'AI analysis could not be parsed'
            },
          };
        }
      
      case 'extract-keywords':
        // Use AI service for real keyword extraction
        const keywordPrompt = `Extract the top ${input.maxKeywords || 10} keywords and key phrases from the following text. Return a JSON response:

Text: "${input.text}"

Response format:
{
  "keywords": [
    {"term": "keyword", "score": 0.85, "frequency": 3},
    {"term": "another keyword", "score": 0.72, "frequency": 2}
  ]
}`;

        const keywordResponse = await this.aiService.generateText(keywordPrompt, { maxTokens: 300 });
        
        try {
          const result = JSON.parse(keywordResponse);
          return result;
        } catch (error) {
          // Fallback keyword extraction
          const words = input.text.toLowerCase().split(/\s+/);
          const wordCount = words.reduce((acc: any, word: string) => {
            if (word.length > 3) {
              acc[word] = (acc[word] || 0) + 1;
            }
            return acc;
          }, {});
          
          const keywords = Object.entries(wordCount)
            .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
            .slice(0, input.maxKeywords || 10)
            .map(([term, frequency]: any) => ({
              term,
              score: (frequency as number) / words.length,
              frequency: frequency as number,
            }));
          
          return { keywords };
        }
      
      default:
        throw new Error(`Unknown text processor tool: ${tool.id}`);
    }
  }

  private async executeDataTransformerTool(tool: PluginTool, input: any, context: PluginExecutionContext): Promise<any> {
    switch (tool.id) {
      case 'convert-format':
        try {
          let convertedData: string;
          let parsedData: any;

          // Parse input data based on fromFormat
          if (input.fromFormat === 'json') {
            parsedData = JSON.parse(input.data);
          } else if (input.fromFormat === 'csv') {
            // Simple CSV parsing
            const lines = input.data.split('\n');
            const headers = lines[0].split(',');
            parsedData = lines.slice(1).map((line: any) => {
              const values = line.split(',');
              return headers.reduce((obj: any, header: any, index: any) => {
                obj[header.trim()] = values[index]?.trim();
                return obj;
              }, {});
            });
          } else {
            parsedData = input.data;
          }

          // Convert to target format
          if (input.toFormat === 'json') {
            convertedData = JSON.stringify(parsedData, null, 2);
          } else if (input.toFormat === 'csv') {
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              const headers = Object.keys(parsedData[0]);
              const csvLines = [
                headers.join(','),
                ...parsedData.map((obj: any) => headers.map(h => obj[h] || '').join(','))
              ];
              convertedData = csvLines.join('\n');
            } else {
              convertedData = '';
            }
          } else if (input.toFormat === 'xml') {
            // Simple XML conversion
            const jsonToXml = (obj: any, rootName = 'root'): string => {
              if (typeof obj !== 'object') return `<${rootName}>${obj}</${rootName}>`;
              
              let xml = `<${rootName}>`;
              for (const [key, value] of Object.entries(obj)) {
                if (Array.isArray(value)) {
                  value.forEach(item => {
                    xml += jsonToXml(item, key);
                  });
                } else {
                  xml += jsonToXml(value, key);
                }
              }
              xml += `</${rootName}>`;
              return xml;
            };
            convertedData = jsonToXml(parsedData);
          } else {
            convertedData = JSON.stringify(parsedData);
          }

          return {
            convertedData,
            format: input.toFormat,
            metadata: {
              originalFormat: input.fromFormat,
              conversionTime: new Date().toISOString(),
              dataSize: convertedData.length,
            },
          };
        } catch (error) {
          throw new Error(`Format conversion failed: ${error.message}`);
        }
      
      default:
        throw new Error(`Unknown data transformer tool: ${tool.id}`);
    }
  }

  private async executeWebScraperTool(tool: PluginTool, input: any, context: PluginExecutionContext): Promise<any> {
    switch (tool.id) {
      case 'scrape-url':
        try {
          // Create browser context
          const contextId = await this.browserService.createBrowserContext(context.sessionId || 'plugin-execution');
          
          try {
            // Navigate to URL
            const navigationResult = await this.browserService.navigateToUrl(contextId, input.url);
            if (!navigationResult.success) {
              throw new Error(`Navigation failed: ${navigationResult.error}`);
            }

            let content = '';
            let links: string[] = [];
            let screenshot: string | undefined;

            // Extract content
            if (input.selector) {
              const extractResult = await this.browserService.extractContent(contextId, input.selector);
              content = extractResult.success ? extractResult.data : '';
            } else {
              const extractResult = await this.browserService.extractContent(contextId);
              if (extractResult.success) {
                content = extractResult.data.text || '';
                links = extractResult.data.links || [];
              }
            }

            // Take screenshot if requested
            if (input.takeScreenshot) {
              const screenshotResult = await this.browserService.takeScreenshot(contextId);
              if (screenshotResult.success) {
                screenshot = screenshotResult.screenshot;
              }
            }

            return {
              content: content.substring(0, 5000), // Limit content length
              links: links.slice(0, 20), // Limit links
              screenshot,
              metadata: {
                url: input.url,
                scrapedAt: new Date().toISOString(),
                selector: input.selector,
                contentLength: content.length,
                method: 'browser-automation',
              },
            };
          } finally {
            // Clean up browser context
            await this.browserService.closeBrowserContext(contextId);
          }
        } catch (error) {
          throw new Error(`Browser scraping failed: ${error.message}`);
        }

      case 'automate-browser':
        try {
          const contextId = await this.browserService.createBrowserContext(context.sessionId || 'plugin-execution');
          
          try {
            // Navigate to initial URL
            const navigationResult = await this.browserService.navigateToUrl(contextId, input.url);
            if (!navigationResult.success) {
              throw new Error(`Navigation failed: ${navigationResult.error}`);
            }

            const results: any[] = [];
            const screenshots: string[] = [];

            // Execute actions sequentially
            for (const action of input.actions) {
              let result: any;
              
              switch (action.type) {
                case 'click':
                  result = await this.browserService.clickElement(contextId, action.selector);
                  break;
                
                case 'type':
                  if (action.selector && action.value) {
                    result = await this.browserService.fillForm(contextId, { [action.selector]: action.value });
                  } else {
                    result = { success: false, error: 'Missing selector or value for type action' };
                  }
                  break;
                
                case 'wait':
                  // Simple wait implementation
                  await new Promise(resolve => setTimeout(resolve, action.timeout || 1000));
                  result = { success: true, data: { waited: action.timeout || 1000 } };
                  break;
                
                case 'extract':
                  result = await this.browserService.extractContent(contextId, action.selector);
                  break;
                
                case 'screenshot':
                  result = await this.browserService.takeScreenshot(contextId);
                  if (result.success && result.screenshot) {
                    screenshots.push(result.screenshot);
                  }
                  break;
                
                default:
                  result = { success: false, error: `Unknown action type: ${action.type}` };
              }

              results.push({
                action: action.type,
                selector: action.selector,
                success: result.success,
                data: result.data,
                error: result.error,
              });

              // Stop if action failed and it's critical
              if (!result.success && ['click', 'type'].includes(action.type)) {
                this.logger.warn(`Browser automation action failed: ${action.type} - ${result.error}`);
              }
            }

            // Get final URL
            const finalContentResult = await this.browserService.extractContent(contextId);
            const finalUrl = finalContentResult.success ? finalContentResult.data.url : input.url;

            return {
              results,
              screenshots,
              finalUrl,
              metadata: {
                initialUrl: input.url,
                executedAt: new Date().toISOString(),
                totalActions: input.actions.length,
                successfulActions: results.filter(r => r.success).length,
              },
            };
          } finally {
            await this.browserService.closeBrowserContext(contextId);
          }
        } catch (error) {
          throw new Error(`Browser automation failed: ${error.message}`);
        }
      
      default:
        throw new Error(`Unknown web scraper tool: ${tool.id}`);
    }
  }

  private async executeDockerExecutorTool(tool: PluginTool, input: any, context: PluginExecutionContext): Promise<any> {
    switch (tool.id) {
      case 'execute-code':
        try {
          const { language, code, timeout = 30000, packages = [] } = input;
          const startTime = Date.now();
          
          // Import child_process for Docker execution
          const { spawn } = require('child_process');
          const { v4: uuidv4 } = require('uuid');
          
          const containerId = `plugin-exec-${uuidv4()}`;
          const timeoutMs = Math.min(timeout, 60000); // Max 1 minute
          
          let dockerImage: string;
          let command: string[];
          
          // Determine Docker image and command based on language
          switch (language) {
            case 'python':
              dockerImage = 'python:3.9-slim';
              command = ['docker', 'run', '--rm', '--name', containerId, 
                        '--memory=512m', '--cpus=0.5', '--network=none',
                        '--user=1000:1000', // Run as non-root user
                        dockerImage, 'python', '-c', code];
              break;
              
            case 'node':
              dockerImage = 'node:16-slim';
              command = ['docker', 'run', '--rm', '--name', containerId,
                        '--memory=512m', '--cpus=0.5', '--network=none',
                        '--user=1000:1000',
                        dockerImage, 'node', '-e', code];
              break;
              
            case 'bash':
              dockerImage = 'ubuntu:20.04';
              command = ['docker', 'run', '--rm', '--name', containerId,
                        '--memory=512m', '--cpus=0.5', '--network=none',
                        '--user=1000:1000',
                        dockerImage, 'bash', '-c', code];
              break;
              
            default:
              throw new Error(`Unsupported language: ${language}`);
          }

          return new Promise((resolve, reject) => {
            const child = spawn(command[0], command.slice(1), {
              timeout: timeoutMs,
              stdio: ['pipe', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';
            let isTimedOut = false;

            // Set up timeout
            const timeoutId = setTimeout(() => {
              isTimedOut = true;
              child.kill('SIGKILL');
              
              // Try to force remove container if it's still running
              const killCommand = spawn('docker', ['kill', containerId], { stdio: 'ignore' });
              killCommand.on('exit', () => {
                spawn('docker', ['rm', '-f', containerId], { stdio: 'ignore' });
              });
            }, timeoutMs);

            child.stdout?.on('data', (data) => {
              stdout += data.toString();
              // Limit output size
              if (stdout.length > 10000) {
                stdout = stdout.substring(0, 10000) + '\n... (output truncated)';
                child.kill('SIGTERM');
              }
            });

            child.stderr?.on('data', (data) => {
              stderr += data.toString();
              // Limit error output size
              if (stderr.length > 5000) {
                stderr = stderr.substring(0, 5000) + '\n... (error output truncated)';
              }
            });

            child.on('exit', (code, signal) => {
              clearTimeout(timeoutId);
              const executionTime = Date.now() - startTime;
              
              if (isTimedOut) {
                resolve({
                  stdout: stdout,
                  stderr: stderr + '\nExecution timed out',
                  exitCode: -1,
                  executionTime,
                  containerId,
                  timedOut: true,
                });
              } else {
                resolve({
                  stdout,
                  stderr,
                  exitCode: code || 0,
                  executionTime,
                  containerId,
                  signal,
                });
              }
            });

            child.on('error', (error) => {
              clearTimeout(timeoutId);
              const executionTime = Date.now() - startTime;
              
              // Check if Docker is available
              if (error.message.includes('ENOENT')) {
                resolve({
                  stdout: '',
                  stderr: 'Docker is not available on this system. Code execution requires Docker to be installed and running.',
                  exitCode: -1,
                  executionTime,
                  containerId,
                  dockerNotAvailable: true,
                });
              } else {
                resolve({
                  stdout: '',
                  stderr: `Execution error: ${error.message}`,
                  exitCode: -1,
                  executionTime,
                  containerId,
                });
              }
            });
          });
        } catch (error) {
          return {
            stdout: '',
            stderr: `Plugin execution error: ${error.message}`,
            exitCode: -1,
            executionTime: 0,
            containerId: 'error',
          };
        }
      
      default:
        throw new Error(`Unknown docker executor tool: ${tool.id}`);
    }
  }
}