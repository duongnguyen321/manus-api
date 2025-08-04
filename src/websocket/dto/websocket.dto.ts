import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { AIProvider } from '../../ai/multi-provider.service';

export class JoinRoomDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsOptional()
  @IsString()
  roomType?: 'private' | 'group' | 'agent' | 'support';
}

export class ChatMessageDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  messageType?: 'text' | 'image' | 'file' | 'code';

  @IsOptional()
  metadata?: {
    fileName?: string;
    fileSize?: number;
    codeLanguage?: string;
    imageUrl?: string;
  };
}

export class AgentChatDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsString()
  message: string;

  @IsString()
  agentName: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsArray()
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8000)
  maxTokens?: number;
}

export class StreamChatDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider;

  @IsOptional()
  @IsArray()
  @IsEnum(AIProvider, { each: true })
  fallbackProviders?: AIProvider[];

  @IsOptional()
  @IsArray()
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(32000)
  maxTokens?: number;

  @IsOptional()
  @IsBoolean()
  saveToHistory?: boolean;
}

export class TypingStatusDto {
  @IsString()
  roomId: string;

  @IsBoolean()
  isTyping: boolean;
}

export class FileUploadDto {
  @IsString()
  roomId: string;

  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  fileData: string; // Base64 encoded file data

  @IsOptional()
  @IsString()
  caption?: string;
}

export class VoiceMessageDto {
  @IsString()
  roomId: string;

  @IsString()
  audioData: string; // Base64 encoded audio data

  @IsNumber()
  duration: number; // Duration in seconds

  @IsOptional()
  @IsString()
  transcription?: string;
}

export class RoomSettingsDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsNumber()
  maxMembers?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUsers?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moderators?: string[];

  @IsOptional()
  settings?: {
    allowFileUploads: boolean;
    allowVoiceMessages: boolean;
    messageRetentionDays: number;
    rateLimitPerMinute: number;
  };
}

export class UserStatusDto {
  @IsEnum(['online', 'away', 'busy', 'offline'])
  status: 'online' | 'away' | 'busy' | 'offline';

  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class ReactionDto {
  @IsString()
  roomId: string;

  @IsString()
  messageId: string;

  @IsString()
  reaction: string; // Emoji or reaction type

  @IsOptional()
  @IsBoolean()
  remove?: boolean; // true to remove reaction, false/undefined to add
}

export class MentionDto {
  @IsString()
  roomId: string;

  @IsString()
  message: string;

  @IsArray()
  @IsString({ each: true })
  mentionedUsers: string[];

  @IsOptional()
  @IsBoolean()
  notifyMentioned?: boolean;
}

export class PrivateMessageDto {
  @IsString()
  targetUserId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  messageType?: 'text' | 'image' | 'file';

  @IsOptional()
  metadata?: any;
}

export class RoomInviteDto {
  @IsString()
  roomId: string;

  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsOptional()
  @IsString()
  inviteMessage?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date string
}

// Response DTOs for type safety
export class WebSocketResponse<T = any> {
  event: string;
  data: T;
  timestamp: string;
  success: boolean;
  error?: string;
}

export class ConnectionInfoDto {
  socketId: string;
  userId: string;
  connectedAt: string;
  rooms: string[];
  status: 'online' | 'away' | 'busy';
}

export class RoomInfoDto {
  roomId: string;
  roomName: string;
  roomType: string;
  memberCount: number;
  members: Array<{
    userId: string;
    username: string;
    status: string;
    joinedAt: string;
  }>;
  settings: {
    isPrivate: boolean;
    maxMembers: number;
    messageRetentionDays: number;
  };
}

export class MessageHistoryDto {
  roomId: string;
  messages: Array<{
    id: string;
    userId: string;
    username?: string;
    content: string;
    messageType: string;
    timestamp: string;
    metadata?: any;
    reactions?: Array<{
      userId: string;
      reaction: string;
    }>;
  }>;
  hasMore: boolean;
  nextOffset?: number;
}

export class OnlineUsersDto {
  totalOnline: number;
  users: Array<{
    userId: string;
    username: string;
    status: 'online' | 'away' | 'busy';
    lastSeen: string;
    currentRooms: string[];
  }>;
}

export class NotificationDto {
  id: string;
  type: 'message' | 'mention' | 'invitation' | 'system';
  title: string;
  message: string;
  fromUserId?: string;
  fromUsername?: string;
  roomId?: string;
  roomName?: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionData?: any;
}

export class SystemAnnouncementDto {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetUsers?: string[]; // If null, announcement is for all users
  validUntil?: string;
  dismissible: boolean;
}