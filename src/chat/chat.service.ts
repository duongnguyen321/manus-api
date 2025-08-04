import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AIService } from '../ai/ai.service';
import { 
  SendMessageDto, 
  ChatMessageResponseDto, 
  ChatHistoryResponseDto,
  ChatSessionStatsDto,
  StreamChatDto 
} from './dto/chat.dto';
import { MessageRole, SessionStatus } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private aiService: AIService,
  ) {}

  async sendMessage(sendMessageDto: SendMessageDto): Promise<ChatMessageResponseDto> {
    const { sessionId, message, metadata, processInBackground = true, priority = 0 } = sendMessageDto;

    try {
      // Verify session exists and is active
      const session = await this.validateSession(sessionId);

      // Create user message
      const userMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MessageRole.USER,
          content: message,
          metadata: metadata || {},
          isProcessed: false,
        },
      });

      let queueJobId: string | undefined;

      if (processInBackground) {
        // Add message to processing queue
        const job = await this.queueService.addChatProcessingJob({
          sessionId: session.id,
          taskType: 'chat-processing',
          payload: {
            messageId: userMessage.id,
            message,
            metadata,
          },
          priority,
        });

        queueJobId = job.id.toString();

        // Update message with job ID
        await this.prisma.chatMessage.update({
          where: { id: userMessage.id },
          data: { queueJobId },
        });

        this.logger.log(`Message queued for background processing: ${userMessage.id}, Job: ${queueJobId}`);
      } else {
        // Process immediately (synchronous)
        await this.processMessageSync(userMessage, session);
      }

      // Update session last accessed
      await this.prisma.aISession.update({
        where: { id: session.id },
        data: { lastAccessedAt: new Date() },
      });

      return this.mapMessageToResponse(userMessage, queueJobId);

    } catch (error) {
      this.logger.error(`Failed to send message for session ${sessionId}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  async getChatHistory(
    sessionId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ChatHistoryResponseDto> {
    const session = await this.validateSession(sessionId);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          queueJob: {
            select: { id: true, status: true },
          },
        },
      }),
      this.prisma.chatMessage.count({
        where: { sessionId: session.id },
      }),
    ]);

    return {
      messages: messages.map(msg => this.mapMessageToResponse(msg)),
      total,
      page,
      limit,
      sessionId,
    };
  }

  async streamChat(streamChatDto: StreamChatDto): Promise<AsyncGenerator<string, void, unknown>> {
    const { sessionId, message, metadata } = streamChatDto;

    // Stream real AI responses
    return this.streamRealResponse(sessionId, message, metadata);
  }

  async getSessionStats(sessionId: string): Promise<ChatSessionStatsDto> {
    const session = await this.validateSession(sessionId);

    const [
      totalMessages,
      messagesByRole,
      lastMessage,
      pendingMessages,
    ] = await Promise.all([
      this.prisma.chatMessage.count({
        where: { sessionId: session.id },
      }),
      this.prisma.chatMessage.groupBy({
        by: ['role'],
        where: { sessionId: session.id },
        _count: { role: true },
      }),
      this.prisma.chatMessage.findFirst({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      }),
      this.prisma.chatMessage.count({
        where: { 
          sessionId: session.id,
          isProcessed: false,
        },
      }),
    ]);

    const roleCountMap = messagesByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average response time (mock calculation)
    const averageResponseTime = await this.calculateAverageResponseTime(session.id);

    return {
      sessionId,
      totalMessages,
      messagesByRole: roleCountMap,
      averageResponseTime,
      lastMessageAt: lastMessage?.timestamp || session.createdAt,
      sessionCreatedAt: session.createdAt,
      pendingMessages,
    };
  }

  async deleteMessage(messageId: string): Promise<void> {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { queueJob: true },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    try {
      // If message has a queue job, try to cancel it
      if (message.queueJobId && !message.isProcessed) {
        try {
          await this.queueService.removeJob(message.queueJob?.jobId);
        } catch (error) {
          this.logger.warn(`Failed to cancel queue job for message ${messageId}: ${error.message}`);
        }
      }

      // Delete the message
      await this.prisma.chatMessage.delete({
        where: { id: messageId },
      });

      this.logger.log(`Message deleted: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to delete message ${messageId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete message');
    }
  }

  async clearChatHistory(sessionId: string): Promise<void> {
    const session = await this.validateSession(sessionId);

    try {
      // Get all messages with queue jobs
      const messagesWithJobs = await this.prisma.chatMessage.findMany({
        where: { 
          sessionId: session.id,
          queueJobId: { not: null },
          isProcessed: false,
        },
        include: { queueJob: true },
      });

      // Cancel pending queue jobs
      for (const message of messagesWithJobs) {
        if (message.queueJob?.jobId) {
          try {
            await this.queueService.removeJob(message.queueJob.jobId);
          } catch (error) {
            this.logger.warn(`Failed to cancel queue job ${message.queueJob.jobId}: ${error.message}`);
          }
        }
      }

      // Delete all chat messages for the session
      await this.prisma.chatMessage.deleteMany({
        where: { sessionId: session.id },
      });

      this.logger.log(`Chat history cleared for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to clear chat history for session ${sessionId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to clear chat history');
    }
  }

  private async validateSession(sessionId: string): Promise<any> {
    const session = await this.prisma.aISession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status === SessionStatus.EXPIRED) {
      throw new BadRequestException('Session has expired');
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      throw new BadRequestException('Session has expired');
    }

    return session;
  }

  private async processMessageSync(message: any, session: any): Promise<void> {
    const startTime = Date.now();

    try {
      // Get conversation history for context
      const recentMessages = await this.prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      // Prepare conversation context
      const conversationHistory = recentMessages
        .reverse()
        .slice(0, -1) // Exclude the current message
        .map(msg => ({
          role: msg.role === MessageRole.USER ? 'user' as const : 'assistant' as const,
          content: msg.content,
        }));

      // Add current message
      conversationHistory.push({
        role: 'user' as const,
        content: message.content,
      });

      // Generate real AI response
      const aiResponse = await this.aiService.generateText(
        conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
        {
          maxTokens: 1000,
          temperature: 0.7,
        }
      );

      const responseTime = Date.now() - startTime;

      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MessageRole.ASSISTANT,
          content: aiResponse,
          metadata: { 
            processingMode: 'synchronous',
            responseTime,
            conversationLength: conversationHistory.length,
          },
          isProcessed: true,
        },
      });

      // Mark original message as processed
      await this.prisma.chatMessage.update({
        where: { id: message.id },
        data: { isProcessed: true },
      });

      this.logger.log(`Message processed synchronously in ${responseTime}ms`);
    } catch (error) {
      this.logger.error(`Failed to process message synchronously: ${error.message}`);
      
      // Create error response
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MessageRole.ASSISTANT,
          content: 'I apologize, but I encountered an error while processing your message. Please try again.',
          metadata: { 
            processingMode: 'synchronous',
            error: error.message,
            responseTime: Date.now() - startTime,
          },
          isProcessed: true,
        },
      });

      // Mark original message as processed with error
      await this.prisma.chatMessage.update({
        where: { id: message.id },
        data: { 
          isProcessed: true,
          metadata: { ...message.metadata, processingError: error.message }
        },
      });
    }
  }

  private async *streamRealResponse(
    sessionId: string, 
    message: string, 
    metadata?: any
  ): AsyncGenerator<string, void, unknown> {
    const session = await this.validateSession(sessionId);

    // Create user message
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: MessageRole.USER,
        content: message,
        metadata: metadata || {},
        isProcessed: true,
      },
    });

    // Get conversation history for context
    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Prepare conversation context
    const conversationHistory = recentMessages
      .reverse()
      .slice(0, -1) // Exclude the message we just created
      .map(msg => ({
        role: msg.role === MessageRole.USER ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

    // Add the current message
    conversationHistory.push({
      role: 'user' as const,
      content: message,
    });

    let accumulatedResponse = '';

    try {
      // Stream AI response
      for await (const chunk of this.aiService.streamChatCompletion(conversationHistory)) {
        accumulatedResponse += chunk;
        yield JSON.stringify({ 
          type: 'chunk', 
          content: chunk,
          accumulated: accumulatedResponse,
          messageId: userMessage.id,
        }) + '\n';
      }

      // Create final AI message
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MessageRole.ASSISTANT,
          content: accumulatedResponse,
          metadata: { 
            processingMode: 'streaming',
            conversationLength: conversationHistory.length,
          },
          isProcessed: true,
        },
      });

      yield JSON.stringify({ 
        type: 'complete', 
        content: accumulatedResponse,
        messageId: userMessage.id,
      }) + '\n';
    } catch (error) {
      this.logger.error(`Streaming failed: ${error.message}`, error.stack);
      yield JSON.stringify({ 
        type: 'error', 
        error: 'Streaming failed',
        messageId: userMessage.id,
      }) + '\n';
    }
  }

  private async calculateAverageResponseTime(sessionId: string): Promise<number> {
    try {
      // Get AI messages with response time metadata
      const aiMessages = await this.prisma.chatMessage.findMany({
        where: { 
          sessionId, 
          role: MessageRole.ASSISTANT,
          metadata: {
            not: null,
          },
        },
        select: { metadata: true },
      });

      if (aiMessages.length === 0) return 0;

      // Calculate average from actual response times
      const responseTimes = aiMessages
        .map(msg => {
          const metadata = msg.metadata as any;
          return metadata?.responseTime || 0;
        })
        .filter(time => time > 0);

      if (responseTimes.length === 0) return 0;

      const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      return Math.round(average);
    } catch (error) {
      this.logger.error(`Failed to calculate average response time: ${error.message}`);
      return 0;
    }
  }

  private mapMessageToResponse(message: any, queueJobId?: string): ChatMessageResponseDto {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata,
      timestamp: message.timestamp,
      isProcessed: message.isProcessed,
      queueJobId: queueJobId || message.queueJobId,
    };
  }
}