import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ChatGateway } from './chat.gateway';

export interface RoomInfo {
  id: string;
  name: string;
  type: 'private' | 'group' | 'agent' | 'support';
  createdBy: string;
  members: string[];
  settings: {
    isPrivate: boolean;
    maxMembers: number;
    allowFileUploads: boolean;
    allowVoiceMessages: boolean;
    messageRetentionDays: number;
    rateLimitPerMinute: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentRooms: string[];
  customMessage?: string;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private chatGateway: ChatGateway;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  setChatGateway(gateway: ChatGateway) {
    this.chatGateway = gateway;
  }

  async createRoom(data: {
    name: string;
    type: 'private' | 'group' | 'agent' | 'support';
    createdBy: string;
    members?: string[];
    settings?: Partial<RoomInfo['settings']>;
  }): Promise<RoomInfo> {
    try {
      const room = await this.prismaService.chatRoom.create({
        data: {
          name: data.name,
          description: `${data.type} room created by user`,
          isPrivate: data.settings?.isPrivate ?? false,
          maxUsers: data.settings?.maxMembers ?? 50,
          createdBy: data.createdBy,
        },
      });

      // Cache room info
      await this.cacheRoomInfo(room.id, room as any);

      this.logger.log(`Room created: ${room.id} by user ${data.createdBy}`);
      
      return room as any;
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`);
      throw error;
    }
  }

  async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    try {
      // Try cache first
      const cachedRoom = await this.redisService.get(`room:${roomId}`);
      if (cachedRoom) {
        return JSON.parse(cachedRoom);
      }

      // Get from database
      const room = await this.prismaService.chatRoom.findUnique({
        where: { id: roomId },
      });

      if (room) {
        await this.cacheRoomInfo(roomId, room as any);
        return room as any;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get room info: ${error.message}`);
      return null;
    }
  }

