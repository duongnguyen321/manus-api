import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { ChatProcessor } from './processors/chat.processor';
import { GenerationProcessor } from './processors/generation.processor';
import { BrowserProcessor } from './processors/browser.processor';
import { EditProcessor } from './processors/edit.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
      },
    }),
    BullModule.registerQueue(
      { name: 'chat-processing' },
      { name: 'text-generation' },
      { name: 'code-generation' },
      { name: 'image-generation' },
      { name: 'browser-automation' },
      { name: 'file-editing' },
      { name: 'system-tasks' },
    ),
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    ChatProcessor,
    GenerationProcessor,
    BrowserProcessor,
    EditProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}