import {
	DynamicTool,
	DynamicToolInput,
} from '@langchain/community/tools/dynamic';

// ===== TOOL CATEGORIES =====
export enum ToolCategory {
	ARTISTIC_INSPIRATION = 'artistic_inspiration',
	CAREER_PLANNING = 'career_planning',
	CUSTOMER_SERVICE = 'customer_service',
	EMAIL_MANAGEMENT = 'email_management',
	LEARNING_PLATFORM = 'learning_platform',
	STRESS_MANAGEMENT = 'stress_management',
	RECOMMENDATION = 'recommendation',
	VIDEO_EDITING = 'video_editing',
	GENERAL = 'general',
	SYSTEM_TOOLS = 'system_tools',
	AI_TOOLS = 'ai_tools',
	DATA_PROCESSING = 'data_processing',
	WEB_AUTOMATION = 'web_automation',
	CODE_EXECUTION = 'code_execution',
}

// ===== TOOL INTERFACES =====
export interface ToolConfig {
	name: string;
	description: string;
	category: ToolCategory;
	schema?: any;
	handler: (input: any) => Promise<string>;
	requiresAuth?: boolean;
	permissions?: string[];
}

export interface AgentConfig {
	name: string;
	description: string;
	tools: string[];
	systemPrompt: string;
	temperature?: number;
	maxTokens?: number;
}

// ===== ARTISTIC INSPIRATION TOOLS =====
export const artisticInspirationTools: ToolConfig[] = [
	{
		name: 'search_artworks',
		description: 'Search for artworks by criteria such as artist, style, genre',
		category: ToolCategory.ARTISTIC_INSPIRATION,
		schema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Search keywords' },
				artist: { type: 'string', description: 'Artist name' },
				style: { type: 'string', description: 'Art style' },
				genre: { type: 'string', description: 'Art genre' },
				year: { type: 'number', description: 'Year of creation' },
			},
			required: ['query'],
		},
		handler: async (input) => {
			// Implementation for artwork search
			return `Found artworks matching: ${input.query}`;
		},
	},
	{
		name: 'get_inspiration_sources',
		description: 'Get list of inspiration sources for artistic creation',
		category: ToolCategory.ARTISTIC_INSPIRATION,
		schema: {
			type: 'object',
			properties: {
				type: { type: 'string', description: 'Type of inspiration source' },
				limit: { type: 'number', description: 'Maximum number of results' },
			},
		},
		handler: async (input) => {
			return `Inspiration sources list of type ${input.type || 'all'}`;
		},
	},
	{
		name: 'create_collection',
		description: 'Create personal art collection',
		category: ToolCategory.ARTISTIC_INSPIRATION,
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Collection name' },
				description: { type: 'string', description: 'Collection description' },
				artworkIds: {
					type: 'array',
					items: { type: 'string' },
					description: 'List of artwork IDs',
				},
			},
			required: ['name'],
		},
		handler: async (input) => {
			return `Successfully created collection "${input.name}"`;
		},
	},
	{
		name: 'get_art_recommendations',
		description: 'Get artwork recommendations based on preferences',
		category: ToolCategory.ARTISTIC_INSPIRATION,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				preferences: {
					type: 'array',
					items: { type: 'string' },
					description: 'Art preferences',
				},
			},
			required: ['userId'],
		},
		handler: async (input) => {
			return `Art recommendations for user ${input.userId}`;
		},
	},
];

// ===== CAREER PLANNING TOOLS =====
export const careerPlanningTools: ToolConfig[] = [
	{
		name: 'assess_skills',
		description: "Assess user's current skills",
		category: ToolCategory.CAREER_PLANNING,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				skills: {
					type: 'array',
					items: { type: 'string' },
					description: 'List of skills to assess',
				},
			},
			required: ['userId'],
		},
		handler: async (input) => {
			return `Skills assessment for user ${input.userId}`;
		},
	},
	{
		name: 'recommend_career_path',
		description: 'Recommend suitable career path',
		category: ToolCategory.CAREER_PLANNING,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				interests: {
					type: 'array',
					items: { type: 'string' },
					description: 'Career preferences',
				},
				experience: { type: 'string', description: 'Experience level' },
			},
			required: ['userId'],
		},
		handler: async (input) => {
			return `Career path recommendation for user ${input.userId}`;
		},
	},
	{
		name: 'find_learning_resources',
		description: 'Search for suitable learning resources',
		category: ToolCategory.CAREER_PLANNING,
		schema: {
			type: 'object',
			properties: {
				skill: { type: 'string', description: 'Skills to learn' },
				level: {
					type: 'string',
					description: 'Level (beginner, intermediate, advanced)',
				},
				type: {
					type: 'string',
					description: 'Resource type (course, book, video)',
				},
			},
			required: ['skill'],
		},
		handler: async (input) => {
			return `Learning resources for skill ${input.skill}`;
		},
	},
	{
		name: 'track_progress',
		description: 'Track career development progress',
		category: ToolCategory.CAREER_PLANNING,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				goalId: { type: 'string', description: 'Goal ID' },
				progress: { type: 'number', description: 'Completion percentage' },
			},
			required: ['userId', 'goalId'],
		},
		handler: async (input) => {
			return `Updated progress ${input.progress}% for goal ${input.goalId}`;
		},
	},
];

// ===== CUSTOMER SERVICE TOOLS =====
export const customerServiceTools: ToolConfig[] = [
	{
		name: 'handle_inquiry',
		description: 'Handle customer questions',
		category: ToolCategory.CUSTOMER_SERVICE,
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', description: 'Message from customer' },
				userId: { type: 'string', description: 'Customer ID' },
				priority: { type: 'string', description: 'Priority level' },
			},
			required: ['message'],
		},
		handler: async (input) => {
			return `Handled question: "${input.message}"`;
		},
	},
	{
		name: 'search_knowledge_base',
		description: 'Search for information in knowledge base',
		category: ToolCategory.CUSTOMER_SERVICE,
		schema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Search keywords' },
				category: { type: 'string', description: 'Knowledge category' },
			},
			required: ['query'],
		},
		handler: async (input) => {
			return `Search results for: "${input.query}"`;
		},
	},
	{
		name: 'escalate_to_human',
		description: 'Transfer conversation to support staff',
		category: ToolCategory.CUSTOMER_SERVICE,
		schema: {
			type: 'object',
			properties: {
				conversationId: { type: 'string', description: 'Conversation ID' },
				reason: { type: 'string', description: 'Transfer reason' },
				urgency: { type: 'string', description: 'Urgency level' },
			},
			required: ['conversationId', 'reason'],
		},
		handler: async (input) => {
			return `Transferred conversation ${input.conversationId} to staff`;
		},
	},
];

