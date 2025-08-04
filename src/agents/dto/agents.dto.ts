import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class ChatRequestDto {
	@ApiProperty({ description: 'Message from user' })
	@IsString()
	message: string;

	@ApiProperty({ description: 'User ID', required: false })
	@IsOptional()
	@IsString()
	userId?: string;

	@ApiProperty({ description: 'Conversation ID', required: false })
	@IsOptional()
	@IsString()
	conversationId?: string;

	@ApiProperty({ description: 'Conversation history', required: false })
	@IsOptional()
	@IsArray()
	conversationHistory?: Array<{
		role: 'user' | 'assistant' | 'system';
		content: string;
		timestamp?: string;
	}>;

	@ApiProperty({ description: 'Additional context', required: false })
	@IsOptional()
	@IsObject()
	context?: any;
}

export class ToolExecutionDto {
	@ApiProperty({ description: 'Tool name to execute' })
	@IsString()
	toolName: string;

	@ApiProperty({ description: 'Parameters for tool' })
	@IsObject()
	parameters: any;

	@ApiProperty({ description: 'User ID', required: false })
	@IsOptional()
	@IsString()
	userId?: string;
}

export class AgentListDto {
	@ApiProperty({ description: 'Agent name' })
	name: string;

	@ApiProperty({ description: 'Agent description' })
	description: string;

	@ApiProperty({ description: 'List of agent tools' })
	tools: string[];

	@ApiProperty({ description: 'Agent category' })
	category: string;
}

export class ChatResponseDto {
	@ApiProperty({ description: 'Agent name' })
	agent: string;

	@ApiProperty({ description: 'Response from agent' })
	response: string;

	@ApiProperty({ description: 'List of tools used' })
	toolsUsed: string[];

	@ApiProperty({ description: 'Response time' })
	timestamp: string;

	@ApiProperty({ description: 'Conversation ID' })
	conversationId: string;
}

export class ToolResponseDto {
	@ApiProperty({ description: 'Tool name' })
	tool: string;

	@ApiProperty({ description: 'Execution result' })
	result: any;

	@ApiProperty({ description: 'Execution time' })
	timestamp: string;

	@ApiProperty({ description: 'User ID' })
	userId?: string;
}

export class ToolInfoDto {
	@ApiProperty({ description: 'Tool name' })
	name: string;

	@ApiProperty({ description: 'Tool description' })
	description: string;

	@ApiProperty({ description: 'Tool category' })
	category: string;

	@ApiProperty({ description: 'Parameter schema' })
	schema?: any;

	@ApiProperty({ description: 'Authentication required' })
	requiresAuth: boolean;

	@ApiProperty({ description: 'Required permissions' })
	permissions?: string[];
}

export class AgentCapabilitiesDto {
	@ApiProperty({ description: 'Agent name' })
	agent: string;

	@ApiProperty({ description: 'Agent description' })
	description: string;

	@ApiProperty({ description: 'List of capabilities' })
	capabilities: Array<{
		name: string;
		description: string;
		category: string;
		schema?: any;
	}>;

	@ApiProperty({ description: 'System prompt' })
	systemPrompt: string;

	@ApiProperty({ description: 'Settings' })
	settings: {
		temperature: number;
		maxTokens: number;
	};
}

export class AgentSuggestionDto {
	@ApiProperty({ description: 'Agent name' })
	name: string;

	@ApiProperty({ description: 'Agent description' })
	description: string;

	@ApiProperty({ description: 'Agent category' })
	category: string;

	@ApiProperty({ description: 'Confidence level (0-1)' })
	confidence: number;
}

export class TextGenerationDto {
	@ApiProperty({ description: 'Text generation prompt' })
	@IsString()
	prompt: string;

	@ApiProperty({ description: 'Maximum length', required: false })
	@IsOptional()
	maxLength?: number;

	@ApiProperty({ description: 'Writing style', required: false })
	@IsOptional()
	@IsString()
	style?: string;

	@ApiProperty({ description: 'Temperature (0-1)', required: false })
	@IsOptional()
	temperature?: number;
}

