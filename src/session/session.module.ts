import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { QueueModule } from '../queue/queue.module';
import { BrowserModule } from '../browser/browser.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, QueueModule, BrowserModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}