// ===== EMAIL MANAGEMENT TOOLS =====
export const emailManagementTools: ToolConfig[] = [
	{
		name: 'compose_email',
		description: 'Compose new email',
		category: ToolCategory.EMAIL_MANAGEMENT,
		schema: {
			type: 'object',
			properties: {
				to: {
					type: 'array',
					items: { type: 'string' },
					description: 'Recipient list',
				},
				subject: { type: 'string', description: 'Email subject' },
				body: { type: 'string', description: 'Email content' },
				attachments: {
					type: 'array',
					items: { type: 'string' },
					description: 'Attachment list',
				},
			},
			required: ['to', 'subject', 'body'],
		},
		handler: async (input) => {
			return `Composed email to ${input.to.join(', ')} with subject "${input.subject}"`;
		},
	},
	{
		name: 'filter_emails',
		description: 'Filter emails by criteria',
		category: ToolCategory.EMAIL_MANAGEMENT,
		schema: {
			type: 'object',
			properties: {
				criteria: { type: 'string', description: 'Filter criteria' },
				folder: { type: 'string', description: 'Destination folder' },
				action: { type: 'string', description: 'Action to perform' },
			},
			required: ['criteria'],
		},
		handler: async (input) => {
			return `Applied filter: ${input.criteria}`;
		},
	},
	{
		name: 'schedule_email',
		description: 'Schedule email sending',
		category: ToolCategory.EMAIL_MANAGEMENT,
		schema: {
			type: 'object',
			properties: {
				emailId: { type: 'string', description: 'Email ID' },
				scheduleTime: {
					type: 'string',
					description: 'Send time (ISO format)',
				},
			},
			required: ['emailId', 'scheduleTime'],
		},
		handler: async (input) => {
			return `Scheduled email ${input.emailId} for ${input.scheduleTime}`;
		},
	},
];

// ===== LEARNING PLATFORM TOOLS =====
export const learningPlatformTools: ToolConfig[] = [
	{
		name: 'enroll_course',
		description: 'Register for course',
		category: ToolCategory.LEARNING_PLATFORM,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				courseId: { type: 'string', description: 'Course ID' },
			},
			required: ['userId', 'courseId'],
		},
		handler: async (input) => {
			return `Registered course ${input.courseId} for user ${input.userId}`;
		},
	},
	{
		name: 'track_learning_progress',
		description: 'Track learning progress',
		category: ToolCategory.LEARNING_PLATFORM,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				courseId: { type: 'string', description: 'Course ID' },
			},
			required: ['userId'],
		},
		handler: async (input) => {
			return `Learning progress for user ${input.userId}`;
		},
	},
	{
		name: 'generate_certificate',
		description: 'Generate course completion certificate',
		category: ToolCategory.LEARNING_PLATFORM,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				courseId: { type: 'string', description: 'Course ID' },
			},
			required: ['userId', 'courseId'],
		},
		handler: async (input) => {
			return `Created certificate for user ${input.userId} completing course ${input.courseId}`;
		},
	},
];

// ===== STRESS MANAGEMENT TOOLS =====
export const stressManagementTools: ToolConfig[] = [
	{
		name: 'assess_stress_level',
		description: 'Assess stress level',
		category: ToolCategory.STRESS_MANAGEMENT,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				symptoms: {
					type: 'array',
					items: { type: 'string' },
					description: 'Stress symptoms',
				},
				scale: { type: 'number', description: 'Scale from 1-10' },
			},
			required: ['userId'],
		},
		handler: async (input) => {
			return `Stress level assessment for user ${input.userId}`;
		},
	},
	{
		name: 'recommend_techniques',
		description: 'Recommend stress management techniques',
		category: ToolCategory.STRESS_MANAGEMENT,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				stressLevel: { type: 'number', description: 'Stress level' },
				preferences: {
					type: 'array',
					items: { type: 'string' },
					description: 'Technique preferences',
				},
			},
			required: ['userId', 'stressLevel'],
		},
		handler: async (input) => {
			return `Stress management techniques recommended for level ${input.stressLevel}`;
		},
	},
	{
		name: 'track_mood',
		description: 'Track daily mood',
		category: ToolCategory.STRESS_MANAGEMENT,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				mood: { type: 'string', description: 'Current mood' },
				notes: { type: 'string', description: 'Additional notes' },
			},
			required: ['userId', 'mood'],
		},
		handler: async (input) => {
			return `Recorded mood "${input.mood}" for user ${input.userId}`;
		},
	},
];

// ===== RECOMMENDATION TOOLS =====
export const recommendationTools: ToolConfig[] = [
	{
		name: 'get_content_recommendations',
		description: 'Get personalized content recommendations',
		category: ToolCategory.RECOMMENDATION,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				contentType: { type: 'string', description: 'Content type' },
				limit: { type: 'number', description: 'Number of recommendations' },
			},
			required: ['userId'],
		},
		handler: async (input) => {
			return `Content recommendations for user ${input.userId}`;
		},
	},
	{
		name: 'analyze_user_behavior',
		description: 'Analyze user behavior',
		category: ToolCategory.RECOMMENDATION,
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', description: 'User ID' },
				timeframe: {
					type: 'string',
					description: 'Analysis time period',
				},
			},
			required: ['userId'],
		},
		handler: async (input) => {
			return `User behavior analysis for ${input.userId} in ${input.timeframe || 'last 30 days'}`;
		},
	},
];

// ===== VIDEO EDITING TOOLS =====
export const videoEditingTools: ToolConfig[] = [
	{
		name: 'trim_video',
		description: 'Trim video by time',
		category: ToolCategory.VIDEO_EDITING,
		schema: {
			type: 'object',
			properties: {
				videoId: { type: 'string', description: 'Video ID' },
				startTime: { type: 'number', description: 'Start time (seconds)' },
				endTime: { type: 'number', description: 'End time (seconds)' },
			},
			required: ['videoId', 'startTime', 'endTime'],
		},
		handler: async (input) => {
			return `Video ${input.videoId} trimmed from ${input.startTime}s to ${input.endTime}s`;
		},
	},
	{
		name: 'add_effects',
		description: 'Add effects to video',
		category: ToolCategory.VIDEO_EDITING,
		schema: {
			type: 'object',
			properties: {
				videoId: { type: 'string', description: 'Video ID' },
				effects: {
					type: 'array',
					items: { type: 'string' },
					description: 'List of effects',
				},
				intensity: { type: 'number', description: 'Effect intensity (0-100)' },
			},
			required: ['videoId', 'effects'],
		},
		handler: async (input) => {
			return `Added effects ${input.effects.join(', ')} to video ${input.videoId}`;
		},
	},
];