export class TranslationDto {
	@ApiProperty({ description: 'Text to translate' })
	@IsString()
	text: string;

	@ApiProperty({ description: 'Target language' })
	@IsString()
	targetLanguage: string;

	@ApiProperty({ description: 'Source language', required: false })
	@IsOptional()
	@IsString()
	sourceLanguage?: string;
}

export class SummarizationDto {
	@ApiProperty({ description: 'Text to summarize' })
	@IsString()
	text: string;

	@ApiProperty({ description: 'Maximum length', required: false })
	@IsOptional()
	maxLength?: number;

	@ApiProperty({ description: 'Summary type', required: false })
	@IsOptional()
	@IsString()
	summaryType?: string;
}

export class CodeGenerationDto {
	@ApiProperty({ description: 'Request description' })
	@IsString()
	description: string;

	@ApiProperty({ description: 'Programming language' })
	@IsString()
	language: string;

	@ApiProperty({ description: 'Framework/library', required: false })
	@IsOptional()
	@IsString()
	framework?: string;
}

export class CodeExplanationDto {
	@ApiProperty({ description: 'Source code to explain' })
	@IsString()
	code: string;

	@ApiProperty({ description: 'Programming language', required: false })
	@IsOptional()
	@IsString()
	language?: string;
}

export class SearchDto {
	@ApiProperty({ description: 'Search keywords' })
	@IsString()
	query: string;

	@ApiProperty({ description: 'Number of results', required: false })
	@IsOptional()
	limit?: number;

	@ApiProperty({ description: 'Filters', required: false })
	@IsOptional()
	@IsObject()
	filters?: any;
}

export class ArtworkSearchDto {
	@ApiProperty({ description: 'Search keywords' })
	@IsString()
	query: string;

	@ApiProperty({ description: 'Artist name', required: false })
	@IsOptional()
	@IsString()
	artist?: string;

	@ApiProperty({ description: 'Art style', required: false })
	@IsOptional()
	@IsString()
	style?: string;

	@ApiProperty({ description: 'Art genre', required: false })
	@IsOptional()
	@IsString()
	genre?: string;

	@ApiProperty({ description: 'Year of creation', required: false })
	@IsOptional()
	year?: number;
}

export class SkillAssessmentDto {
	@ApiProperty({ description: 'User ID' })
	@IsString()
	userId: string;

	@ApiProperty({
		description: 'List of skills to assess',
		required: false,
	})
	@IsOptional()
	@IsArray()
	skills?: string[];

	@ApiProperty({ description: 'Assessment type', required: false })
	@IsOptional()
	@IsString()
	assessmentType?: string;
}

export class EmailComposeDto {
	@ApiProperty({ description: 'Recipient list' })
	@IsArray()
	to: string[];

	@ApiProperty({ description: 'Email subject' })
	@IsString()
	subject: string;

	@ApiProperty({ description: 'Email content' })
	@IsString()
	body: string;

	@ApiProperty({ description: 'Attachment list', required: false })
	@IsOptional()
	@IsArray()
	attachments?: string[];

	@ApiProperty({ description: 'Priority level', required: false })
	@IsOptional()
	@IsString()
	priority?: string;
}

export class StressAssessmentDto {
	@ApiProperty({ description: 'User ID' })
	@IsString()
	userId: string;

	@ApiProperty({ description: 'Stress symptoms', required: false })
	@IsOptional()
	@IsArray()
	symptoms?: string[];

	@ApiProperty({ description: 'Scale from 1-10', required: false })
	@IsOptional()
	scale?: number;

	@ApiProperty({ description: 'Additional notes', required: false })
	@IsOptional()
	@IsString()
	notes?: string;
}

export class VideoEditDto {
	@ApiProperty({ description: 'ID video' })
	@IsString()
	videoId: string;

	@ApiProperty({ description: 'Start time (seconds)' })
	startTime: number;

	@ApiProperty({ description: 'End time (seconds)' })
	endTime: number;

	@ApiProperty({ description: 'Output quality', required: false })
	@IsOptional()
	@IsString()
	quality?: string;
}
