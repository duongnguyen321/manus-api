import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue.service';
import { AIService } from '../../ai/ai.service';
import { JobStatus, MessageRole } from '@prisma/client';

@Processor('chat-processing')
export class ChatProcessor {
  private readonly logger = new Logger(ChatProcessor.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private aiService: AIService,
  ) {}

  @Process('process-chat')
  async processChatMessage(job: Job): Promise<any> {
    const { sessionId, taskId, payload } = job.data;
    
    try {
      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.ACTIVE);
      
      this.logger.log(`Processing chat message for session: ${sessionId}`);

      // Get session details
      const session = await this.prisma.aISession.findUnique({
        where: { id: sessionId },
        include: {
          user: true,
        },
      });

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Create chat message record
      const chatMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MessageRole.USER,
          content: payload.message,
          metadata: payload.metadata || {},
          queueJobId: await this.getQueueJobId(job.id.toString()),
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
        .map(msg => ({
          role: msg.role === MessageRole.USER ? 'user' as const : 'assistant' as const,
          content: msg.content,
        }));

      // Add the current message
      conversationHistory.push({
        role: 'user' as const,
        content: payload.message,
      });

      // Generate AI response using real AI service
      const aiResponse = await this.aiService.chatCompletion(conversationHistory, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Create AI response message
      const aiMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MessageRole.ASSISTANT,
          content: aiResponse,
          metadata: { 
            model: 'ai-service',
            processingTime: Date.now() - job.timestamp,
            conversationLength: conversationHistory.length,
          },
          isProcessed: true,
        },
      });

      // Update session last accessed
      await this.prisma.aISession.update({
        where: { id: session.id },
        data: { lastAccessedAt: new Date() },
      });

      const result = {
        userMessage: chatMessage,
        aiResponse: aiMessage,
        sessionId: session.sessionId,
      };

      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.COMPLETED, result);
      
      this.logger.log(`Chat processing completed for session: ${sessionId}`);
      return result;

    } catch (error) {
      this.logger.error(`Chat processing failed for session ${sessionId}: ${error.message}`, error.stack);
      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  // Removed generateAIResponse method as we now use real AI service

  private async getQueueJobId(jobId: string): Promise<string> {
    const queueJob = await this.prisma.queueJob.findUnique({
      where: { jobId },
      select: { id: true },
    });
    return queueJob?.id;
  }
}