// ===== GENERAL TOOLS =====
export const generalTools: ToolConfig[] = [
	{
		name: 'search_web',
		description: 'Search information on web',
		category: ToolCategory.GENERAL,
		schema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Search keywords' },
				limit: { type: 'number', description: 'Number of results' },
			},
			required: ['query'],
		},
		handler: async (input) => {
			return `Search results for: "${input.query}"`;
		},
	},
	{
		name: 'generate_text',
		description: 'Generate text with AI',
		category: ToolCategory.GENERAL,
		schema: {
			type: 'object',
			properties: {
				prompt: { type: 'string', description: 'Text generation request' },
				maxLength: { type: 'number', description: 'Maximum length' },
				style: { type: 'string', description: 'Writing style' },
			},
			required: ['prompt'],
		},
		handler: async (input) => {
			return `Generated text for request: "${input.prompt}"`;
		},
	},
	{
		name: 'translate_text',
		description: 'Translate text to another language',
		category: ToolCategory.GENERAL,
		schema: {
			type: 'object',
			properties: {
				text: { type: 'string', description: 'Text to translate' },
				targetLanguage: { type: 'string', description: 'Target language' },
				sourceLanguage: { type: 'string', description: 'Source language' },
			},
			required: ['text', 'targetLanguage'],
		},
		handler: async (input) => {
			return `Translated text to ${input.targetLanguage}`;
		},
	},
];