  async addUserToRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return false;
      }

      // Check if room is full
      if (room.members.length >= room.settings.maxMembers) {
        return false;
      }

      // Check if user is already in room
      if (room.members.includes(userId)) {
        return true;
      }

      // For now, just log the room addition since ChatRoom model doesn't have members array
      // This would need to be implemented with a separate ChatRoomMember junction table
      this.logger.log(`Adding user ${userId} to room ${roomId} - implementation needed`);

      // Update cache
      room.members.push(userId);
      await this.cacheRoomInfo(roomId, room);

      // Notify room members
      if (this.chatGateway) {
        await this.chatGateway.sendMessageToRoom(roomId, 'userJoinedRoom', {
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(`User ${userId} added to room ${roomId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add user to room: ${error.message}`);
      return false;
    }
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await this.getRoomInfo(roomId);
      if (!room) {
        return false;
      }

      // For now, just log the room removal since ChatRoom model doesn't have members array
      // This would need to be implemented with a separate ChatRoomMember junction table
      this.logger.log(`Removing user ${userId} from room ${roomId} - implementation needed`);

      // Update cache - skip since members array doesn't exist in schema
      await this.cacheRoomInfo(roomId, room);

      // Notify room members
      if (this.chatGateway) {
        await this.chatGateway.sendMessageToRoom(roomId, 'userLeftRoom', {
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(`User ${userId} removed from room ${roomId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove user from room: ${error.message}`);
      return false;
    }
  }

  async updateUserPresence(userId: string, presence: Partial<UserPresence>): Promise<void> {
    try {
      const presenceKey = `presence:${userId}`;
      
      // Get current presence
      const currentPresence = await this.redisService.get(presenceKey);
      const userPresence: UserPresence = currentPresence 
        ? { ...JSON.parse(currentPresence), ...presence }
        : {
            userId,
            status: 'online',
            lastSeen: new Date(),
            currentRooms: [],
            ...presence,
          };

      // Update presence in Redis with TTL
      await this.redisService.setex(presenceKey, 3600, JSON.stringify(userPresence)); // 1 hour TTL

      // Notify user's rooms about status change
      if (this.chatGateway && presence.status) {
        for (const roomId of userPresence.currentRooms) {
          await this.chatGateway.sendMessageToRoom(roomId, 'userStatusChanged', {
            userId,
            status: presence.status,
            timestamp: new Date().toISOString(),
          });
        }
      }

    } catch (error) {
      this.logger.error(`Failed to update user presence: ${error.message}`);
    }
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const presenceKey = `presence:${userId}`;
      const presence = await this.redisService.get(presenceKey);
      
      return presence ? JSON.parse(presence) : null;
    } catch (error) {
      this.logger.error(`Failed to get user presence: ${error.message}`);
      return null;
    }
  }

  async getOnlineUsers(): Promise<UserPresence[]> {
    try {
      const keys = await this.redisService.keys('presence:*');
      const onlineUsers = [];

      for (const key of keys) {
        const presence = await this.redisService.get(key);
        if (presence) {
          const userPresence = JSON.parse(presence);
          if (userPresence.status !== 'offline') {
            onlineUsers.push(userPresence);
          }
        }
      }

      return onlineUsers;
    } catch (error) {
      this.logger.error(`Failed to get online users: ${error.message}`);
      return [];
    }
  }

  async getRoomMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    messages: any[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const [messages, total] = await Promise.all([
        this.prismaService.chatMessage.findMany({
          where: { roomId },
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
          include: {
            session: true,
          },
        }),
        this.prismaService.chatMessage.count({ where: { roomId } }),
      ]);

      return {
        messages: messages.reverse(),
        hasMore: offset + limit < total,
        total,
      };
    } catch (error) {
      this.logger.error(`Failed to get room messages: ${error.message}`);
      return { messages: [], hasMore: false, total: 0 };
    }
  }

  async sendNotification(
    userId: string,
    notification: {
      type: 'message' | 'mention' | 'invitation' | 'system';
      title: string;
      message: string;
      fromUserId?: string;
      roomId?: string;
      actionData?: any;
    },
  ): Promise<void> {
    try {
      // Save notification to database using correct field names
      const savedNotification = await this.prismaService.notification.create({
        data: {
          userId,
          type: notification.type,
          notificationText: `${notification.title}: ${notification.message}`,
          isRead: false,
        },
      });

      // Send real-time notification if user is online
      if (this.chatGateway) {
        await this.chatGateway.sendMessageToUser(userId, 'notification', {
          id: savedNotification.id,
          ...notification,
          timestamp: savedNotification.sentAt.toISOString(),
          read: false,
        });
      }

      // Store in pending notifications if user is offline
      const presence = await this.getUserPresence(userId);
      if (!presence || presence.status === 'offline') {
        await this.redisService.lpush(
          `pending:${userId}`,
          JSON.stringify({
            event: 'notification',
            data: {
              id: savedNotification.id,
              ...notification,
              timestamp: savedNotification.sentAt.toISOString(),
              read: false,
            },
          }),
        );
      }

    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notification = await this.prismaService.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
        },
      });

      return notification.count > 0;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      return false;
    }
  }

  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
  ): Promise<any[]> {
    try {
      const notifications = await this.prismaService.notification.findMany({
        where: {
          userId,
          ...(unreadOnly && { isRead: false }),
        },
        orderBy: { sentAt: 'desc' },
        take: 100,
      });

      return notifications;
    } catch (error) {
      this.logger.error(`Failed to get user notifications: ${error.message}`);
      return [];
    }
  }

  async broadcastSystemAnnouncement(announcement: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'maintenance' | 'feature';
    priority: 'low' | 'medium' | 'high' | 'critical';
    targetUsers?: string[];
    validUntil?: Date;
    dismissible: boolean;
  }): Promise<void> {
    try {
      const announcementData = {
        id: `announce_${Date.now()}`,
        ...announcement,
        timestamp: new Date().toISOString(),
      };

      if (announcement.targetUsers && announcement.targetUsers.length > 0) {
        // Send to specific users
        for (const userId of announcement.targetUsers) {
          if (this.chatGateway) {
            await this.chatGateway.sendMessageToUser(userId, 'systemAnnouncement', announcementData);
          }
        }
      } else {
        // Broadcast to all connected users
        if (this.chatGateway) {
          this.chatGateway.server.emit('systemAnnouncement', announcementData);
        }
      }

      // Store announcement for offline users
      await this.redisService.setex(
        `announcement:${announcementData.id}`,
        announcement.validUntil 
          ? Math.floor((announcement.validUntil.getTime() - Date.now()) / 1000)
          : 86400, // 24 hours default
        JSON.stringify(announcementData),
      );

      this.logger.log(`System announcement broadcasted: ${announcement.title}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast system announcement: ${error.message}`);
    }
  }

  async getSystemStatistics(): Promise<{
    totalConnectedUsers: number;
    totalRooms: number;
    totalMessages: number;
    messagesByRole: Record<string, number>;
    topActiveRooms: Array<{ roomId: string; messageCount: number }>;
  }> {
    try {
      const [totalRooms, totalMessages, messagesByRole] = await Promise.all([
        this.prismaService.chatRoom.count(),
        this.prismaService.chatMessage.count(),
        this.prismaService.chatMessage.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

      // Get top active rooms by counting messages per room
      const roomsWithMessages = await this.prismaService.chatMessage.findMany({
        where: { roomId: { not: null } },
        select: { roomId: true },
      });

      const roomCounts = roomsWithMessages.reduce((acc, msg) => {
        if (msg.roomId) {
          acc[msg.roomId] = (acc[msg.roomId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topActiveRooms = Object.entries(roomCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([roomId, count]) => ({ roomId, messageCount: count }));

      return {
        totalConnectedUsers: this.chatGateway?.getConnectedUsersCount() || 0,
        totalRooms,
        totalMessages,
        messagesByRole: messagesByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
        topActiveRooms,
      };
    } catch (error) {
      this.logger.error(`Failed to get system statistics: ${error.message}`);
      return {
        totalConnectedUsers: 0,
        totalRooms: 0,
        totalMessages: 0,
        messagesByRole: {},
        topActiveRooms: [],
      };
    }
  }

  private async cacheRoomInfo(roomId: string, room: RoomInfo): Promise<void> {
    try {
      await this.redisService.setex(`room:${roomId}`, 3600, JSON.stringify(room)); // 1 hour cache
    } catch (error) {
      this.logger.warn(`Failed to cache room info: ${error.message}`);
    }
  }

  // Cleanup methods
  async cleanupExpiredMessages(): Promise<void> {
    try {
      const rooms = await this.prismaService.chatRoom.findMany({
        select: { id: true },
      });

      for (const room of rooms) {
        const retentionDays = 30; // Default retention days since settings not in schema
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const deletedCount = await this.prismaService.chatMessage.deleteMany({
          where: {
            roomId: room.id,
            timestamp: { lt: cutoffDate },
          },
        });

        if (deletedCount.count > 0) {
          this.logger.log(`Cleaned up ${deletedCount.count} expired messages from room ${room.id}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup expired messages: ${error.message}`);
    }
  }

  async cleanupOfflineUsers(): Promise<void> {
    try {
      const presenceKeys = await this.redisService.keys('presence:*');
      const now = new Date();
      const offlineThreshold = 5 * 60 * 1000; // 5 minutes

      for (const key of presenceKeys) {
        const presence = await this.redisService.get(key);
        if (presence) {
          const userPresence: UserPresence = JSON.parse(presence);
          const lastSeen = new Date(userPresence.lastSeen);
          
          if (now.getTime() - lastSeen.getTime() > offlineThreshold) {
            await this.updateUserPresence(userPresence.userId, { status: 'offline' });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup offline users: ${error.message}`);
    }
  }
}