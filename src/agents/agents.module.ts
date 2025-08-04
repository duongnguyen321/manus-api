import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ToolsService } from './tools.service';
import { LangChainService } from './langchain.service';

@Module({
	controllers: [AgentsController],
	providers: [AgentsService, ToolsService, LangChainService],
	exports: [AgentsService, ToolsService, LangChainService],
})
export class AgentsModule {}