// ===== SYSTEM TOOLS =====
export const systemTools: ToolConfig[] = [
	{
		name: 'message_notify_user',
		description: 'Send a message to user without requiring a response. Use for acknowledging receipt of messages, providing progress updates, reporting task completion, or explaining changes in approach.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				text: {
					type: 'string',
					description: 'Message text to display to user',
				},
				attachments: {
					anyOf: [
						{ type: 'string' },
						{ items: { type: 'string' }, type: 'array' },
					],
					description: '(Optional) List of attachments to show to user, can be file paths or URLs',
				},
			},
			required: ['text'],
		},
		handler: async (input) => {
			return `Notified user: ${input.text}`;
		},
	},
	{
		name: 'message_ask_user',
		description: 'Ask user a question and wait for response. Use for requesting clarification, asking for confirmation, or gathering additional information.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				text: {
					type: 'string',
					description: 'Question text to present to user',
				},
				attachments: {
					anyOf: [
						{ type: 'string' },
						{ items: { type: 'string' }, type: 'array' },
					],
					description: '(Optional) List of question-related files or reference materials',
				},
				suggest_user_takeover: {
					type: 'string',
					enum: ['none', 'browser'],
					description: '(Optional) Suggested operation for user takeover',
				},
			},
			required: ['text'],
		},
		handler: async (input) => {
			return `Asked user: ${input.text}`;
		},
	},
	{
		name: 'file_read',
		description: 'Read file content. Use for checking file contents, analyzing logs, or reading configuration files.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					description: 'Absolute path of the file to read',
				},
				start_line: {
					type: 'integer',
					description: '(Optional) Starting line to read from, 0-based',
				},
				end_line: {
					type: 'integer',
					description: '(Optional) Ending line number (exclusive)',
				},
				sudo: {
					type: 'boolean',
					description: '(Optional) Whether to use sudo privileges',
				},
			},
			required: ['file'],
		},
		handler: async (input) => {
			return `Read file: ${input.file}`;
		},
	},
	{
		name: 'file_write',
		description: 'Overwrite or append content to a file. Use for creating new files, appending content, or modifying existing files.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					description: 'Absolute path of the file to write to',
				},
				content: {
					type: 'string',
					description: 'Text content to write',
				},
				append: {
					type: 'boolean',
					description: '(Optional) Whether to use append mode',
				},
				leading_newline: {
					type: 'boolean',
					description: '(Optional) Whether to add a leading newline',
				},
				trailing_newline: {
					type: 'boolean',
					description: '(Optional) Whether to add a trailing newline',
				},
				sudo: {
					type: 'boolean',
					description: '(Optional) Whether to use sudo privileges',
				},
			},
			required: ['file', 'content'],
		},
		handler: async (input) => {
			return `Wrote to file: ${input.file}`;
		},
	},
	{
		name: 'file_str_replace',
		description: 'Replace specified string in a file. Use for updating specific content in files or fixing errors in code.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					description: 'Absolute path of the file to perform replacement on',
				},
				old_str: {
					type: 'string',
					description: 'Original string to be replaced',
				},
				new_str: {
					type: 'string',
					description: 'New string to replace with',
				},
				sudo: {
					type: 'boolean',
					description: '(Optional) Whether to use sudo privileges',
				},
			},
			required: ['file', 'old_str', 'new_str'],
		},
		handler: async (input) => {
			return `Replaced in file: ${input.file}`;
		},
	},
	{
		name: 'file_find_in_content',
		description: 'Search for matching text within file content. Use for finding specific content or patterns in files.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					description: 'Absolute path of the file to search within',
				},
				regex: {
					type: 'string',
					description: 'Regular expression pattern to match',
				},
				sudo: {
					type: 'boolean',
					description: '(Optional) Whether to use sudo privileges',
				},
			},
			required: ['file', 'regex'],
		},
		handler: async (input) => {
			return `Searched in file: ${input.file}`;
		},
	},
	{
		name: 'file_find_by_name',
		description: 'Find files by name pattern in specified directory. Use for locating files with specific naming patterns.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				path: {
					type: 'string',
					description: 'Absolute path of directory to search',
				},
				glob: {
					type: 'string',
					description: 'Filename pattern using glob syntax wildcards',
				},
			},
			required: ['path', 'glob'],
		},
		handler: async (input) => {
			return `Found files in: ${input.path}`;
		},
	},
	{
		name: 'shell_exec',
		description: 'Execute commands in a specified shell session. Use for running code, installing packages, or managing files.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'Unique identifier of the target shell session',
				},
				exec_dir: {
					type: 'string',
					description: 'Working directory for command execution (must use absolute path)',
				},
				command: {
					type: 'string',
					description: 'Shell command to execute',
				},
			},
			required: ['id', 'exec_dir', 'command'],
		},
		handler: async (input) => {
			return `Executed command: ${input.command}`;
		},
	},
	{
		name: 'shell_view',
		description: 'View the content of a specified shell session. Use for checking command execution results or monitoring output.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'Unique identifier of the target shell session',
				},
			},
			required: ['id'],
		},
		handler: async (input) => {
			return `Viewed shell session: ${input.id}`;
		},
	},
	{
		name: 'shell_wait',
		description: 'Wait for the running process in a specified shell session to return. Use after running commands that require longer runtime.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'Unique identifier of the target shell session',
				},
				seconds: {
					type: 'integer',
					description: 'Wait duration in seconds',
				},
			},
			required: ['id'],
		},
		handler: async (input) => {
			return `Waited for shell session: ${input.id}`;
		},
	},
	{
		name: 'shell_write_to_process',
		description: 'Write input to a running process in a specified shell session. Use for responding to interactive command prompts.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'Unique identifier of the target shell session',
				},
				input: {
					type: 'string',
					description: 'Input content to write to the process',
				},
				press_enter: {
					type: 'boolean',
					description: 'Whether to press Enter key after input',
				},
			},
			required: ['id', 'input', 'press_enter'],
		},
		handler: async (input) => {
			return `Wrote to process in shell: ${input.id}`;
		},
	},
	{
		name: 'shell_kill_process',
		description: 'Terminate a running process in a specified shell session. Use for stopping long-running processes or handling frozen commands.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'Unique identifier of the target shell session',
				},
			},
			required: ['id'],
		},
		handler: async (input) => {
			return `Killed process in shell: ${input.id}`;
		},
	},
	{
		name: 'browser_view',
		description: 'View content of the current browser page. Use for checking the latest state of previously opened pages.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
		},
		handler: async (input) => {
			return `Viewed browser content`;
		},
	},
	{
		name: 'browser_navigate',
		description: 'Navigate browser to specified URL. Use when accessing new pages is needed.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					description: 'Complete URL to visit. Must include protocol prefix.',
				},
			},
			required: ['url'],
		},
		handler: async (input) => {
			return `Navigated to: ${input.url}`;
		},
	},
	{
		name: 'browser_restart',
		description: 'Restart browser and navigate to specified URL. Use when browser state needs to be reset.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					description: 'Complete URL to visit after restart. Must include protocol prefix.',
				},
			},
			required: ['url'],
		},
		handler: async (input) => {
			return `Restarted browser and navigated to: ${input.url}`;
		},
	},
	{
		name: 'browser_click',
		description: 'Click on elements in the current browser page. Use when clicking page elements is needed.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				index: {
					type: 'integer',
					description: '(Optional) Index number of the element to click',
				},
				coordinate_x: {
					type: 'number',
					description: '(Optional) X coordinate of click position',
				},
				coordinate_y: {
					type: 'number',
					description: '(Optional) Y coordinate of click position',
				},
			},
		},
		handler: async (input) => {
			return `Clicked browser element`;
		},
	},
	{
		name: 'browser_input',
		description: 'Overwrite text in editable elements on the current browser page. Use when filling content in input fields.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				index: {
					type: 'integer',
					description: '(Optional) Index number of the element to overwrite text',
				},
				coordinate_x: {
					type: 'number',
					description: '(Optional) X coordinate of the element to overwrite text',
				},
				coordinate_y: {
					type: 'number',
					description: '(Optional) Y coordinate of the element to overwrite text',
				},
				text: {
					type: 'string',
					description: 'Complete text content to overwrite',
				},
				press_enter: {
					type: 'boolean',
					description: 'Whether to press Enter key after input',
				},
			},
			required: ['text', 'press_enter'],
		},
		handler: async (input) => {
			return `Input text: ${input.text}`;
		},
	},
	{
		name: 'browser_move_mouse',
		description: 'Move cursor to specified position on the current browser page. Use when simulating user mouse movement.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				coordinate_x: {
					type: 'number',
					description: 'X coordinate of target cursor position',
				},
				coordinate_y: {
					type: 'number',
					description: 'Y coordinate of target cursor position',
				},
			},
			required: ['coordinate_x', 'coordinate_y'],
		},
		handler: async (input) => {
			return `Moved mouse to: (${input.coordinate_x}, ${input.coordinate_y})`;
		},
	},
	{
		name: 'browser_press_key',
		description: 'Simulate key press in the current browser page. Use when specific keyboard operations are needed.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				key: {
					type: 'string',
					description: 'Key name to simulate (e.g., Enter, Tab, ArrowUp), supports key combinations (e.g., Control+Enter).',
				},
			},
			required: ['key'],
		},
		handler: async (input) => {
			return `Pressed key: ${input.key}`;
		},
	},
	{
		name: 'browser_select_option',
		description: 'Select specified option from dropdown list element in the current browser page. Use when selecting dropdown menu options.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				index: {
					type: 'integer',
					description: 'Index number of the dropdown list element',
				},
				option: {
					type: 'integer',
					description: 'Option number to select, starting from 0.',
				},
			},
			required: ['index', 'option'],
		},
		handler: async (input) => {
			return `Selected option ${input.option} from dropdown ${input.index}`;
		},
	},
	{
		name: 'browser_scroll_up',
		description: 'Scroll up the current browser page. Use when viewing content above or returning to page top.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				to_top: {
					type: 'boolean',
					description: '(Optional) Whether to scroll directly to page top instead of one viewport up.',
				},
			},
		},
		handler: async (input) => {
			return `Scrolled up browser page`;
		},
	},
	{
		name: 'browser_scroll_down',
		description: 'Scroll down the current browser page. Use when viewing content below or jumping to page bottom.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				to_bottom: {
					type: 'boolean',
					description: '(Optional) Whether to scroll directly to page bottom instead of one viewport down.',
				},
			},
		},
		handler: async (input) => {
			return `Scrolled down browser page`;
		},
	},
	{
		name: 'browser_console_exec',
		description: 'Execute JavaScript code in browser console. Use when custom scripts need to be executed.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				javascript: {
					type: 'string',
					description: 'JavaScript code to execute. Note that the runtime environment is browser console.',
				},
			},
			required: ['javascript'],
		},
		handler: async (input) => {
			return `Executed JavaScript: ${input.javascript}`;
		},
	},
	{
		name: 'browser_console_view',
		description: 'View browser console output. Use when checking JavaScript logs or debugging page errors.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				max_lines: {
					type: 'integer',
					description: '(Optional) Maximum number of log lines to return.',
				},
			},
		},
		handler: async (input) => {
			return `Viewed browser console output`;
		},
	},
	{
		name: 'info_search_web',
		description: 'Search web pages using search engine. Use for obtaining latest information or finding references.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: 'Search query in Google search style, using 3-5 keywords.',
				},
				date_range: {
					type: 'string',
					enum: ['all', 'past_hour', 'past_day', 'past_week', 'past_month', 'past_year'],
					description: '(Optional) Time range filter for search results.',
				},
			},
			required: ['query'],
		},
		handler: async (input) => {
			return `Searched web for: ${input.query}`;
		},
	},
	{
		name: 'deploy_expose_port',
		description: 'Expose specified local port for temporary public access. Use when providing temporary public access for services.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				port: {
					type: 'integer',
					description: 'Local port number to expose',
				},
			},
			required: ['port'],
		},
		handler: async (input) => {
			return `Exposed port: ${input.port}`;
		},
	},
	{
		name: 'deploy_apply_deployment',
		description: 'Deploy website or application to public production environment. Use when deploying or updating static websites or applications.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: ['static', 'nextjs'],
					description: 'Type of website or application to deploy.',
				},
				local_dir: {
					type: 'string',
					description: 'Absolute path of local directory to deploy.',
				},
			},
			required: ['type', 'local_dir'],
		},
		handler: async (input) => {
			return `Deployed ${input.type} from: ${input.local_dir}`;
		},
	},
	{
		name: 'make_manus_page',
		description: 'Make a Manus Page from a local MDX file.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
			properties: {
				mdx_file_path: {
					type: 'string',
					description: 'Absolute path of the source MDX file',
				},
			},
			required: ['mdx_file_path'],
		},
		handler: async (input) => {
			return `Created Manus page from: ${input.mdx_file_path}`;
		},
	},
	{
		name: 'idle',
		description: 'A special tool to indicate you have completed all tasks and are about to enter idle state.',
		category: ToolCategory.SYSTEM_TOOLS,
		schema: {
			type: 'object',
		},
		handler: async (input) => {
			return `Entering idle state`;
		},
	},
];

