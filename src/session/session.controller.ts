import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SessionService } from './session.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  SessionConfigDto,
  SessionResponseDto,
  SessionListResponseDto,
} from './dto/session.dto';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';

@ApiTags('Session Management')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @Public()
  @ApiOperation({ 
    summary: 'Create a new session',
    description: 'Creates a new AI session for background task processing. Can be anonymous or authenticated.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Session created successfully', 
    type: SessionResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createSession(@Body() createSessionDto: CreateSessionDto): Promise<ApiResponseDto<SessionResponseDto>> {
    const session = await this.sessionService.createSession(createSessionDto);
    return new ApiResponseDto({
      statusCode: HttpStatus.CREATED,
      data: session,
      message: ApiMessageKey.SESSION_CREATED_SUCCESS
    });
  }

  @Get(':sessionId')
  @Public()
  @ApiOperation({ 
    summary: 'Get session details',
    description: 'Retrieves detailed information about a specific session' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session details retrieved successfully', 
    type: SessionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('sessionId') sessionId: string): Promise<ApiResponseDto<SessionResponseDto>> {
    const session = await this.sessionService.getSession(sessionId);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: session,
      message: ApiMessageKey.SESSION_RETRIEVED_SUCCESS
    });
  }

  @Put(':sessionId')
  @Public()
  @ApiOperation({ 
    summary: 'Update session',
    description: 'Updates session status, metadata, or expiration time' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session updated successfully', 
    type: SessionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<ApiResponseDto<SessionResponseDto>> {
    const session = await this.sessionService.updateSession(sessionId, updateSessionDto);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: session,
      message: ApiMessageKey.SESSION_UPDATED_SUCCESS
    });
  }

  @Delete(':sessionId')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete session',
    description: 'Permanently deletes a session and all related data' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 204, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(@Param('sessionId') sessionId: string): Promise<ApiResponseDto<any>> {
    const result = await this.sessionService.deleteSession(sessionId);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: result,
      message: ApiMessageKey.SESSION_DELETED_SUCCESS
    });
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user sessions',
    description: 'Retrieves all sessions for a specific user with pagination' 
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User sessions retrieved successfully', 
    type: SessionListResponseDto 
  })
  async getUserSessions(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponseDto<SessionListResponseDto>> {
    const sessions = await this.sessionService.getUserSessions(userId, page, limit);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: sessions,
      message: ApiMessageKey.USER_SESSIONS_RETRIEVED_SUCCESS
    });
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get active sessions',
    description: 'Retrieves all currently active sessions with pagination' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Active sessions retrieved successfully', 
    type: SessionListResponseDto 
  })
  async getActiveSessions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponseDto<SessionListResponseDto>> {
    const sessions = await this.sessionService.getActiveSessions(page, limit);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: sessions,
      message: ApiMessageKey.ACTIVE_SESSIONS_RETRIEVED_SUCCESS
    });
  }

  @Put(':sessionId/config')
  @Public()
  @ApiOperation({ 
    summary: 'Update session configuration',
    description: 'Updates session configuration including browser, AI, and queue settings' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session configuration updated successfully', 
    type: SessionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSessionConfig(
    @Param('sessionId') sessionId: string,
    @Body() config: SessionConfigDto,
  ): Promise<ApiResponseDto<SessionResponseDto>> {
    const result = await this.sessionService.updateSessionConfig(sessionId, config);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: result,
      message: ApiMessageKey.SESSION_CONFIG_UPDATED_SUCCESS
    });
  }

  @Get(':sessionId/config')
  @Public()
  @ApiOperation({ 
    summary: 'Get session configuration',
    description: 'Retrieves current session configuration settings' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session configuration retrieved successfully', 
    type: SessionConfigDto 
  })
  async getSessionConfig(@Param('sessionId') sessionId: string): Promise<ApiResponseDto<SessionConfigDto>> {
    const config = await this.sessionService.getSessionConfig(sessionId);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: config,
      message: ApiMessageKey.SESSION_CONFIG_RETRIEVED_SUCCESS
    });
  }

  @Post('cleanup/expired')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Cleanup expired sessions',
    description: 'Manually trigger cleanup of expired sessions (usually runs automatically)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Expired sessions cleaned up successfully',
    schema: {
      type: 'object',
      properties: {
        cleanedCount: { type: 'number', description: 'Number of sessions cleaned up' }
      }
    }
  })
  async cleanupExpiredSessions(): Promise<ApiResponseDto<{ cleanedCount: number }>> {
    const cleanedCount = await this.sessionService.cleanupExpiredSessions();
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: { cleanedCount },
      message: ApiMessageKey.SESSIONS_CLEANED_SUCCESS
    });
  }
}