import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { MultiProviderAIService } from './multi-provider.service';
import { MultiProviderController } from './multi-provider.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [MultiProviderController],
  providers: [AIService, MultiProviderAIService],
  exports: [AIService, MultiProviderAIService],
})
export class AIModule {}