// ===== AI TOOLS =====
export const aiTools: ToolConfig[] = [
	{
		name: 'analyze_sentiment',
		description: 'Analyze the sentiment of text content using AI',
		category: ToolCategory.AI_TOOLS,
		schema: {
			type: 'object',
			properties: {
				text: { type: 'string', description: 'Text to analyze', maxLength: 50000 },
				language: { type: 'string', description: 'Language code (default: en)', default: 'en' },
			},
			required: ['text'],
		},
		handler: async (input) => {
			return `Sentiment analysis result for: "${input.text.substring(0, 100)}..."`;
		},
	},
	{
		name: 'extract_keywords',
		description: 'Extract key terms and phrases from text using AI',
		category: ToolCategory.AI_TOOLS,
		schema: {
			type: 'object',
			properties: {
				text: { type: 'string', description: 'Text to analyze', maxLength: 50000 },
				maxKeywords: { type: 'number', description: 'Maximum keywords to extract', default: 10, minimum: 1, maximum: 50 },
			},
			required: ['text'],
		},
		handler: async (input) => {
			return `Extracted top ${input.maxKeywords || 10} keywords from text`;
		},
	},
	{
		name: 'generate_ai_text',
		description: 'Generate text content using AI models',
		category: ToolCategory.AI_TOOLS,
		schema: {
			type: 'object',
			properties: {
				prompt: { type: 'string', description: 'Text generation prompt' },
				maxTokens: { type: 'number', description: 'Maximum tokens to generate', default: 500 },
				temperature: { type: 'number', description: 'Creativity level (0-1)', default: 0.7 },
				style: { type: 'string', description: 'Writing style preference' },
			},
			required: ['prompt'],
		},
		handler: async (input) => {
			return `Generated AI text for prompt: "${input.prompt}"`;
		},
	},
];

// ===== DATA PROCESSING TOOLS =====
export const dataProcessingTools: ToolConfig[] = [
	{
		name: 'convert_data_format',
		description: 'Convert data between different formats (JSON, XML, CSV, YAML)',
		category: ToolCategory.DATA_PROCESSING,
		schema: {
			type: 'object',
			properties: {
				data: { type: 'string', description: 'Input data to convert' },
				fromFormat: { type: 'string', enum: ['json', 'xml', 'csv', 'yaml'], description: 'Source format' },
				toFormat: { type: 'string', enum: ['json', 'xml', 'csv', 'yaml'], description: 'Target format' },
			},
			required: ['data', 'fromFormat', 'toFormat'],
		},
		handler: async (input) => {
			return `Converted data from ${input.fromFormat} to ${input.toFormat}`;
		},
	},
	{
		name: 'validate_data_schema',
		description: 'Validate data against a schema',
		category: ToolCategory.DATA_PROCESSING,
		schema: {
			type: 'object',
			properties: {
				data: { type: 'string', description: 'Data to validate' },
				schema: { type: 'object', description: 'JSON schema for validation' },
				format: { type: 'string', enum: ['json', 'xml'], description: 'Data format' },
			},
			required: ['data', 'schema'],
		},
		handler: async (input) => {
			return `Validated data against provided schema`;
		},
	},
	{
		name: 'process_csv_data',
		description: 'Process and analyze CSV data',
		category: ToolCategory.DATA_PROCESSING,
		schema: {
			type: 'object',
			properties: {
				csvData: { type: 'string', description: 'CSV data content' },
				operation: { type: 'string', enum: ['analyze', 'filter', 'transform', 'aggregate'], description: 'Processing operation' },
				criteria: { type: 'object', description: 'Processing criteria' },
			},
			required: ['csvData', 'operation'],
		},
		handler: async (input) => {
			return `Processed CSV data with operation: ${input.operation}`;
		},
	},
];

