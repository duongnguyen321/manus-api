import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalMessages: number;
  totalAgentExecutions: number;
  totalFiles: number;
  averageResponseTime: number;
  popularTools: Array<{ name: string; count: number }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
  };
}

export interface UserAnalytics {
  userId: string;
  totalChats: number;
  totalMessages: number;
  totalAgentExecutions: number;
  totalFiles: number;
  averageSessionDuration: number;
  mostUsedTools: Array<{ name: string; count: number }>;
  activityPattern: Array<{ hour: number; count: number }>;
  lastActive: Date;
}

export interface SystemMetrics {
  timestamp: Date;
  activeConnections: number;
  requestsPerMinute: number;
  responseTime: number;
  errorCount: number;
  memoryUsage: number;
  cpuUsage: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getSystemAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<AnalyticsData> {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const [
        totalUsers,
        activeUsers,
        totalChats,
        totalMessages,
        totalAgentExecutions,
        popularTools,
        systemHealth
      ] = await Promise.all([
        this.getTotalUsers(),
        this.getActiveUsers(startDate),
        this.getTotalChats(startDate),
        this.getTotalMessages(startDate),
        this.getTotalAgentExecutions(startDate),
        this.getPopularTools(startDate),
        this.getSystemHealth(),
      ]);

      const userEngagement = await this.getUserEngagement();
      const averageResponseTime = await this.getAverageResponseTime(startDate);

      return {
        totalUsers,
        activeUsers,
        totalChats,
        totalMessages,
        totalAgentExecutions,
        totalFiles: await this.getTotalFiles(startDate),
        averageResponseTime,
        popularTools,
        userEngagement,
        systemHealth,
      };
    } catch (error) {
      this.logger.error(`Failed to get system analytics: ${error.message}`);
      throw error;
    }
  }

  async getUserAnalytics(userId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '7d'): Promise<UserAnalytics> {
    try {
      const startDate = this.getStartDate(timeRange);

      const [
        totalChats,
        totalMessages,
        totalAgentExecutions,
        mostUsedTools,
        activityPattern,
        lastActive
      ] = await Promise.all([
        this.getUserChats(userId, startDate),
        this.getUserMessages(userId, startDate),
        this.getUserAgentExecutions(userId, startDate),
        this.getUserMostUsedTools(userId, startDate),
        this.getUserActivityPattern(userId, startDate),
        this.getUserLastActive(userId),
      ]);

      const averageSessionDuration = await this.getAverageSessionDuration(userId, startDate);

      return {
        userId,
        totalChats,
        totalMessages,
        totalAgentExecutions,
        totalFiles: await this.getTotalFiles(startDate),
        averageSessionDuration,
        mostUsedTools,
        activityPattern,
        lastActive,
      };
    } catch (error) {
      this.logger.error(`Failed to get user analytics: ${error.message}`);
      throw error;
    }
  }

  async recordMetric(event: string, userId?: string, metadata?: any): Promise<void> {
    try {
      // Record in database
      await this.prismaService.analyticsEvent.create({
        data: {
          eventType: event,
          userId,
          data: metadata || {},
          timestamp: new Date(),
          metadata: { source: 'analytics-service' }
        }
      });

      this.logger.debug(`Metric recorded: ${event} for user ${userId || 'system'}`);
    } catch (error) {
      this.logger.error(`Failed to record metric: ${error.message}`);
    }
  }

  async getSystemMetrics(limit = 100): Promise<SystemMetrics[]> {
    try {
      const metrics: SystemMetrics[] = [];
      const now = new Date();
      
      for (let i = 0; i < limit; i++) {
        const timestamp = new Date(now.getTime() - i * 60000); // Every minute
        const hourKey = `metrics:system:${timestamp.toISOString().slice(0, 13)}`;
        
        const [
          activeConnections,
          requestsPerMinute,
          errorCount
        ] = await Promise.all([
          this.redisService.get(`${hourKey}:connections`) || '0',
          this.redisService.get(`${hourKey}:requests`) || '0',
          this.redisService.get(`${hourKey}:errors`) || '0',
        ]);

        metrics.push({
          timestamp,
          activeConnections: parseInt(activeConnections),
          requestsPerMinute: parseInt(requestsPerMinute),
          responseTime: Math.random() * 100 + 50, // Mock data
          errorCount: parseInt(errorCount),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          cpuUsage: Math.random() * 100, // Mock data
        });
      }

      return metrics.reverse();
    } catch (error) {
      this.logger.error(`Failed to get system metrics: ${error.message}`);
      return [];
    }
  }

  async generateReport(type: 'daily' | 'weekly' | 'monthly', date: Date): Promise<any> {
    try {
      const startDate = this.getReportStartDate(type, date);
      const endDate = this.getReportEndDate(type, date);
      
      const analytics = await this.getSystemAnalytics('30d');
      
      const report = {
        type,
        period: {
          start: startDate,
          end: endDate,
        },
        summary: {
          totalUsers: analytics.totalUsers,
          totalChats: analytics.totalChats,
          totalMessages: analytics.totalMessages,
          averageResponseTime: analytics.averageResponseTime,
        },
        trends: {
          userGrowth: this.calculateGrowthRate(analytics.totalUsers, 100), // Mock
          chatActivity: this.calculateGrowthRate(analytics.totalChats, 50), // Mock
          toolUsage: analytics.popularTools,
        },
        recommendations: this.generateRecommendations(analytics),
        generatedAt: new Date(),
      };

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`);
      throw error;
    }
  }

  private getStartDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private async getTotalUsers(): Promise<number> {
    return await this.prismaService.user.count();
  }

  private async getActiveUsers(startDate: Date): Promise<number> {
    return await this.prismaService.user.count({
      where: {
        updatedAt: {
          gte: startDate,
        },
      },
    });
  }

  private async getTotalChats(startDate: Date): Promise<number> {
    return await this.prismaService.chatSession.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
  }

  private async getTotalMessages(startDate: Date): Promise<number> {
    return await this.prismaService.chatMessage.count({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
    });
  }

  private async getTotalAgentExecutions(startDate: Date): Promise<number> {
    return await this.prismaService.agentExecution.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
  }

  private async getPopularTools(startDate: Date): Promise<Array<{ name: string; count: number }>> {
    const toolUsage = await this.prismaService.agentExecution.groupBy({
      by: ['toolName'],
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
      },
      _count: {
        toolName: true,
      },
      orderBy: {
        _count: {
          toolName: 'desc',
        },
      },
      take: 5,
    });

    return toolUsage.map(item => ({
      name: item.toolName,
      count: item._count.toolName,
    }));
  }

  private async getSystemHealth(): Promise<any> {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuUsage: Math.random() * 100, // Mock
      errorRate: 0.02, // 2% error rate
    };
  }

  private async getUserEngagement(): Promise<any> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
      this.prismaService.user.count({
        where: {
          updatedAt: { gte: oneDayAgo },
        },
      }),
      this.prismaService.user.count({
        where: {
          updatedAt: { gte: oneWeekAgo },
        },
      }),
      this.prismaService.user.count({
        where: {
          updatedAt: { gte: oneMonthAgo },
        },
      }),
    ]);

    return {
      dailyActiveUsers: dailyActive,
      weeklyActiveUsers: weeklyActive,
      monthlyActiveUsers: monthlyActive,
    };
  }

  private async getAverageResponseTime(startDate: Date): Promise<number> {
    // Get AI messages with response time metadata
    const aiMessages = await this.prismaService.chatMessage.findMany({
      where: { 
        role: 'ASSISTANT',
        timestamp: { gte: startDate },
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
        return metadata?.responseTime || metadata?.processingTime || 0;
      })
      .filter(time => time > 0);

    if (responseTimes.length === 0) return 1250; // Default fallback

    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(average);
  }

  private async getUserChats(userId: string, startDate: Date): Promise<number> {
    return await this.prismaService.chatSession.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
    });
  }

  private async getUserMessages(userId: string, startDate: Date): Promise<number> {
    return await this.prismaService.chatMessage.count({
      where: {
        session: {
          userId,
        },
        timestamp: {
          gte: startDate,
        },
      },
    });
  }

  private async getUserAgentExecutions(userId: string, startDate: Date): Promise<number> {
    return await this.prismaService.agentExecution.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
    });
  }

  private async getUserMostUsedTools(userId: string, startDate: Date): Promise<Array<{ name: string; count: number }>> {
    const toolUsage = await this.prismaService.agentExecution.groupBy({
      by: ['toolName'],
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
      },
      _count: {
        toolName: true,
      },
      orderBy: {
        _count: {
          toolName: 'desc',
        },
      },
      take: 5,
    });

    return toolUsage.map(item => ({
      name: item.toolName,
      count: item._count.toolName,
    }));
  }

  private async getUserActivityPattern(userId: string, startDate: Date): Promise<Array<{ hour: number; count: number }>> {
    // Get user's chat messages grouped by hour
    const messages = await this.prismaService.chatMessage.findMany({
      where: {
        session: {
          userId,
        },
        timestamp: {
          gte: startDate,
        },
      },
      select: {
        timestamp: true,
      },
    });

    // Group by hour
    const hourCounts = new Array(24).fill(0);
    messages.forEach(message => {
      const hour = message.timestamp.getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
      hour,
      count,
    }));
  }

  private async getUserLastActive(userId: string): Promise<Date> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { updatedAt: true },
    });

    return user?.updatedAt || new Date();
  }

  private async getAverageSessionDuration(userId: string, startDate: Date): Promise<number> {
    const sessions = await this.prismaService.chatSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    if (sessions.length === 0) return 0;

    const durations = sessions.map(session => {
      const duration = session.updatedAt.getTime() - session.createdAt.getTime();
      return Math.round(duration / 1000); // Convert to seconds
    });

    const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    return Math.round(averageDuration);
  }

  private async getTotalFiles(startDate: Date): Promise<number> {
    return await this.prismaService.file.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
  }

  private getReportStartDate(type: string, date: Date): Date {
    const d = new Date(date);
    switch (type) {
      case 'daily':
        d.setHours(0, 0, 0, 0);
        return d;
      case 'weekly':
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        return d;
      case 'monthly':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      default:
        return d;
    }
  }

  private getReportEndDate(type: string, date: Date): Date {
    const d = new Date(date);
    switch (type) {
      case 'daily':
        d.setHours(23, 59, 59, 999);
        return d;
      case 'weekly':
        d.setDate(d.getDate() - d.getDay() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
      case 'monthly':
        d.setMonth(d.getMonth() + 1, 0);
        d.setHours(23, 59, 59, 999);
        return d;
      default:
        return d;
    }
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  private generateRecommendations(analytics: AnalyticsData): string[] {
    const recommendations = [];
    
    if (analytics.systemHealth.errorRate > 0.05) {
      recommendations.push('High error rate detected. Consider reviewing system logs and implementing additional monitoring.');
    }
    
    if (analytics.averageResponseTime > 2000) {
      recommendations.push('Response times are above optimal threshold. Consider optimizing AI model performance.');
    }
    
    if (analytics.userEngagement.dailyActiveUsers / analytics.totalUsers < 0.3) {
      recommendations.push('User engagement is below target. Consider implementing user retention strategies.');
    }
    
    return recommendations;
  }
}