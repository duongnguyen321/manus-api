import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { WebSocketService } from './websocket.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { AgentsModule } from '../agents/agents.module';
import { AIModule } from '../ai/ai.module';
import { SessionModule } from '../session/session.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    forwardRef(() => AgentsModule),
    forwardRef(() => AIModule),
    forwardRef(() => SessionModule),
    PrismaModule,
    RedisModule,
  ],
  providers: [
    ChatGateway,
    WebSocketService,
    WsAuthGuard,
  ],
  exports: [
    ChatGateway,
    WebSocketService,
  ],
})
export class WebSocketModule {
  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly chatGateway: ChatGateway,
  ) {
    // Connect services after initialization
    this.webSocketService.setChatGateway(this.chatGateway);
  }
}