// ===== WEB AUTOMATION TOOLS =====
export const webAutomationTools: ToolConfig[] = [
	{
		name: 'scrape_webpage',
		description: 'Extract content from web pages using browser automation',
		category: ToolCategory.WEB_AUTOMATION,
		schema: {
			type: 'object',
			properties: {
				url: { type: 'string', format: 'uri', description: 'URL to scrape' },
				selector: { type: 'string', description: 'CSS selector for specific content' },
				extractText: { type: 'boolean', default: true, description: 'Extract text content' },
				extractLinks: { type: 'boolean', default: false, description: 'Extract links' },
				takeScreenshot: { type: 'boolean', default: false, description: 'Take page screenshot' },
			},
			required: ['url'],
		},
		handler: async (input) => {
			return `Scraped content from: ${input.url}`;
		},
	},
	{
		name: 'automate_browser_actions',
		description: 'Perform automated browser actions like clicking, typing, navigation',
		category: ToolCategory.WEB_AUTOMATION,
		schema: {
			type: 'object',
			properties: {
				url: { type: 'string', format: 'uri', description: 'Starting URL' },
				actions: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							type: { type: 'string', enum: ['click', 'type', 'wait', 'extract', 'screenshot'], description: 'Action type' },
							selector: { type: 'string', description: 'CSS selector for element' },
							value: { type: 'string', description: 'Value to type or extract' },
							timeout: { type: 'number', default: 5000, description: 'Timeout in milliseconds' },
						},
						required: ['type'],
					},
					description: 'Sequence of browser actions',
				},
			},
			required: ['url', 'actions'],
		},
		handler: async (input) => {
			return `Executed ${input.actions.length} browser actions starting from: ${input.url}`;
		},
	},
	{
		name: 'monitor_webpage_changes',
		description: 'Monitor a webpage for changes over time',
		category: ToolCategory.WEB_AUTOMATION,
		schema: {
			type: 'object',
			properties: {
				url: { type: 'string', format: 'uri', description: 'URL to monitor' },
				selector: { type: 'string', description: 'CSS selector to monitor' },
				interval: { type: 'number', default: 300, description: 'Check interval in seconds' },
				threshold: { type: 'number', default: 0.1, description: 'Change threshold (0-1)' },
			},
			required: ['url'],
		},
		handler: async (input) => {
			return `Started monitoring: ${input.url} every ${input.interval} seconds`;
		},
	},
];

// ===== CODE EXECUTION TOOLS =====
export const codeExecutionTools: ToolConfig[] = [
	{
		name: 'execute_python_code',
		description: 'Execute Python code in a secure Docker container',
		category: ToolCategory.CODE_EXECUTION,
		schema: {
			type: 'object',
			properties: {
				code: { type: 'string', description: 'Python code to execute', maxLength: 10000 },
				timeout: { type: 'number', default: 30000, maximum: 60000, description: 'Execution timeout in milliseconds' },
				packages: { type: 'array', items: { type: 'string' }, description: 'Required Python packages' },
			},
			required: ['code'],
		},
		handler: async (input) => {
			return `Executed Python code in secure container`;
		},
	},
	{
		name: 'execute_nodejs_code',
		description: 'Execute Node.js code in a secure Docker container',
		category: ToolCategory.CODE_EXECUTION,
		schema: {
			type: 'object',
			properties: {
				code: { type: 'string', description: 'Node.js code to execute', maxLength: 10000 },
				timeout: { type: 'number', default: 30000, maximum: 60000, description: 'Execution timeout in milliseconds' },
				packages: { type: 'array', items: { type: 'string' }, description: 'Required npm packages' },
			},
			required: ['code'],
		},
		handler: async (input) => {
			return `Executed Node.js code in secure container`;
		},
	},
	{
		name: 'execute_bash_commands',
		description: 'Execute bash commands in a secure Docker container',
		category: ToolCategory.CODE_EXECUTION,
		schema: {
			type: 'object',
			properties: {
				code: { type: 'string', description: 'Bash commands to execute', maxLength: 10000 },
				timeout: { type: 'number', default: 30000, maximum: 60000, description: 'Execution timeout in milliseconds' },
			},
			required: ['code'],
		},
		handler: async (input) => {
			return `Executed bash commands in secure container`;
		},
	},
	{
		name: 'analyze_code_quality',
		description: 'Analyze code quality and provide suggestions',
		category: ToolCategory.CODE_EXECUTION,
		schema: {
			type: 'object',
			properties: {
				code: { type: 'string', description: 'Code to analyze' },
				language: { type: 'string', enum: ['python', 'javascript', 'typescript', 'java', 'go', 'rust'], description: 'Programming language' },
				checks: { type: 'array', items: { type: 'string' }, description: 'Specific checks to perform' },
			},
			required: ['code', 'language'],
		},
		handler: async (input) => {
			return `Analyzed ${input.language} code quality`;
		},
	},
];

// ===== ALL TOOLS REGISTRY =====
export const allTools: ToolConfig[] = [
	...artisticInspirationTools,
	...careerPlanningTools,
	...customerServiceTools,
	...emailManagementTools,
	...learningPlatformTools,
	...stressManagementTools,
	...recommendationTools,
	...videoEditingTools,
	...generalTools,
	...systemTools,
	...aiTools,
	...dataProcessingTools,
	...webAutomationTools,
	...codeExecutionTools,
];

