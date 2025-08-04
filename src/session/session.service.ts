import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, UpdateSessionDto, SessionConfigDto, SessionResponseDto } from './dto/session.dto';
import { SessionStatus, LogLevel } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private prisma: PrismaService) {}

  async createSession(createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
    const sessionId = uuidv4();
    
    try {
      const session = await this.prisma.aISession.create({
        data: {
          sessionId,
          userId: createSessionDto.userId,
          status: SessionStatus.ACTIVE,
          metadata: createSessionDto.metadata,
          expiresAt: createSessionDto.expiresAt ? new Date(createSessionDto.expiresAt) : null,
          lastAccessedAt: new Date(),
        },
        include: {
          user: true,
        },
      });

      // Log session creation
      await this.logSessionActivity(session.id, LogLevel.INFO, 'Session created', {
        sessionId: session.sessionId,
        userId: session.userId,
      });

      this.logger.log(`Session created: ${sessionId} for user: ${createSessionDto.userId || 'anonymous'}`);

      return this.mapSessionToResponse(session);
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create session');
    }
  }

  async getSession(sessionId: string): Promise<SessionResponseDto> {
    const session = await this.prisma.aISession.findUnique({
      where: { sessionId },
      include: {
        user: true,
        _count: {
          select: {
            chatMessages: true,
            generationTasks: true,
            editTasks: true,
            browserContexts: true,
            queueJobs: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Check if session is expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      await this.updateSessionStatus(sessionId, SessionStatus.EXPIRED);
      throw new BadRequestException('Session has expired');
    }

    // Update last accessed time
    await this.prisma.aISession.update({
      where: { sessionId },
      data: { lastAccessedAt: new Date() },
    });

    return this.mapSessionToResponse(session);
  }

  async updateSession(sessionId: string, updateSessionDto: UpdateSessionDto): Promise<SessionResponseDto> {
    const existingSession = await this.prisma.aISession.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    try {
      const updatedSession = await this.prisma.aISession.update({
        where: { sessionId },
        data: {
          status: updateSessionDto.status,
          metadata: updateSessionDto.metadata,
          expiresAt: updateSessionDto.expiresAt ? new Date(updateSessionDto.expiresAt) : undefined,
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });

      // Log session update
      await this.logSessionActivity(existingSession.id, LogLevel.INFO, 'Session updated', {
        sessionId,
        changes: updateSessionDto,
      });

      this.logger.log(`Session updated: ${sessionId}`);

      return this.mapSessionToResponse(updatedSession);
    } catch (error) {
      this.logger.error(`Failed to update session ${sessionId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update session');
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.prisma.aISession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    try {
      // Clean up related data first
      await this.cleanupSessionData(session.id);

      // Delete the session
      await this.prisma.aISession.delete({
        where: { sessionId },
      });

      this.logger.log(`Session deleted: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete session');
    }
  }

  async getUserSessions(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.aISession.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          _count: {
            select: {
              chatMessages: true,
              generationTasks: true,
              editTasks: true,
              browserContexts: true,
              queueJobs: true,
            },
          },
        },
      }),
      this.prisma.aISession.count({
        where: { userId },
      }),
    ]);

    return {
      sessions: sessions.map(session => this.mapSessionToResponse(session)),
      total,
      page,
      limit,
    };
  }

  async getActiveSessions(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.aISession.findMany({
        where: { status: SessionStatus.ACTIVE },
        skip,
        take: limit,
        orderBy: { lastAccessedAt: 'desc' },
        include: {
          user: true,
          _count: {
            select: {
              chatMessages: true,
              generationTasks: true,
              editTasks: true,
              browserContexts: true,
              queueJobs: true,
            },
          },
        },
      }),
      this.prisma.aISession.count({
        where: { status: SessionStatus.ACTIVE },
      }),
    ]);

    return {
      sessions: sessions.map(session => this.mapSessionToResponse(session)),
      total,
      page,
      limit,
    };
  }

  async updateSessionConfig(sessionId: string, config: SessionConfigDto): Promise<SessionResponseDto> {
    const session = await this.prisma.aISession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Update or create session config
    const existingConfig = await this.prisma.sessionConfig.findUnique({
      where: { sessionId },
    });

    if (existingConfig) {
      await this.prisma.sessionConfig.update({
        where: { sessionId },
        data: {
          browserEnabled: config.browserEnabled,
          aiEnabled: config.aiEnabled,
          queueEnabled: config.queueEnabled,
          maxConcurrentTasks: config.maxConcurrentTasks,
          settings: config.settings,
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.sessionConfig.create({
        data: {
          sessionId,
          browserEnabled: config.browserEnabled ?? false,
          aiEnabled: config.aiEnabled ?? true,
          queueEnabled: config.queueEnabled ?? true,
          maxConcurrentTasks: config.maxConcurrentTasks ?? 5,
          settings: config.settings,
        },
      });
    }

    // Log configuration update
    await this.logSessionActivity(session.id, LogLevel.INFO, 'Session configuration updated', {
      sessionId,
      config,
    });

    return this.getSession(sessionId);
  }

  async getSessionConfig(sessionId: string): Promise<SessionConfigDto> {
    const config = await this.prisma.sessionConfig.findUnique({
      where: { sessionId },
    });

    if (!config) {
      // Return default configuration
      return {
        browserEnabled: false,
        aiEnabled: true,
        queueEnabled: true,
        maxConcurrentTasks: 5,
        settings: {},
      };
    }

    return {
      browserEnabled: config.browserEnabled,
      aiEnabled: config.aiEnabled,
      queueEnabled: config.queueEnabled,
      maxConcurrentTasks: config.maxConcurrentTasks,
      settings: config.settings as any,
    };
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await this.prisma.aISession.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        status: {
          not: SessionStatus.EXPIRED,
        },
      },
    });

    let cleanedCount = 0;
    for (const session of expiredSessions) {
      try {
        await this.cleanupSessionData(session.id);
        await this.prisma.aISession.update({
          where: { id: session.id },
          data: { status: SessionStatus.EXPIRED },
        });
        cleanedCount++;
      } catch (error) {
        this.logger.error(`Failed to cleanup expired session ${session.sessionId}: ${error.message}`, error.stack);
      }
    }

    this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
    return cleanedCount;
  }

  private async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    await this.prisma.aISession.update({
      where: { sessionId },
      data: { status, updatedAt: new Date() },
    });
  }

  private async cleanupSessionData(sessionId: string): Promise<void> {
    // Clean up related data in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete session logs
      await tx.sessionLog.deleteMany({
        where: { sessionId },
      });

      // Delete queue jobs
      await tx.queueJob.deleteMany({
        where: { sessionId },
      });

      // Delete browser tasks and contexts
      const browserContexts = await tx.browserContext.findMany({
        where: { sessionId },
        select: { id: true },
      });

      for (const context of browserContexts) {
        await tx.browserTask.deleteMany({
          where: { contextId: context.id },
        });
      }

      await tx.browserContext.deleteMany({
        where: { sessionId },
      });

      // Delete tasks
      await tx.editTask.deleteMany({
        where: { sessionId },
      });

      await tx.generationTask.deleteMany({
        where: { sessionId },
      });

      // Delete chat messages
      await tx.chatMessage.deleteMany({
        where: { sessionId },
      });
    });
  }

  private async logSessionActivity(sessionId: string, level: LogLevel, message: string, data?: any): Promise<void> {
    try {
      await this.prisma.sessionLog.create({
        data: {
          sessionId,
          level,
          message,
          data,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log session activity: ${error.message}`, error.stack);
    }
  }

  private mapSessionToResponse(session: any): SessionResponseDto {
    return {
      sessionId: session.sessionId,
      status: session.status,
      userId: session.userId,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastAccessedAt,
      expiresAt: session.expiresAt,
      metadata: session.metadata,
    };
  }
}