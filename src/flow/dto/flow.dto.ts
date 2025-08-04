import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, IsObject, IsEnum, IsBoolean, IsNumber } from 'class-validator';

export class FlowRegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'SecurePassword123!' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'User phone number', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User preferences and settings' })
  @IsOptional()
  @IsObject()
  preferences?: {
    language?: string;
    timezone?: string;
    notificationSettings?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    aiPreferences?: {
      preferredAgents?: string[];
      communicationStyle?: 'formal' | 'casual' | 'professional';
      responseLength?: 'short' | 'medium' | 'detailed';
    };
  };

  @ApiPropertyOptional({ description: 'Initial agent to interact with', example: 'general_assistant_agent' })
  @IsOptional()
  @IsString()
  initialAgent?: string;

  @ApiPropertyOptional({ description: 'Initial message to send after registration', example: 'Hello! I\'m new here.' })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class FlowChatDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Message to send', example: 'I need help with career planning' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Preferred agent type', example: 'career_planning_agent' })
  @IsOptional()
  @IsString()
  preferredAgent?: string;

  @ApiPropertyOptional({ description: 'Conversation context and history' })
  @IsOptional()
  @IsArray()
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    agentUsed?: string;
  }>;

  @ApiPropertyOptional({ description: 'Session metadata' })
  @IsOptional()
  @IsObject()
  sessionMetadata?: {
    priority?: 'low' | 'normal' | 'high';
    expectedResponseTime?: number;
    requiresAuth?: boolean;
    context?: string;
  };
}

export class FlowAgentTaskDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Agent name to execute', example: 'career_planning_agent' })
  @IsString()
  agentName: string;

  @ApiProperty({ description: 'Tool/action to execute', example: 'assess_skills' })
  @IsString()
  toolName: string;

  @ApiProperty({ description: 'Parameters for the tool execution' })
  @IsObject()
  parameters: Record<string, any>;

  @ApiPropertyOptional({ description: 'Session ID to maintain context' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Conversation ID for chat continuity' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Execution preferences' })
  @IsOptional()
  @IsObject()
  executionOptions?: {
    timeout?: number;
    retryCount?: number;
    saveResults?: boolean;
    notifyOnCompletion?: boolean;
    executionMode?: 'sync' | 'async';
  };

  @ApiPropertyOptional({ description: 'Dependencies on other tasks' })
  @IsOptional()
  @IsArray()
  dependencies?: string[];
}

export class FlowSessionDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Session ID to complete', example: 'session-456' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Session completion status', example: 'success' })
  @IsOptional()
  @IsEnum(['success', 'partial', 'failed', 'cancelled'])
  status?: 'success' | 'partial' | 'failed' | 'cancelled';

  @ApiPropertyOptional({ description: 'Final results and outputs from the session' })
  @IsOptional()
  @IsObject()
  results?: {
    tasksCompleted: number;
    tasksTotal: number;
    executionTime: number;
    agentsUsed: string[];
    outputSummary: string;
    userSatisfaction?: number;
  };

  @ApiPropertyOptional({ description: 'User feedback on the session' })
  @IsOptional()
  @IsObject()
  feedback?: {
    rating: number;
    comments: string;
    suggestedImprovements: string[];
    wouldRecommend: boolean;
  };
}

export class FlowAnalyticsDto {
  @ApiPropertyOptional({ description: 'Time range for analytics', example: '30d' })
  @IsOptional()
  @IsString()
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Specific agent type to analyze' })
  @IsOptional()
  @IsString()
  agentType?: string;

  @ApiPropertyOptional({ description: 'Metrics to include in analysis' })
  @IsOptional()
  @IsArray()
  metrics?: string[];

  @ApiPropertyOptional({ description: 'Include detailed breakdown' })
  @IsOptional()
  @IsBoolean()
  detailed?: boolean;
}

export class FlowUserProgressDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Progress data to update' })
  @IsOptional()
  @IsObject()
  progressData?: {
    completedFlows: string[];
    currentFlow?: string;
    achievements: string[];
    skillsAcquired: string[];
    totalInteractions: number;
    averageSessionDuration: number;
    preferredAgents: string[];
    successRate: number;
  };
}

export class FlowRecommendationDto {
  @ApiProperty({ description: 'Recommended agent', example: 'stress_management_agent' })
  @IsString()
  agentName: string;

  @ApiProperty({ description: 'Recommendation confidence score', example: 0.85 })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reason for recommendation', example: 'Based on recent stress-related queries' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Suggested first interaction' })
  @IsOptional()
  @IsObject()
  suggestedInteraction?: {
    toolName: string;
    parameters: Record<string, any>;
    expectedOutcome: string;
  };
}

export class FlowBatchExecutionDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'List of tasks to execute', type: [FlowAgentTaskDto] })
  @IsArray()
  tasks: FlowAgentTaskDto[];

  @ApiPropertyOptional({ description: 'Execution mode', example: 'sequential' })
  @IsOptional()
  @IsEnum(['sequential', 'parallel', 'conditional'])
  executionMode?: 'sequential' | 'parallel' | 'conditional';

  @ApiPropertyOptional({ description: 'Global execution options' })
  @IsOptional()
  @IsObject()
  globalOptions?: {
    timeout: number;
    stopOnError: boolean;
    saveIntermediateResults: boolean;
    notifyOnCompletion: boolean;
  };
}

// Response DTOs
export class FlowRegistrationResponseDto {
  @ApiProperty({ description: 'Created user information' })
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
  };

  @ApiProperty({ description: 'Authentication tokens' })
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };

  @ApiProperty({ description: 'Initial session information' })
  initialSession: {
    sessionId: string;
    agentAssigned: string;
    conversationId: string;
    status: string;
  };

  @ApiPropertyOptional({ description: 'Initial chat response if message was provided' })
  initialChatResponse?: {
    response: string;
    agentUsed: string;
    toolsUsed: string[];
    timestamp: string;
  };
}

export class FlowChatResponseDto {
  @ApiProperty({ description: 'Chat session information' })
  session: {
    sessionId: string;
    conversationId: string;
    agentAssigned: string;
    status: string;
  };

  @ApiProperty({ description: 'Agent response' })
  response: {
    message: string;
    agentUsed: string;
    toolsUsed: string[];
    confidence: number;
    timestamp: string;
  };

  @ApiPropertyOptional({ description: 'Suggested next actions' })
  suggestions?: Array<{
    action: string;
    description: string;
    agentRequired: string;
  }>;
}

export class FlowAgentExecutionResponseDto {
  @ApiProperty({ description: 'Execution result' })
  result: {
    taskId: string;
    status: 'completed' | 'failed' | 'in_progress';
    output: any;
    executionTime: number;
    agentUsed: string;
    toolUsed: string;
  };

  @ApiPropertyOptional({ description: 'Context for next actions' })
  context?: {
    sessionUpdated: boolean;
    conversationContinued: boolean;
    newCapabilitiesUnlocked: string[];
  };

  @ApiPropertyOptional({ description: 'Recommended follow-up actions' })
  followUpActions?: Array<{
    agentName: string;
    toolName: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}