// ===== AGENT CONFIGURATIONS =====
export const agentConfigs: AgentConfig[] = [
	{
		name: 'artistic_inspiration_agent',
		description:
			'Agent specialized in artistic creativity support and inspiration discovery',
		tools: [...artisticInspirationTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are an AI assistant specialized in art and creativity. You can help users:
- Search for artworks
- Discover inspiration sources
- Create personal collections
- Receive suitable art recommendations
- Use system tools for file operations, browser automation, and shell commands
Please respond creatively and inspiringly.`,
		temperature: 0.8,
		maxTokens: 2000,
	},
	{
		name: 'career_planning_agent',
		description: 'Agent supports career planning and development',
		tools: [...careerPlanningTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a professional AI career coach. You can help users:
- Assess current skills
- Suggest career paths
- Find learning resources
- Track development progress
- Use system tools for file operations, browser automation, and shell commands
Provide practical and evidence-based advice.`,
		temperature: 0.7,
		maxTokens: 2000,
	},
	{
		name: 'customer_service_agent',
		description: 'Agent supports automated customer service',
		tools: [...customerServiceTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a friendly and professional AI customer service representative. You can:
- Handle customer questions
- Search for information in knowledge base
- Transfer to staff when needed
- Use system tools for file operations, browser automation, and shell commands
Always be polite, helpful and solve problems effectively.`,
		temperature: 0.6,
		maxTokens: 1500,
	},
	{
		name: 'email_management_agent',
		description: 'Agent smart email management',
		tools: [...emailManagementTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are an intelligent AI email assistant. You can help:
- Draft professional emails
- Filter and organize emails
- Schedule email sending
- Use system tools for file operations, browser automation, and shell commands
Please ensure emails are written clearly, politely and effectively.`,
		temperature: 0.5,
		maxTokens: 1500,
	},
	{
		name: 'learning_platform_agent',
		description: 'Agent supports online learning',
		tools: [...learningPlatformTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are an enthusiastic AI learning assistant. You can:
- Support course registration
- Track learning progress
- Create completion certificates
- Use system tools for file operations, browser automation, and shell commands
Please encourage and support learners positively.`,
		temperature: 0.7,
		maxTokens: 1500,
	},
	{
		name: 'stress_management_agent',
		description: 'Agent supports stress management and mental health',
		tools: [...stressManagementTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a caring and knowledgeable AI wellness coach. You can:
- Assess stress level
- Suggest relaxation techniques
- Track daily mood
- Use system tools for file operations, browser automation, and shell commands
Always show empathy and provide positive support.`,
		temperature: 0.6,
		maxTokens: 1500,
	},
	{
		name: 'recommendation_agent',
		description: 'Agent personalized content recommendations',
		tools: [...recommendationTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are an intelligent AI recommendation engine. You can:
- Suggest suitable content
- Analyze user behavior
- Personalize experience
- Use system tools for file operations, browser automation, and shell commands
Provide accurate and helpful recommendations.`,
		temperature: 0.6,
		maxTokens: 1500,
	},
	{
		name: 'video_editing_agent',
		description: 'Agent supports video editing',
		tools: [...videoEditingTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a professional AI video editor. You can:
- Cut and edit videos
- Add effects and transitions
- Optimize video quality
- Use system tools for file operations, browser automation, and shell commands
Create high-quality and engaging videos.`,
		temperature: 0.7,
		maxTokens: 1500,
	},
	{
		name: 'general_assistant_agent',
		description: 'Agent versatile support for general tasks',
		tools: [...generalTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a versatile and intelligent AI assistant. You can:
- Search information on web
- Create and edit text
- Multi-language translation
- Support various tasks
- Use system tools for file operations, browser automation, and shell commands
Always be helpful, accurate and friendly.`,
		temperature: 0.7,
		maxTokens: 2000,
	},
	{
		name: 'ai_assistant_agent',
		description: 'Advanced AI agent with text processing and generation capabilities',
		tools: [...aiTools.map((t) => t.name), ...generalTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are an advanced AI assistant specializing in intelligent text processing and generation. You can:
- Analyze sentiment and emotions in text
- Extract key terms and important concepts
- Generate high-quality content and responses
- Translate between languages
- Process and understand complex text
- Use system tools for file operations, browser automation, and shell commands
Provide accurate, helpful, and contextually appropriate responses.`,
		temperature: 0.7,
		maxTokens: 2500,
	},
	{
		name: 'data_analyst_agent',
		description: 'Data processing and analysis specialist agent',
		tools: [...dataProcessingTools.map((t) => t.name), ...aiTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a professional data analyst AI. You can:
- Convert data between formats (JSON, XML, CSV, YAML)
- Validate data against schemas
- Process and analyze CSV data
- Extract insights from datasets
- Generate reports and visualizations
- Use system tools for file operations, browser automation, and shell commands
Focus on accuracy, data integrity, and providing actionable insights.`,
		temperature: 0.3,
		maxTokens: 2000,
	},
	{
		name: 'web_automation_agent',
		description: 'Web scraping and browser automation specialist',
		tools: [...webAutomationTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a web automation and scraping specialist AI. You can:
- Extract content from web pages using browser automation
- Perform complex browser interactions (clicking, typing, navigation)
- Monitor websites for changes
- Take screenshots and capture page states
- Handle dynamic content and JavaScript-heavy sites
- Use system tools for file operations, browser automation, and shell commands
Always respect robots.txt and website terms of service.`,
		temperature: 0.4,
		maxTokens: 2000,
	},
	{
		name: 'code_execution_agent',
		description: 'Secure code execution and analysis agent',
		tools: [...codeExecutionTools.map((t) => t.name), ...systemTools.map((t) => t.name)],
		systemPrompt: `You are a code execution and analysis specialist AI. You can:
- Execute Python, Node.js, and Bash code in secure Docker containers
- Analyze code quality and provide improvement suggestions
- Debug and troubleshoot code issues
- Test code snippets and validate functionality
- Generate code examples and solutions
- Use system tools for file operations, browser automation, and shell commands
Always prioritize security and provide clear explanations of code behavior.`,
		temperature: 0.5,
		maxTokens: 2500,
	},
	{
		name: 'full_stack_developer_agent',
		description: 'Comprehensive development agent with all technical tools',
		tools: [
			...codeExecutionTools.map((t) => t.name),
			...webAutomationTools.map((t) => t.name),
			...dataProcessingTools.map((t) => t.name),
			...aiTools.map((t) => t.name),
			...systemTools.map((t) => t.name)
		],
		systemPrompt: `You are a full-stack developer AI with comprehensive technical capabilities. You can:
- Execute and analyze code in multiple languages
- Automate web browsers and scrape content
- Process and transform data in various formats
- Generate and analyze text using AI
- Perform system operations and file management
- Debug, test, and optimize applications
- Use system tools for file operations, browser automation, and shell commands
Provide professional, well-documented solutions with security best practices.`,
		temperature: 0.6,
		maxTokens: 3000,
	},
	{
		name: 'security_analyst_agent',
		description: 'Cybersecurity and vulnerability analysis specialist',
		tools: [
			...codeExecutionTools.map((t) => t.name),
			...webAutomationTools.map((t) => t.name),
			...systemTools.map((t) => t.name)
		],
		systemPrompt: `You are a cybersecurity specialist AI focused on defensive security practices. You can:
- Analyze code for security vulnerabilities and best practices
- Perform web application security testing
- Execute security-focused scripts and tools
- Monitor systems for security issues
- Generate security reports and recommendations
- Use system tools for file operations, browser automation, and shell commands
Always focus on defensive security, vulnerability detection, and protection mechanisms. Never assist with malicious activities.`,
		temperature: 0.3,
		maxTokens: 2500,
	},
	{
		name: 'devops_automation_agent',
		description: 'DevOps and infrastructure automation specialist',
		tools: [
			...codeExecutionTools.map((t) => t.name),
			...systemTools.map((t) => t.name),
			...webAutomationTools.map((t) => t.name)
		],
		systemPrompt: `You are a DevOps automation specialist AI. You can:
- Execute deployment scripts and automation tools
- Monitor infrastructure and applications
- Manage CI/CD pipelines and processes
- Automate system administration tasks
- Handle container and orchestration workflows
- Use system tools for file operations, browser automation, and shell commands
Focus on reliability, scalability, and operational excellence.`,
		temperature: 0.4,
		maxTokens: 2500,
	},
	{
		name: 'research_assistant_agent',
		description: 'Research and information gathering specialist',
		tools: [
			...webAutomationTools.map((t) => t.name),
			...aiTools.map((t) => t.name),
			...dataProcessingTools.map((t) => t.name),
			...systemTools.map((t) => t.name)
		],
		systemPrompt: `You are a research assistant AI specialized in information gathering and analysis. You can:
- Scrape and analyze web content for research
- Process and organize research data
- Generate summaries and insights from text
- Extract key information from various sources
- Analyze trends and patterns in data
- Use system tools for file operations, browser automation, and shell commands
Provide thorough, well-sourced, and objective research results.`,
		temperature: 0.5,
		maxTokens: 2500,
	},
];

// ===== UTILITY FUNCTIONS =====
export function getToolsByCategory(category: ToolCategory): ToolConfig[] {
	return allTools.filter((tool) => tool.category === category);
}

export function getToolByName(name: string): ToolConfig | undefined {
	return allTools.find((tool) => tool.name === name);
}

export function getAgentByName(name: string): AgentConfig | undefined {
	return agentConfigs.find((agent) => agent.name === name);
}

export function createLangChainTool(toolConfig: ToolConfig): DynamicTool {
	return new DynamicTool({
		name: toolConfig.name,
		description: toolConfig.description,
		func: toolConfig.handler,
	});
}

export function createLangChainTools(toolConfigs: ToolConfig[]): DynamicTool[] {
	return toolConfigs.map(createLangChainTool);
}

// ===== TOOL PERMISSIONS =====
export const toolPermissions = {
	// Artistic Inspiration Tools
	search_artworks: ['user', 'artist', 'admin'],
	get_inspiration_sources: ['user', 'artist', 'admin'],
	create_collection: ['user', 'artist', 'admin'],
	get_art_recommendations: ['user', 'artist', 'admin'],

	// Career Planning Tools
	assess_skills: ['user', 'career_counselor', 'admin'],
	recommend_career_path: ['user', 'career_counselor', 'admin'],
	find_learning_resources: ['user', 'career_counselor', 'admin'],
	track_progress: ['user', 'career_counselor', 'admin'],

	// Customer Service Tools
	handle_inquiry: ['support_agent', 'admin'],
	search_knowledge_base: ['support_agent', 'admin'],
	escalate_to_human: ['support_agent', 'admin'],

	// Email Management Tools
	compose_email: ['user', 'admin'],
	filter_emails: ['user', 'admin'],
	schedule_email: ['user', 'admin'],

	// Learning Platform Tools
	enroll_course: ['student', 'instructor', 'admin'],
	track_learning_progress: ['student', 'instructor', 'admin'],
	generate_certificate: ['instructor', 'admin'],

	// Stress Management Tools
	assess_stress_level: ['user', 'therapist', 'admin'],
	recommend_techniques: ['user', 'therapist', 'admin'],
	track_mood: ['user', 'therapist', 'admin'],

	// Recommendation Tools
	get_content_recommendations: ['user', 'admin'],
	analyze_user_behavior: ['analyst', 'admin'],

	// Video Editing Tools
	trim_video: ['user', 'editor', 'admin'],
	add_effects: ['user', 'editor', 'admin'],

	// General Tools
	search_web: ['user', 'admin'],
	generate_text: ['user', 'admin'],
	translate_text: ['user', 'admin'],

	// System Tools
	message_notify_user: ['admin', 'system'],
	message_ask_user: ['admin', 'system'],
	file_read: ['admin', 'system'],
	file_write: ['admin', 'system'],
	file_str_replace: ['admin', 'system'],
	file_find_in_content: ['admin', 'system'],
	file_find_by_name: ['admin', 'system'],
	shell_exec: ['admin', 'system'],
	shell_view: ['admin', 'system'],
	shell_wait: ['admin', 'system'],
	shell_write_to_process: ['admin', 'system'],
	shell_kill_process: ['admin', 'system'],
	browser_view: ['admin', 'system'],
	browser_navigate: ['admin', 'system'],
	browser_restart: ['admin', 'system'],
	browser_click: ['admin', 'system'],
	browser_input: ['admin', 'system'],
	browser_move_mouse: ['admin', 'system'],
	browser_press_key: ['admin', 'system'],
	browser_select_option: ['admin', 'system'],
	browser_scroll_up: ['admin', 'system'],
	browser_scroll_down: ['admin', 'system'],
	browser_console_exec: ['admin', 'system'],
	browser_console_view: ['admin', 'system'],
	info_search_web: ['admin', 'system'],
	deploy_expose_port: ['admin', 'system'],
	deploy_apply_deployment: ['admin', 'system'],
	make_manus_page: ['admin', 'system'],
	idle: ['admin', 'system'],

	// AI Tools
	analyze_sentiment: ['user', 'admin'],
	extract_keywords: ['user', 'admin'],
	generate_ai_text: ['user', 'admin'],

	// Data Processing Tools
	convert_data_format: ['user', 'admin'],
	validate_data_schema: ['user', 'admin'],
	process_csv_data: ['user', 'admin'],

	// Web Automation Tools
	scrape_webpage: ['user', 'admin'],
	automate_browser_actions: ['user', 'admin'],
	monitor_webpage_changes: ['user', 'admin'],

	// Code Execution Tools
	execute_python_code: ['admin', 'developer'],
	execute_nodejs_code: ['admin', 'developer'],
	execute_bash_commands: ['admin', 'developer'],
	analyze_code_quality: ['user', 'admin', 'developer'],
};

export default {
	allTools,
	agentConfigs,
	getToolsByCategory,
	getToolByName,
	getAgentByName,
	createLangChainTool,
	createLangChainTools,
	toolPermissions,
};
