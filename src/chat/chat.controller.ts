import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  ChatMessageResponseDto,
  ChatHistoryResponseDto,
  ChatSessionStatsDto,
  StreamChatDto,
} from './dto/chat.dto';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Chat Management')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @Public()
  @ApiOperation({ 
    summary: 'Send chat message',
    description: 'Sends a message to a chat session. Can be processed synchronously or in background.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Message sent successfully', 
    type: ChatMessageResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async sendMessage(@Body() sendMessageDto: SendMessageDto): Promise<ChatMessageResponseDto> {
    return this.chatService.sendMessage(sendMessageDto);
  }

  @Post('stream')
  @Public()
  @ApiOperation({ 
    summary: 'Stream chat response',
    description: 'Sends a message and streams the AI response in real-time' 
  })
  @ApiResponse({ status: 200, description: 'Streaming response started' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async streamChat(
    @Body() streamChatDto: StreamChatDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await this.chatService.streamChat(streamChatDto);
      
      for await (const chunk of stream) {
        res.write(chunk);
      }
      
      res.end();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  @Get('history/:sessionId')
  @Public()
  @ApiOperation({ 
    summary: 'Get chat history',
    description: 'Retrieves chat message history for a specific session with pagination' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Messages per page (default: 50)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat history retrieved successfully', 
    type: ChatHistoryResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getChatHistory(
    @Param('sessionId') sessionId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<ChatHistoryResponseDto> {
    return this.chatService.getChatHistory(sessionId, page, limit);
  }

  @Get('stats/:sessionId')
  @Public()
  @ApiOperation({ 
    summary: 'Get session statistics',
    description: 'Retrieves chat statistics and metrics for a specific session' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session statistics retrieved successfully', 
    type: ChatSessionStatsDto 
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSessionStats(@Param('sessionId') sessionId: string): Promise<ChatSessionStatsDto> {
    return this.chatService.getSessionStats(sessionId);
  }

  @Delete('message/:messageId')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete chat message',
    description: 'Deletes a specific chat message and cancels any pending processing' 
  })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 204, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(@Param('messageId') messageId: string): Promise<void> {
    await this.chatService.deleteMessage(messageId);
  }

  @Delete('history/:sessionId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Clear chat history',
    description: 'Clears all chat messages for a session and cancels pending jobs' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 204, description: 'Chat history cleared successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async clearChatHistory(@Param('sessionId') sessionId: string): Promise<void> {
    await this.chatService.clearChatHistory(sessionId);
  }

  @Get('health')
  @Public()
  @ApiOperation({ 
    summary: 'Chat service health check',
    description: 'Returns the health status of the chat service' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Service uptime in seconds' }
      }
    }
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'chat',
    };
  }
}