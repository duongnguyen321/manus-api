import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core Infrastructure Modules
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { MailModule } from './mail/mail.module';
import { CronModule } from './cron/cron.module';

// Authentication & User Management
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

// AI & Core Services
import { AIModule } from './ai/ai.module';
import { AgentsModule } from './agents/agents.module';
import { SessionModule } from './session/session.module';

// Application Flow & Features
import { FlowModule } from './flow/flow.module';
import { DockerModule } from './docker/docker.module';
import { SimpleModule } from './simple/simple.module';
import { ChatModule } from './chat/chat.module';
import { GenerateModule } from './generate/generate.module';
import { EditModule } from './edit/edit.module';

// Real-time Communication
import { WebSocketModule } from './websocket/websocket.module';

// File Management
import { FilesModule } from './files/files.module';

// Analytics & Reporting
import { AnalyticsModule } from './analytics/analytics.module';

// Internationalization
import { I18nModule } from './i18n/i18n.module';

// Plugin System
import { PluginModule } from './plugins/plugin.module';

// Supporting Modules
import { BrowserModule } from './browser/browser.module';

@Module({
	imports: [
		// Global Configuration
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		JwtModule.registerAsync({
			global: true,
			useFactory: (configService: ConfigService) => {
				return {
					global: true,
					secret: configService.get<string>('JWT_SECRET'),
					signOptions: { expiresIn: '60s' },
				};
			},
			inject: [ConfigService],
		}),

		// Authentication & User Management (Security Layer)
		AuthModule, // Authentication & Authorization
		UserModule, // User Management
		SimpleModule, // Main Application Flow (User Entry Point & Flow Control)
		I18nModule, // Internationalization (Multi-language support)

		// Core Infrastructure (Foundation Layer)
		PrismaModule, // Database
		RedisModule, // Cache & Sessions
		QueueModule, // Background Processing
		MailModule, // Email Services
		CronModule, // Scheduled Tasks

		// AI & Core Services (Intelligence Layer)
		AIModule, // Core AI Services
		AgentsModule, // AI Agents & Tools

		// Application Flow & Features (Business Logic Layer)
		// User Journey: Entry -> Session -> File Input -> AI Processing -> Generation/Editing -> Real-time Updates
		FlowModule,
		DockerModule,
		SessionModule, // Session Management (Track user interactions)
		FilesModule, // File Upload & Processing (Data Input)
		ChatModule, // Chat Processing (Core user-AI interaction)
		GenerateModule, // Content Generation (AI Response Generation)
		EditModule, // File & Code Editing (Content Modification)

		// Real-time Communication (Enhancement Layer)
		WebSocketModule, // WebSocket Gateway & Real-time Chat Updates

		// Extension & Automation Services (Power User Features)
		PluginModule, // Plugin System (Extend functionality)
		BrowserModule, // Browser Automation (Web scraping, testing)

		// Monitoring & Support Services (Utility Layer)
		AnalyticsModule, // Analytics & Reporting (Usage tracking & insights)
	],

	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
