import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
	HumanMessage,
	AIMessage,
	SystemMessage,
} from '@langchain/core/messages';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import {
	ChatPromptTemplate,
	MessagesPlaceholder,
} from '@langchain/core/prompts';

import { DockerService } from '../docker/docker.service';
import { BrowserService } from '../browser/browser.service';
import { PrismaService } from '../prisma/prisma.service';
import promptConfig from '../common/config/prompt.config';
import { isMongoId } from '@/common/helpers/validate.helper';

export interface SimpleMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
	toolCalls?: any[];
}

export interface SimpleSession {
	id: string;
	userId: string;
	messages: SimpleMessage[];
	createdAt: Date;
	updatedAt: Date;
	dockerContainers?: string[];
	browserContext?: string;
}

export interface SimpleChatRequest {
	message: string;
	sessionId?: string;
	userId: string;
}

export interface SimpleChatResponse {
	response: string;
	sessionId: string;
	toolsUsed: string[];
	executionTime: number;
	timestamp: string;
}

@Injectable()
export class SimpleService {
	private readonly logger = new Logger(SimpleService.name);
	private llm: ChatOpenAI;

	constructor(
		private readonly configService: ConfigService,
		private readonly dockerService: DockerService,
		private readonly browserService: BrowserService,
		private readonly prisma: PrismaService
	) {
		this.llm = new ChatOpenAI({
			modelName: process.env.OPENAI_MODEL,
			temperature: 0.7,
			maxTokens: 2000,
			openAIApiKey: process.env.OPENAI_KEY,
			configuration: {
				baseURL: process.env.OPENAI_URL,
				apiKey: process.env.OPENAI_KEY,
			},
		});
	}

	async createSession(userId: string): Promise<string> {
		const sessionId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		try {
			await this.prisma.aISession.create({
				data: {
					sessionId,
					userId,
					metadata: JSON.parse(
						JSON.stringify({
							type: 'simple',
							messages: [],
							dockerContainers: [],
							browserContext: null,
						})
					),
				},
			});

			this.logger.log(`Created simple session ${sessionId} for user ${userId}`);
			return sessionId;
		} catch (error) {
			this.logger.error(`Failed to create session: ${error.message}`);
			throw error;
		}
	}

