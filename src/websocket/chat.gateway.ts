import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import { AIService } from '../ai/ai.service';
import { MultiProviderAIService } from '../ai/multi-provider.service';
import { SessionService } from '../session/session.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import {
  ChatMessageDto,
  JoinRoomDto,
  TypingStatusDto,
  AgentChatDto,
  StreamChatDto,
} from './dto/websocket.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, { socketId: string; userId: string; rooms: string[] }>();
  private readonly activeTyping = new Map<string, Set<string>>(); // roomId -> Set of userIds

  constructor(
    private readonly agentsService: AgentsService,
    private readonly aiService: AIService,
    private readonly multiProviderService: MultiProviderAIService,
    private readonly sessionService: SessionService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract user info from connection (could be from JWT token in query or headers)
      const userId = await this.extractUserFromSocket(client);
      
      if (!userId) {
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.id, {
        socketId: client.id,
        userId,
        rooms: [],
      });

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Join user to their personal room
      await client.join(`user:${userId}`);
      
      // Notify about connection
      client.emit('connected', {
        socketId: client.id,
        userId,
        timestamp: new Date().toISOString(),
      });

      // Send any pending messages
      await this.sendPendingMessages(client, userId);

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    
    if (userInfo) {
      // Clear typing status for all rooms
      for (const room of userInfo.rooms) {
        await this.clearTypingStatus(room, userInfo.userId);
      }
      
      this.connectedUsers.delete(client.id);
      
      this.logger.log(`User ${userInfo.userId} disconnected`);
      
      // Notify rooms about disconnection
      for (const room of userInfo.rooms) {
        client.to(room).emit('userDisconnected', {
          userId: userInfo.userId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      await client.join(data.roomId);
      userInfo.rooms.push(data.roomId);

      // Initialize room if it doesn't exist
      if (!this.activeTyping.has(data.roomId)) {
        this.activeTyping.set(data.roomId, new Set());
      }

      this.logger.log(`User ${userInfo.userId} joined room ${data.roomId}`);

      // Notify room members
      client.to(data.roomId).emit('userJoined', {
        userId: userInfo.userId,
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      });

      // Send room info to user
      client.emit('roomJoined', {
        roomId: data.roomId,
        connectedUsers: await this.getRoomUsers(data.roomId),
      });

    } catch (error) {
      this.logger.error(`Join room error: ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) return;

      await client.leave(data.roomId);
      userInfo.rooms = userInfo.rooms.filter(room => room !== data.roomId);

      // Clear typing status
      await this.clearTypingStatus(data.roomId, userInfo.userId);

      // Notify room members
      client.to(data.roomId).emit('userLeft', {
        userId: userInfo.userId,
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${userInfo.userId} left room ${data.roomId}`);

    } catch (error) {
      this.logger.error(`Leave room error: ${error.message}`);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessageDto,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Save message to database
      const message = await this.prismaService.chatMessage.create({
        data: {
          roomId: data.roomId,
          sessionId: data.sessionId || 'default-session',
          content: data.message,
          role: 'USER',
          timestamp: new Date(),
        },
      });

      const messageResponse = {
        id: message.id,
        roomId: data.roomId,
        userId: userInfo.userId,
        message: data.message,
        messageType: 'user',
        timestamp: message.timestamp.toISOString(),
      };

      // Broadcast to room members
      this.server.to(data.roomId).emit('newMessage', messageResponse);

      // Clear typing status
      await this.clearTypingStatus(data.roomId, userInfo.userId);

      this.logger.log(`Message sent in room ${data.roomId} by user ${userInfo.userId}`);

    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('agentChat')
  async handleAgentChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AgentChatDto,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Save user message
      await this.prismaService.chatMessage.create({
        data: {
          roomId: data.roomId,
          sessionId: data.sessionId || 'default-session',
          content: data.message,
          role: 'USER',
          timestamp: new Date(),
        },
      });

      // Notify room that agent is typing
      this.server.to(data.roomId).emit('agentTyping', {
        agentName: data.agentName,
        roomId: data.roomId,
      });

      // Get AI response
      const response = await this.agentsService.chatWithAgent(data.agentName, {
        message: data.message,
        userId: userInfo.userId,
        conversationId: data.conversationId,
        conversationHistory: data.conversationHistory || [],
      });

      // Save agent response
      const agentMessage = await this.prismaService.chatMessage.create({
        data: {
          sessionId: data.sessionId || 'default-session',
          roomId: data.roomId,
          content: response.response,
          role: 'ASSISTANT',
          metadata: {
            agentName: data.agentName,
            toolsUsed: response.toolsUsed,
          },
          timestamp: new Date(),
        },
      });

      // Send agent response to room
      this.server.to(data.roomId).emit('agentResponse', {
        id: agentMessage.id,
        roomId: data.roomId,
        agentName: data.agentName,
        message: response.response,
        toolsUsed: response.toolsUsed,
        messageType: 'agent',
        timestamp: agentMessage.timestamp.toISOString(),
      });

      // Clear agent typing status
      this.server.to(data.roomId).emit('agentStoppedTyping', {
        agentName: data.agentName,
        roomId: data.roomId,
      });

    } catch (error) {
      this.logger.error(`Agent chat error: ${error.message}`);
      client.emit('error', { message: 'Agent chat failed' });
      
      // Clear agent typing status on error
      this.server.to(data.roomId).emit('agentStoppedTyping', {
        agentName: data.agentName,
        roomId: data.roomId,
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('streamChat')
  async handleStreamChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StreamChatDto,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Save user message
      await this.prismaService.chatMessage.create({
        data: {
          roomId: data.roomId,
          sessionId: data.sessionId || 'default-session',
          content: data.message,
          role: 'USER',
          timestamp: new Date(),
        },
      });

      // Notify room that streaming is starting
      this.server.to(data.roomId).emit('streamStarted', {
        roomId: data.roomId,
        provider: data.provider,
      });

      let fullResponse = '';
      const startTime = Date.now();

      // Stream AI response
      const messages = [
        ...(data.conversationHistory || []),
        { role: 'user' as const, content: data.message },
      ];

      const stream = this.multiProviderService.streamChatCompletion(messages, {
        provider: data.provider,
        fallbackProviders: data.fallbackProviders,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        
        // Send chunk to room
        this.server.to(data.roomId).emit('streamChunk', {
          roomId: data.roomId,
          chunk,
          accumulated: fullResponse,
        });

        // Small delay to prevent overwhelming clients
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Save complete agent response
      const agentMessage = await this.prismaService.chatMessage.create({
        data: {
          roomId: data.roomId,
          sessionId: data.sessionId || 'default-session',
          content: fullResponse,
          role: 'ASSISTANT',
          metadata: {
            provider: data.provider,
            streamingEnabled: true,
            executionTime: Date.now() - startTime,
          },
          timestamp: new Date(),
        },
      });

      // Notify stream completion
      this.server.to(data.roomId).emit('streamCompleted', {
        id: agentMessage.id,
        roomId: data.roomId,
        fullResponse,
        provider: data.provider,
        executionTime: Date.now() - startTime,
        timestamp: agentMessage.timestamp.toISOString(),
      });

    } catch (error) {
      this.logger.error(`Stream chat error: ${error.message}`);
      client.emit('error', { message: 'Stream chat failed' });
      
      // Notify stream error
      this.server.to(data.roomId).emit('streamError', {
        roomId: data.roomId,
        error: error.message,
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingStatusDto,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) return;

      const roomUsers = this.activeTyping.get(data.roomId);
      if (!roomUsers) return;

      if (data.isTyping) {
        roomUsers.add(userInfo.userId);
      } else {
        roomUsers.delete(userInfo.userId);
      }

      // Broadcast typing status to room (excluding sender)
      client.to(data.roomId).emit('userTyping', {
        userId: userInfo.userId,
        roomId: data.roomId,
        isTyping: data.isTyping,
      });

    } catch (error) {
      this.logger.error(`Typing status error: ${error.message}`);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('getRoomHistory')
  async handleGetRoomHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; limit?: number; offset?: number },
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const messages = await this.prismaService.chatMessage.findMany({
        where: { roomId: data.roomId },
        orderBy: { timestamp: 'desc' },
        take: data.limit || 50,
        skip: data.offset || 0,
      });

      client.emit('roomHistory', {
        roomId: data.roomId,
        messages: messages.reverse().map(msg => ({
          id: msg.id,
          sessionId: msg.sessionId,
          content: msg.content,
          role: msg.role,
          metadata: msg.metadata,
          timestamp: msg.timestamp.toISOString(),
        })),
      });

    } catch (error) {
      this.logger.error(`Get room history error: ${error.message}`);
      client.emit('error', { message: 'Failed to get room history' });
    }
  }

  private async extractUserFromSocket(client: Socket): Promise<string | null> {
    try {
      // Extract user ID from query parameters or authentication token
      const userId = client.handshake.query.userId as string;
      const token = client.handshake.auth.token as string;

      if (userId) {
        return userId;
      }

      if (token) {
        // Validate JWT token and extract user ID
        // This would integrate with your existing auth system
        return 'extracted-user-id-from-token';
      }

      return null;
    } catch (error) {
      this.logger.error(`User extraction error: ${error.message}`);
      return null;
    }
  }

  private async sendPendingMessages(client: Socket, userId: string) {
    try {
      // Get any pending messages for the user
      const pendingMessages = await this.redisService.lrange(`pending:${userId}`, 0, -1);
      
      for (const messageStr of pendingMessages) {
        const message = JSON.parse(messageStr);
        client.emit('pendingMessage', message);
      }

      // Clear pending messages
      if (pendingMessages.length > 0) {
        await this.redisService.del(`pending:${userId}`);
      }
    } catch (error) {
      this.logger.error(`Send pending messages error: ${error.message}`);
    }
  }

  private async getRoomUsers(roomId: string): Promise<string[]> {
    const users = [];
    for (const [socketId, userInfo] of this.connectedUsers.entries()) {
      if (userInfo.rooms.includes(roomId)) {
        users.push(userInfo.userId);
      }
    }
    return users;
  }

  private async clearTypingStatus(roomId: string, userId: string) {
    const roomUsers = this.activeTyping.get(roomId);
    if (roomUsers && roomUsers.has(userId)) {
      roomUsers.delete(userId);
      
      // Notify room that user stopped typing
      this.server.to(roomId).emit('userTyping', {
        userId,
        roomId,
        isTyping: false,
      });
    }
  }

  // Public method to send messages to specific users (for external services)
  async sendMessageToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Public method to send messages to specific rooms (for external services)
  async sendMessageToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get room statistics
  async getRoomStats(roomId: string) {
    const connectedUsers = await this.getRoomUsers(roomId);
    const typingUsers = Array.from(this.activeTyping.get(roomId) || []);
    
    return {
      roomId,
      connectedUsers: connectedUsers.length,
      typingUsers: typingUsers.length,
      usersList: connectedUsers,
      typingList: typingUsers,
    };
  }
}