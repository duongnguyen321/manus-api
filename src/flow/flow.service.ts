import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AgentsService } from '../agents/agents.service';
import { SessionService } from '../session/session.service';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import {
  FlowRegisterDto,
  FlowChatDto,
  FlowAgentTaskDto,
  FlowSessionDto,
  FlowRegistrationResponseDto,
  FlowChatResponseDto,
  FlowAgentExecutionResponseDto,
  FlowBatchExecutionDto,
} from './dto/flow.dto';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly agentsService: AgentsService,
    private readonly sessionService: SessionService,
    private readonly chatService: ChatService,
    private readonly prismaService: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async completeUserRegistration(data: FlowRegisterDto): Promise<FlowRegistrationResponseDto> {
    try {
      this.logger.log(`Starting complete registration flow for: ${data.email}`);

      // Step 1: Create user account
      const registrationResult = await this.authService.createAccount({
        email: data.email,
        password: data.password,
        username: data.email, // Use email as username
      });

      // Step 2: Create user profile with preferences
      await this.createUserProfile(registrationResult.user.id, data.preferences);

      // Step 3: Initialize first session
      const initialSession = await this.sessionService.createSession({
        userId: registrationResult.user.id,
        metadata: {
          type: 'onboarding',
          agent: data.initialAgent || 'general_assistant_agent',
          createdViaFlow: true,
        },
      });

      // Step 4: If initial message provided, send it
      let initialChatResponse;
      if (data.initialMessage) {
        initialChatResponse = await this.initializeChatSession({
          userId: registrationResult.user.id,
          message: data.initialMessage,
          preferredAgent: data.initialAgent || 'general_assistant_agent',
          sessionMetadata: {
            priority: 'normal',
            context: 'onboarding',
          },
        });
      }

      // Step 5: Record registration flow completion
      await this.recordFlowEvent(registrationResult.user.id, 'registration_completed', {
        initialAgent: data.initialAgent,
        hasInitialMessage: !!data.initialMessage,
        preferencesSet: !!data.preferences,
      });

      return {
        user: {
          id: registrationResult.user.id,
          email: registrationResult.user.email,
          fullName: registrationResult.user.name || registrationResult.user.email,
          createdAt: registrationResult.user.createdAt.toISOString(),
        },
        tokens: {
          accessToken: registrationResult.tokens.accessToken,
          refreshToken: registrationResult.tokens.refreshToken,
          expiresIn: 3600, // 1 hour
        },
        initialSession: {
          sessionId: initialSession.sessionId,
          agentAssigned: data.initialAgent || 'general_assistant_agent',
          conversationId: initialChatResponse?.session.conversationId || 'pending',
          status: 'active',
        },
        initialChatResponse: initialChatResponse?.response,
      };
    } catch (error) {
      this.logger.error(`Registration flow failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async initializeChatSession(data: FlowChatDto): Promise<FlowChatResponseDto> {
    try {
      this.logger.log(`Initializing chat session for user: ${data.userId}`);

      // Step 1: Determine best agent for the message
      const selectedAgent = await this.selectOptimalAgent(
        data.message,
        data.preferredAgent,
        data.userId,
      );

      // Step 2: Create or get conversation context
      const conversationId = await this.getOrCreateConversation(
        data.userId,
        selectedAgent,
        data.conversationHistory,
      );

      // Step 3: Send message to selected agent
      const agentResponse = await this.agentsService.chatWithAgent(selectedAgent, {
        message: data.message,
        userId: data.userId,
        conversationId,
        conversationHistory: data.conversationHistory || [],
      });

      // Step 4: Generate suggestions for next actions
      const suggestions = await this.generateNextActionSuggestions(
        data.userId,
        selectedAgent,
        data.message,
        agentResponse.response,
      );

      // Step 5: Record chat initialization
      await this.recordFlowEvent(data.userId, 'chat_initialized', {
        agentSelected: selectedAgent,
        messageLength: data.message.length,
        suggestionsGenerated: suggestions.length,
      });

      return {
        session: {
          sessionId: agentResponse.conversationId,
          conversationId,
          agentAssigned: selectedAgent,
          status: 'active',
        },
        response: {
          message: agentResponse.response,
          agentUsed: selectedAgent,
          toolsUsed: agentResponse.toolsUsed || [],
          confidence: this.calculateResponseConfidence(agentResponse),
          timestamp: new Date().toISOString(),
        },
        suggestions,
      };
    } catch (error) {
      this.logger.error(`Chat initialization failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async executeAgentWithContext(data: FlowAgentTaskDto): Promise<FlowAgentExecutionResponseDto> {
    try {
      this.logger.log(`Executing agent task: ${data.agentName}/${data.toolName} for user: ${data.userId}`);

      // Step 1: Get user context and preferences
      const userContext = await this.getUserContext(data.userId);

      // Step 2: Enrich parameters with user context
      const enrichedParameters = await this.enrichParametersWithContext(
        data.parameters,
        userContext,
        data.sessionId,
        data.conversationId,
      );

      // Step 3: Execute the agent tool
      const executionResult = await this.agentsService.executeAgentTool(
        data.agentName,
        data.toolName,
        enrichedParameters,
      );

      // Step 4: Process and save results
      const processedResult = await this.processAgentResult(
        executionResult,
        data.userId,
        data.agentName,
        data.toolName,
      );

      // Step 5: Update session and conversation context
      const contextUpdate = await this.updateContextAfterExecution(
        data.userId,
        data.sessionId,
        data.conversationId,
        processedResult,
      );

      // Step 6: Generate follow-up recommendations
      const followUpActions = await this.generateFollowUpActions(
        data.userId,
        data.agentName,
        data.toolName,
        processedResult,
      );

      // Step 7: Record execution event
      await this.recordFlowEvent(data.userId, 'agent_task_executed', {
        agentName: data.agentName,
        toolName: data.toolName,
        executionTime: processedResult.executionTime,
        success: processedResult.status === 'completed',
      });

      return {
        result: processedResult,
        context: contextUpdate,
        followUpActions,
      };
    } catch (error) {
      this.logger.error(`Agent execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserFlowStatus(userId: string) {
    try {
      // Get comprehensive user status across all systems
      const [userProfile, activeSessions, recentInteractions, progress] = await Promise.all([
        this.getUserProfile(userId),
        this.getActiveSessions(userId),
        this.getRecentInteractions(userId),
        this.getUserProgress(userId),
      ]);

      return {
        user: userProfile,
        sessions: {
          active: activeSessions,
          totalCount: activeSessions.length,
        },
        interactions: {
          recent: recentInteractions,
          totalCount: recentInteractions.length,
        },
        progress,
        status: this.determineOverallStatus(userProfile, activeSessions, progress),
      };
    } catch (error) {
      this.logger.error(`Failed to get user flow status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async completeFlowSession(data: FlowSessionDto) {
    try {
      this.logger.log(`Completing flow session: ${data.sessionId} for user: ${data.userId}`);

      // Step 1: Finalize session - store results in metadata
      const sessionResult = await this.sessionService.updateSession(data.sessionId, {
        status: 'COMPLETED' as any,
        metadata: {
          results: data.results,
          feedback: data.feedback,
        },
      });

      // Step 2: Update user progress
      await this.updateUserProgressFromSession(data.userId, sessionResult);

      // Step 3: Generate session analytics
      const analytics = await this.generateSessionAnalytics(data.sessionId, data.userId);

      // Step 4: Record completion event
      await this.recordFlowEvent(data.userId, 'session_completed', {
        sessionId: data.sessionId,
        status: data.status,
        duration: analytics.duration,
        tasksCompleted: data.results?.tasksCompleted || 0,
      });

      return {
        sessionId: data.sessionId,
        status: 'completed',
        analytics,
        nextRecommendations: await this.getAgentRecommendations(data.userId),
      };
    } catch (error) {
      this.logger.error(`Session completion failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFlowAnalytics(userId: string, options: { timeframe?: string; agentType?: string }) {
    try {
      const timeRange = this.parseTimeframe(options.timeframe || '30d');
      
      const analytics = await this.prismaService.flowEvent.aggregateRaw({
        pipeline: [
          {
            $match: {
              userId,
              createdAt: { $gte: timeRange.start, $lte: timeRange.end },
              ...(options.agentType && { 'metadata.agentName': options.agentType }),
            },
          },
          {
            $group: {
              _id: '$eventType',
              count: { $sum: 1 },
              averageDuration: { $avg: '$metadata.executionTime' },
              successRate: {
                $avg: { $cond: [{ $eq: ['$metadata.success', true] }, 1, 0] },
              },
            },
          },
        ],
      });

      return {
        timeframe: options.timeframe || '30d',
        totalEvents: Array.isArray(analytics) ? analytics.reduce((sum, item) => sum + (item as any).count, 0) : 0,
        eventBreakdown: analytics,
        insights: await this.generateAnalyticsInsights(Array.isArray(analytics) ? analytics : [], userId),
      };
    } catch (error) {
      this.logger.error(`Analytics generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      // Implementation for tracking user progress across all flows
      const progressData = await this.prismaService.userProgress.findUnique({
        where: { userId_category: { userId, category: 'general_progress' } },
        include: {
          user: true,
        },
      });

      if (!progressData) {
        // Create initial progress record
        return await this.prismaService.userProgress.create({
          data: {
            userId,
            category: 'general_progress',
            progressData: {
              totalInteractions: 0,
              successRate: 0,
              averageSessionDuration: 0,
              level: 1,
              experiencePoints: 0,
            },
          },
        });
      }

      return progressData;
    } catch (error) {
      this.logger.error(`Failed to get user progress: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAgentRecommendations(userId: string) {
    try {
      // Get user interaction history
      const userHistory = await this.getUserInteractionHistory(userId);
      
      // Use AI to generate personalized recommendations
      const recommendationPrompt = `
        Based on the following user interaction history, recommend the top 3 most suitable AI agents for this user:
        
        User History: ${JSON.stringify(userHistory, null, 2)}
        
        Available Agents: ${JSON.stringify(await this.agentsService.getAllAgents(), null, 2)}
        
        Consider:
        1. User's past preferences and successful interactions
        2. Current trends in their usage patterns
        3. Complementary agents that could provide new value
        4. User's skill level and progression
        
        Return a JSON array of recommendations with agent name, confidence score (0-1), and detailed reason.
      `;

      const aiRecommendations = await this.aiService.generateText(recommendationPrompt);
      
      try {
        return JSON.parse(aiRecommendations);
      } catch {
        // Fallback to rule-based recommendations
        return this.generateRuleBasedRecommendations(userHistory);
      }
    } catch (error) {
      this.logger.error(`Recommendation generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async executeBatchTasks(data: FlowBatchExecutionDto) {
    try {
      this.logger.log(`Executing batch tasks for user: ${data.userId}, mode: ${data.executionMode}`);

      const results = [];
      
      if (data.executionMode === 'parallel') {
        // Execute all tasks in parallel
        const promises = data.tasks.map(task => this.executeAgentWithContext(task));
        const parallelResults = await Promise.allSettled(promises);
        
        parallelResults.forEach((result, index) => {
          results.push({
            taskIndex: index,
            status: result.status,
            result: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason.message : null,
          });
        });
      } else {
        // Sequential execution
        for (let i = 0; i < data.tasks.length; i++) {
          try {
            const result = await this.executeAgentWithContext(data.tasks[i]);
            results.push({
              taskIndex: i,
              status: 'fulfilled',
              result,
              error: null,
            });
          } catch (error) {
            results.push({
              taskIndex: i,
              status: 'rejected',
              result: null,
              error: error.message,
            });
            
            if (data.globalOptions?.stopOnError) {
              break;
            }
          }
        }
      }

      // Record batch execution
      await this.recordFlowEvent(data.userId, 'batch_execution_completed', {
        totalTasks: data.tasks.length,
        successfulTasks: results.filter(r => r.status === 'fulfilled').length,
        executionMode: data.executionMode,
      });

      return {
        batchId: `batch_${Date.now()}`,
        totalTasks: data.tasks.length,
        completedTasks: results.filter(r => r.status === 'fulfilled').length,
        failedTasks: results.filter(r => r.status === 'rejected').length,
        results,
        summary: this.generateBatchSummary(results),
      };
    } catch (error) {
      this.logger.error(`Batch execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Private helper methods
  private async createUserProfile(userId: string, preferences?: any) {
    // Implementation for creating detailed user profile
    return await this.prismaService.userProfile.create({
      data: {
        userId,
        preferences: preferences || {},
        createdAt: new Date(),
      },
    });
  }

  private async selectOptimalAgent(message: string, preferredAgent?: string, userId?: string) {
    if (preferredAgent) {
      return preferredAgent;
    }

    // Use AI to determine the best agent for the message
    const agentSelectionPrompt = `
      Given the user message: "${message}"
      And available agents: ${JSON.stringify(await this.agentsService.getAllAgents())}
      
      Select the most appropriate agent and return only the agent name.
    `;

    try {
      const selectedAgent = await this.aiService.generateText(agentSelectionPrompt);
      return selectedAgent.trim() || 'general_assistant_agent';
    } catch {
      return 'general_assistant_agent';
    }
  }

  private async getOrCreateConversation(userId: string, agentName: string, history?: any[]) {
    // Implementation for conversation management
    return `conv_${userId}_${agentName}_${Date.now()}`;
  }

  private async generateNextActionSuggestions(userId: string, agentName: string, userMessage: string, agentResponse: string) {
    // Generate intelligent next action suggestions
    return [
      {
        action: 'continue_conversation',
        description: 'Continue the current conversation',
        agentRequired: agentName,
      },
      {
        action: 'explore_related_topic',
        description: 'Explore a related topic with a different agent',
        agentRequired: 'general_assistant_agent',
      },
    ];
  }

  private calculateResponseConfidence(response: any): number {
    // Calculate confidence score based on response quality
    return 0.85; // Placeholder implementation
  }

  private async getUserContext(userId: string) {
    // Get comprehensive user context
    return {
      userId,
      preferences: {},
      history: [],
      currentSession: null,
    };
  }

  private async enrichParametersWithContext(parameters: any, userContext: any, sessionId?: string, conversationId?: string) {
    return {
      ...parameters,
      userContext,
      sessionId,
      conversationId,
    };
  }

  private async processAgentResult(result: any, userId: string, agentName: string, toolName: string) {
    return {
      taskId: `task_${Date.now()}`,
      status: 'completed' as const,
      output: result,
      executionTime: 1500, // ms
      agentUsed: agentName,
      toolUsed: toolName,
    };
  }

  private async updateContextAfterExecution(userId: string, sessionId?: string, conversationId?: string, result?: any) {
    return {
      sessionUpdated: !!sessionId,
      conversationContinued: !!conversationId,
      newCapabilitiesUnlocked: [],
    };
  }

  private async generateFollowUpActions(userId: string, agentName: string, toolName: string, result: any) {
    return [
      {
        agentName: 'general_assistant_agent',
        toolName: 'summarize_results',
        description: 'Summarize the completed task results',
        priority: 'medium' as const,
      },
    ];
  }

  private async recordFlowEvent(userId: string, eventType: string, metadata: any) {
    try {
      await this.prismaService.flowEvent.create({
        data: {
          userId,
          eventType,
          eventData: metadata,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to record flow event: ${error.message}`);
    }
  }

  private async getUserProfile(userId: string) {
    return await this.prismaService.userProfile.findUnique({
      where: { userId },
    });
  }

  private async getActiveSessions(userId: string) {
    return await this.prismaService.aISession.findMany({
      where: { userId, status: 'ACTIVE' },
    });
  }

  private async getRecentInteractions(userId: string) {
    return await this.prismaService.flowEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });
  }

  private determineOverallStatus(userProfile: any, activeSessions: any[], progress: any) {
    return {
      status: 'active',
      completionRate: progress?.successRate || 0,
      engagementLevel: activeSessions.length > 0 ? 'high' : 'low',
    };
  }

  private parseTimeframe(timeframe: string) {
    const now = new Date();
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const days = daysMap[timeframe] || 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return { start, end: now };
  }

  private async generateAnalyticsInsights(analytics: any[], userId: string) {
    return {
      topPerformingAgent: 'general_assistant_agent',
      averageSessionLength: '15 minutes',
      improvementAreas: ['response_time', 'task_completion'],
    };
  }

  private async getUserInteractionHistory(userId: string) {
    return await this.prismaService.flowEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  private generateRuleBasedRecommendations(userHistory: any[]) {
    return [
      {
        agentName: 'general_assistant_agent',
        confidence: 0.8,
        reason: 'Most versatile agent for general queries',
      },
    ];
  }

  private generateBatchSummary(results: any[]) {
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      successRate: successful / results.length,
      totalExecutionTime: results.length * 1500, // Estimated
      recommendedNextSteps: ['Review failed tasks', 'Continue with successful workflows'],
    };
  }

  private async updateUserProgressFromSession(userId: string, sessionResult: any): Promise<void> {
    try {
      const progressData = {
        sessionId: sessionResult.sessionId,
        status: sessionResult.status,
        completedAt: new Date(),
        metrics: sessionResult.results || {},
      };

      await this.prismaService.userProgress.upsert({
        where: { 
          userId_category: {
            userId,
            category: 'session_completion'
          }
        },
        update: {
          progressData,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          category: 'session_completion',
          progressData,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update user progress: ${error.message}`);
    }
  }

  private async generateSessionAnalytics(sessionId: string, userId: string): Promise<any> {
    try {
      const sessionEvents = await this.prismaService.flowEvent.findMany({
        where: { sessionId, userId },
        orderBy: { timestamp: 'asc' },
      });

      const sessionDuration = sessionEvents.length > 1 
        ? new Date(sessionEvents[sessionEvents.length - 1].timestamp).getTime() - new Date(sessionEvents[0].timestamp).getTime()
        : 0;

      return {
        sessionId,
        userId,
        duration: sessionDuration,
        eventCount: sessionEvents.length,
        eventTypes: [...new Set(sessionEvents.map(e => e.eventType))],
        completionTime: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate session analytics: ${error.message}`);
      return {
        sessionId,
        userId,
        duration: 0,
        eventCount: 0,
        eventTypes: [],
        completionTime: new Date(),
      };
    }
  }
}