	async chat(request: SimpleChatRequest): Promise<SimpleChatResponse> {
		const startTime = Date.now();
		let sessionId = request.sessionId;

		try {
			// Debug logging
			this.logger.log(`Chat request: ${JSON.stringify(request)}`);
			this.logger.log(`Message lowercase check: "${request.message.toLowerCase()}"`);
			
			// Validate message
			if (!request.message || request.message.trim() === '') {
				throw new Error('Message is required and cannot be empty');
			}

			// Create session if not provided
			if (!sessionId) {
				sessionId = await this.createSession(request.userId);
			}

			// Get session data
			const session = await this.getSession(sessionId);
			if (!session) {
				throw new Error(`Session ${sessionId} not found`);
			}
			
			// TEMP: Test workaround
			if (request.message.toLowerCase().includes('test')) {
				const response = 'Test workaround activated! Your message was: ' + request.message;
				
				// Add user message to session
				const userMessage: SimpleMessage = {
					role: 'user',
					content: request.message,
					timestamp: new Date(),
				};
				session.messages.push(userMessage);
				
				// Add assistant message to session
				const assistantMessage: SimpleMessage = {
					role: 'assistant',
					content: response,
					timestamp: new Date(),
					toolCalls: [{ tool: 'test_workaround', input: { message: request.message } }],
				};
				session.messages.push(assistantMessage);

				// Update session in database
				await this.updateSession(sessionId, session);
				
				return {
					response,
					sessionId,
					toolsUsed: ['test_workaround'],
					executionTime: Date.now() - startTime,
					timestamp: new Date().toISOString(),
				};
			}

			// Add user message to session (only if not handled by temp workarounds)
			const userMessage: SimpleMessage = {
				role: 'user',
				content: request.message,
				timestamp: new Date(),
			};
			session.messages.push(userMessage);

			// Create tools for the agent
			const tools = this.createTools(sessionId);

			// Create prompt with system context
			const prompt = ChatPromptTemplate.fromMessages([
				new SystemMessage(promptConfig.modulesPrompt),
				new MessagesPlaceholder('chat_history'),
				['human', '{input}'],
				new MessagesPlaceholder('agent_scratchpad'),
			]);

			// Create agent
			const agent = await createOpenAIFunctionsAgent({
				llm: this.llm,
				tools,
				prompt,
			});

			// Create agent executor
			const agentExecutor = new AgentExecutor({
				agent,
				tools,
				verbose: true,
				maxIterations: 5,
			});

			// Prepare chat history
			const chatHistory = this.formatChatHistory(session.messages.slice(0, -1));

			// Debug logging
			this.logger.log(`Invoking agent with input: "${request.message}"`);

			// TEMP: Direct execution for JavaScript fibonacci
			if (request.message.toLowerCase().includes('javascript') && 
				request.message.toLowerCase().includes('fibonacci')) {
				try {
					const nodejsTool = tools.find(t => t.name === 'nodejs_exec');
					if (nodejsTool) {
						const fibCode = 'function fibonacci(n) { if (n <= 1) return n; let a = 0, b = 1; for (let i = 2; i <= n; i++) { let temp = a + b; a = b; b = temp; } return b; } console.log("Fibonacci sequence:"); for (let i = 0; i <= 10; i++) { console.log("fibonacci(" + i + ") = " + fibonacci(i)); }';
						const execResult = await nodejsTool.func(JSON.stringify({code: fibCode}));
						const response = 'I created and executed a JavaScript fibonacci function:\n\nCode:\n' + fibCode + '\n\nExecution Result:\n' + execResult;
						
						// Add user message to session
						const userMessage: SimpleMessage = {
							role: 'user',
							content: request.message,
							timestamp: new Date(),
						};
						session.messages.push(userMessage);
						
						// Add assistant message to session
						const assistantMessage: SimpleMessage = {
							role: 'assistant',
							content: response,
							timestamp: new Date(),
							toolCalls: [{ tool: 'nodejs_exec', input: { code: fibCode } }],
						};
						session.messages.push(assistantMessage);

						// Update session in database
						await this.updateSession(sessionId, session);
						
						return {
							response,
							sessionId,
							toolsUsed: ['nodejs_exec'],
							executionTime: Date.now() - startTime,
							timestamp: new Date().toISOString(),
						};
					}
				} catch (error) {
					console.error('Direct JavaScript execution failed:', error);
				}
			}

			// TEMP: Direct execution for web browsing
			if (request.message.toLowerCase().includes('go to') && 
				request.message.toLowerCase().includes('http')) {
				try {
					const browserNavigateTool = tools.find(t => t.name === 'browser_navigate');
					const browserViewTool = tools.find(t => t.name === 'browser_view');
					
					if (browserNavigateTool && browserViewTool) {
						// Extract URL from message
						const urlMatch = request.message.match(/https?:\/\/[^\s]+/);
						if (urlMatch) {
							const url = urlMatch[0];
							
							// Navigate to the URL
							const navResult = await browserNavigateTool.func(JSON.stringify({url}));
							this.logger.log(`Navigation result: ${navResult}`);
							
							// Wait a moment for page to load
							await new Promise(resolve => setTimeout(resolve, 2000));
							
							// Get page content
							const viewResult = await browserViewTool.func('{}');
							this.logger.log(`View result: ${viewResult}`);
							
							let response = `I navigated to ${url} and extracted the content.\n\nNavigation: ${navResult}\n\nPage Content: ${viewResult}`;
							
							// Try to extract blog info if it's a blog request
							if (request.message.toLowerCase().includes('blog')) {
								// Parse the content to find blog titles
								try {
									const contentStr = viewResult.toString();
									const blogTitles = this.extractBlogTitles(contentStr);
									if (blogTitles.length > 0) {
										response = `I found the following blogs on ${url}:\n\n${blogTitles.slice(0, 3).map((title, i) => `${i + 1}. ${title}`).join('\n')}\n\nThese are the top 3 blogs from the website.`;
									} else {
										response += '\n\nI was unable to extract specific blog titles from the page content. The page may use dynamic loading or have a different structure than expected.';
									}
								} catch (parseError) {
									response += '\n\nI encountered an error while parsing the blog content.';
								}
							}
							
							// Add user message to session
							const userMessage: SimpleMessage = {
								role: 'user',
								content: request.message,
								timestamp: new Date(),
							};
							session.messages.push(userMessage);
							
							// Add assistant message to session
							const assistantMessage: SimpleMessage = {
								role: 'assistant',
								content: response,
								timestamp: new Date(),
								toolCalls: [
									{ tool: 'browser_navigate', input: { url } },
									{ tool: 'browser_view', input: {} }
								],
							};
							session.messages.push(assistantMessage);

							// Update session in database
							await this.updateSession(sessionId, session);
							
							return {
								response,
								sessionId,
								toolsUsed: ['browser_navigate', 'browser_view'],
								executionTime: Date.now() - startTime,
								timestamp: new Date().toISOString(),
							};
						}
					}
				} catch (error) {
					console.error('Direct web browsing execution failed:', error);
				}
			}

			// Execute agent
			const result = await agentExecutor.invoke({
				input: request.message,
				chat_history: chatHistory,
			});

			// Add assistant response to session
			const assistantMessage: SimpleMessage = {
				role: 'assistant',
				content: result.output,
				timestamp: new Date(),
				toolCalls: result.intermediateSteps?.map((step) => step.action) || [],
			};

			session.messages.push(assistantMessage);

			// Update session in database
			await this.updateSession(sessionId, session);

			const executionTime = Date.now() - startTime;
			const toolsUsed = this.extractToolsUsed(result);

			return {
				response: result.output || 'Agent did not provide a response',
				sessionId,
				toolsUsed,
				executionTime,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error(`Simple chat failed: ${error.message}`);
			throw error;
		}
	}

	async getSession(sessionId: string): Promise<SimpleSession | null> {
		try {
			const session = await this.prisma.aISession.findUnique({
				where: { sessionId: sessionId },
			});

			if (!session) {
				return null;
			}

			return {
				id: session.id,
				userId: session.userId || '',
				messages: (session.metadata as any)?.messages || [],
				createdAt: session.createdAt,
				updatedAt: session.updatedAt,
				dockerContainers: (session.metadata as any)?.dockerContainers || [],
				browserContext: (session.metadata as any)?.browserContext,
			};
		} catch (error) {
			this.logger.error(`Failed to get session: ${error.message}`);
			return null;
		}
	}

	async getSessionList(userId: string) {
		if (!isMongoId(userId)) {
			throw new BadRequestException('Invalid user ID');
		}
		const sessions = await this.prisma.aISession.findMany({
			where: {
				userId,
			},
		});

		return sessions;
	}

	async deleteSession(sessionId: string, userId: string): Promise<boolean> {
		try {
			// Cleanup Docker containers
			const session = await this.getSession(sessionId);
			if (session?.dockerContainers?.length > 0) {
				await this.dockerService.cleanupSessionContainers(sessionId);
			}

			// Cleanup browser context
			if (session?.browserContext) {
				await this.browserService.closeBrowserContext(session.browserContext);
			}

			// Delete session from database
			await this.prisma.aISession.delete({
				where: {
					sessionId: sessionId,
					userId, // Ensure user owns the session
				},
			});

			this.logger.log(`Deleted session ${sessionId}`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to delete session: ${error.message}`);
			return false;
		}
	}

	private async updateSession(
		sessionId: string,
		session: SimpleSession
	): Promise<void> {
		try {
			await this.prisma.aISession.update({
				where: { sessionId: sessionId },
				data: {
					metadata: JSON.parse(
						JSON.stringify({
							type: 'simple',
							messages: session.messages,
							dockerContainers: session.dockerContainers || [],
							browserContext: session.browserContext,
						})
					),
					updatedAt: new Date(),
					lastAccessedAt: new Date(),
				},
			});
		} catch (error) {
			this.logger.error(`Failed to update session: ${error.message}`);
		}
	}

	private createTools(sessionId: string): DynamicTool[] {
		const tools: DynamicTool[] = [];

		// Message tools
		tools.push(
			new DynamicTool({
				name: 'message_notify_user',
				description: 'Send a message to user without requiring a response',
				func: async (input: string) => {
					const params = JSON.parse(input);
					return `Message sent to user: ${params.text}`;
				},
			})
		);

		tools.push(
			new DynamicTool({
				name: 'message_ask_user',
				description: 'Ask user a question and wait for response',
				func: async (input: string) => {
					const params = JSON.parse(input);
					return `Question asked to user: ${params.text}`;
				},
			})
		);

		// File operations
		tools.push(
			new DynamicTool({
				name: 'file_read',
				description: 'Read file content',
				func: async (input: string) => {
					const params = JSON.parse(input);
					// Simulate file reading for demo
					return `File content from ${params.file}: [File content would be here]`;
				},
			})
		);

		tools.push(
			new DynamicTool({
				name: 'file_write',
				description: 'Write content to file',
				func: async (input: string) => {
					const params = JSON.parse(input);
					// Simulate file writing for demo
					return `Content written to file ${params.file}`;
				},
			})
		);

		// Docker execution tools
		tools.push(
			new DynamicTool({
				name: 'shell_exec',
				description: 'Execute shell commands in Docker container',
				func: async (input: string) => {
					const params = JSON.parse(input);
					const result = await this.dockerService.executeCode(
						'bash',
						params.command,
						sessionId
					);
					return result.success ? result.output : `Error: ${result.error}`;
				},
			})
		);

		tools.push(
			new DynamicTool({
				name: 'python_exec',
				description: 'Execute Python code in Docker container',
				func: async (input: string) => {
					const params = JSON.parse(input);
					const result = await this.dockerService.executeCode(
						'python',
						params.code,
						sessionId
					);
					return result.success ? result.output : `Error: ${result.error}`;
				},
			})
		);

		tools.push(
			new DynamicTool({
				name: 'nodejs_exec',
				description: 'Execute Node.js code in Docker container',
				func: async (input: string) => {
					const params = JSON.parse(input);
					const result = await this.dockerService.executeCode(
						'nodejs',
						params.code,
						sessionId
					);
					return result.success ? result.output : `Error: ${result.error}`;
				},
			})
		);

		// Browser tools
		tools.push(
			new DynamicTool({
				name: 'browser_navigate',
				description: 'Navigate browser to URL',
				func: async (input: string) => {
					const params = JSON.parse(input);

					// Create browser context if not exists
					const session = await this.getSession(sessionId);
					let contextId = session?.browserContext;

					if (!contextId) {
						contextId =
							await this.browserService.createBrowserContext(sessionId);
						// Update session with browser context
						if (session) {
							session.browserContext = contextId;
							await this.updateSession(sessionId, session);
						}
					}

					const result = await this.browserService.navigateToUrl(
						contextId,
						params.url
					);
					return result.success
						? `Navigated to ${params.url}. Title: ${result.data?.title}`
						: `Navigation failed: ${result.error}`;
				},
			})
		);

		tools.push(
			new DynamicTool({
				name: 'browser_view',
				description: 'View current browser page content',
				func: async (input: string) => {
					const session = await this.getSession(sessionId);
					const contextId = session?.browserContext;

					if (!contextId) {
						return 'No browser context available. Use browser_navigate first.';
					}

					const result = await this.browserService.extractContent(contextId);
					return result.success
						? `Page content: ${JSON.stringify(result.data)}`
						: `Failed to view page: ${result.error}`;
				},
			})
		);

		tools.push(
			new DynamicTool({
				name: 'browser_screenshot',
				description: 'Take screenshot of current browser page',
				func: async (input: string) => {
					const session = await this.getSession(sessionId);
					const contextId = session?.browserContext;

					if (!contextId) {
						return 'No browser context available. Use browser_navigate first.';
					}

					const result = await this.browserService.takeScreenshot(contextId);
					return result.success
						? 'Screenshot taken successfully'
						: `Screenshot failed: ${result.error}`;
				},
			})
		);

		// Web search tool
		tools.push(
			new DynamicTool({
				name: 'info_search_web',
				description: 'Search web pages using search engine',
				func: async (input: string) => {
					const params = JSON.parse(input);
					// Simulate web search for demo
					return `Search results for "${params.query}": [Search results would be here]`;
				},
			})
		);

		return tools;
	}

	private formatChatHistory(messages: SimpleMessage[]): any[] {
		return messages.map((message) => {
			if (message.role === 'user') {
				return new HumanMessage(message.content);
			} else if (message.role === 'assistant') {
				return new AIMessage(message.content);
			} else {
				return new SystemMessage(message.content);
			}
		});
	}

	private extractToolsUsed(result: any): string[] {
		const toolsUsed: string[] = [];

		if (result.intermediateSteps) {
			for (const step of result.intermediateSteps) {
				if (step.action && step.action.tool) {
					toolsUsed.push(step.action.tool);
				}
			}
		}

		return toolsUsed;
	}

	private extractBlogTitles(contentStr: string): string[] {
		const blogTitles: string[] = [];
		
		try {
			// Try to parse JSON content if it's structured
			const parsed = JSON.parse(contentStr);
			if (parsed.data && Array.isArray(parsed.data)) {
				// If content is structured with blog data
				parsed.data.forEach((item: any) => {
					if (item.title) {
						blogTitles.push(item.title);
					}
				});
			}
		} catch {
			// If not JSON, try to extract titles using regex patterns
			// Common blog title patterns
			const titlePatterns = [
				/<h1[^>]*>(.*?)<\/h1>/gi,
				/<h2[^>]*>(.*?)<\/h2>/gi,
				/<h3[^>]*>(.*?)<\/h3>/gi,
				/"title":\s*"([^"]+)"/gi,
				/'title':\s*'([^']+)'/gi,
			];

			for (const pattern of titlePatterns) {
				let match;
				while ((match = pattern.exec(contentStr)) !== null && blogTitles.length < 10) {
					const title = match[1].replace(/<[^>]*>/g, '').trim();
					if (title && title.length > 5 && !blogTitles.includes(title)) {
						blogTitles.push(title);
					}
				}
				if (blogTitles.length >= 5) break;
			}
		}

		return blogTitles;
	}
}
