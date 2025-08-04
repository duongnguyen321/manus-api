import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PluginController } from './plugin.controller';
import { PluginService } from './plugin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { BrowserModule } from '../browser/browser.module';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    BrowserModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for plugin packages
      },
    }),
  ],
  controllers: [PluginController],
  providers: [PluginService],
  exports: [PluginService],
})
export class PluginModule {}