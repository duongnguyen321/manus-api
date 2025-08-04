import { Module } from '@nestjs/common';
import { EditController } from './edit.controller';
import { EditService } from './edit.service';
import { QueueModule } from '../queue/queue.module';
import { SessionModule } from '../session/session.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, QueueModule, SessionModule, AIModule],
  controllers: [EditController],
  providers: [EditService],
  exports: [EditService],
})
export class EditModule {}