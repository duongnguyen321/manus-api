# Manus AI API

A comprehensive, versatile AI system built with NestJS that provides specialized AI agents capable of performing various tasks through real AI integration, background processing, and system automation.

## 🚀 Key Features

### Multi-Agent AI System

- **9 Specialized AI Agents** with real AI integration (no mock data)
- **Background Task Processing** with BullMQ and Redis queues
- **Session Persistence** for offline capability and long-running tasks
- **Real-time AI Interactions** with streaming responses
- **System Tool Integration** (file operations, browser automation, shell commands)

### AI Agents & Capabilities

#### 🎨 **Artistic Inspiration Agent**

- Artwork search and discovery
- Creative inspiration sourcing
- Art collection management
- Personalized art recommendations

#### 💼 **Career Planning Agent**

- Professional skills assessment
- Career path recommendations
- Learning resource discovery
- Progress tracking and development

#### 🎧 **Customer Service Agent**

- Automated customer inquiry handling
- Knowledge base integration
- Escalation to human support
- Multi-channel support

#### 📧 **Email Management Agent**

- Smart email composition
- Automated filtering and organization
- Email scheduling and templates
- Professional communication assistance

#### 🎓 **Learning Platform Agent**

- Course enrollment and management
- Learning progress tracking
- Certificate generation
- Educational content curation

#### 🧘 **Stress Management Agent**

- Stress level assessment
- Personalized relaxation techniques
- Mood tracking and analytics
- Mental wellness coaching

#### 📊 **Recommendation Agent**

- Content personalization
- User behavior analysis
- Intelligent suggestions
- Preference learning

#### 🎬 **Video Editing Agent**

- Basic video editing operations
- Effect and transition application
- Video optimization
- Creative video assistance

#### 🤖 **General Assistant Agent**

- Multi-purpose AI assistance
- Web search and research
- Text generation and editing
- Translation and language support

### System Tools & Automation

#### 📁 **File Operations**

- Read, write, and modify files
- File search and pattern matching
- Content analysis and extraction
- Batch file processing

#### 🌐 **Browser Automation**

- Web scraping and data extraction
- Page navigation and interaction
- Screenshot capture
- Form automation

#### 💻 **Shell Integration**

- Command execution and scripting
- System process management
- Environment configuration
- Development workflow automation

#### 🚀 **Deployment & Infrastructure**

- Port exposure for public access
- Static website deployment
- Application containerization
- Service monitoring

## 🛠️ Technologies Used

### Core Framework

- **NestJS**: Progressive Node.js framework for scalable applications
- **TypeScript**: Strongly typed programming language
- **Bun**: Fast JavaScript runtime and package manager
- **Node.js**: Server-side JavaScript runtime

### AI & Machine Learning

- **LangChain**: Framework for developing LLM applications
- **OpenAI API**: GPT models via OpenRouter integration
- **Real AI Integration**: No mock data, production-ready AI services

### Database & Storage

- **MongoDB**: NoSQL database for flexible data storage
- **Prisma ORM**: Type-safe database client and query builder
- **Redis**: In-memory data store for caching and queues

### Queue & Background Processing

- **BullMQ**: Advanced Redis-based queue system
- **Background Jobs**: Asynchronous task processing
- **Session Persistence**: Offline task continuation

### API & Documentation

- **Swagger/OpenAPI**: Interactive API documentation
- **RESTful Design**: Standard HTTP methods and status codes
- **Real-time Features**: Streaming responses and WebSocket support

### Security & Validation

- **JWT Authentication**: Secure token-based authentication
- **class-validator**: Robust input validation
- **Helmet**: Security middleware for Express
- **CORS**: Cross-origin resource sharing configuration

### Development Tools

- **ESLint & Prettier**: Code quality and formatting
- **Docker**: Containerization support
- **PM2**: Process management for production

## 📦 Installation

### System Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB >= 5.0.0

### Step 1: Clone repository

```bash
git clone <repository-url>
cd manus-ai-api
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Environment configuration

```bash
cp .env.example .env
```

Edit the `.env` file with the necessary information:

```env
OPENAI_KEY=your_openai_api_key_here
DATABASE_URL="mongodb://localhost:27017/manus_ai"
PORT=3000
```

### Step 4: Database setup

```bash
npx prisma generate
npx prisma db push
```

### Step 5: Run the application

```bash
# Development (preferred with Bun)
bun run dev

# Development (with npm)
npm run dev

# Production build
bun run build
npm run build

# Production start
bun run start
npm run start
```

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │────│   Manus API     │────│   AI Services   │
│   (Frontend)    │    │   (NestJS)      │    │   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Background    │
                       │   Processing    │
                       │   (BullMQ)      │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Data Layer    │
                       │ (MongoDB+Redis) │
                       └─────────────────┘
```

### Core Modules

- **Agents Module**: AI agent management and execution
- **Queue Module**: Background job processing with BullMQ
- **AI Module**: Real AI service integration
- **Chat Module**: Real-time chat with AI agents
- **Generate Module**: Content generation (text/code/images)
- **Edit Module**: File editing and refactoring
- **Session Module**: Session persistence and management
- **Auth Module**: Authentication and authorization
- **Browser Module**: Web automation and scraping

## 🔄 System Flow

### Request Processing Flow

```
HTTP Request → Validation → Authentication → Service Layer → Queue/AI → Response
     │              │             │              │            │         │
     ▼              ▼             ▼              ▼            ▼         ▼
Client App    DTO Validation   JWT Check    Business Logic  BullMQ    JSON Response
```

### AI Agent Flow

```
1. Agent Selection → 2. Tool Discovery → 3. Context Building
         │                    │                    │
         ▼                    ▼                    ▼
4. AI Processing → 5. Tool Execution → 6. Response Generation
```

### Background Processing Flow

```
API Request → Job Creation → Queue Management → Worker Processing → Result Storage
     │             │              │                   │               │
     ▼             ▼              ▼                   ▼               ▼
User Action   BullMQ Job    Redis Queue         AI Service       MongoDB
```

## 📚 API Documentation

### Interactive Documentation

Access comprehensive Swagger documentation at:

- **Local Development**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/docs

### Base API Structure

```
Base URL: http://localhost:3001/api/v1
Content-Type: application/json
Authentication: Bearer JWT (where required)
```

## 🔧 Core API Endpoints

### Agent Management

#### 1. List All Agents

```bash
GET /api/v1/agents
```

**Response:**

```json
[
	{
		"name": "artistic_inspiration_agent",
		"description": "Agent specialized in artistic creativity support",
		"tools": ["search_artworks", "get_inspiration_sources", "..."],
		"category": "Art & Creativity"
	}
]
```

#### 2. Get Agent Details

```bash
GET /api/v1/agents/{agentName}
```

**Response:**

```json
{
  "name": "artistic_inspiration_agent",
  "description": "Agent specialized in artistic creativity support",
  "availableTools": [...],
  "systemPrompt": "You are an AI assistant specialized in art...",
  "settings": {
    "temperature": 0.8,
    "maxTokens": 2000
  }
}
```

### AI Interactions

#### 3. Chat with Agent (Real AI)

```bash
POST /api/v1/agents/{agentName}/chat
Content-Type: application/json

{
  "message": "I want to learn about Renaissance art",
  "userId": "user123",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "conversationId": "conv_12345"
}
```

**Response:**

```json
{
	"agent": "artistic_inspiration_agent",
	"response": "Renaissance art represents one of the most...",
	"toolsUsed": ["search_artworks", "web_search"],
	"timestamp": "2024-01-15T10:30:00Z",
	"conversationId": "conv_12345"
}
```

#### 4. Execute Specific Tool

```bash
POST /api/v1/agents/tools/execute
Content-Type: application/json

{
  "toolName": "search_artworks",
  "parameters": {
    "query": "Leonardo da Vinci",
    "style": "Renaissance",
    "limit": 10
  },
  "userId": "user123"
}
```

### Background Processing

#### 5. Chat with Background Processing

```bash
POST /api/v1/chat
Content-Type: application/json

{
  "message": "Generate a comprehensive report on renewable energy",
  "sessionId": "session_123",
  "agentType": "general_assistant_agent",
  "priority": "high"
}
```

**Response:**

```json
{
	"taskId": "task_uuid_123",
	"status": "queued",
	"estimatedTime": "2-5 minutes",
	"sessionId": "session_123"
}
```

#### 6. Check Task Status

```bash
GET /api/v1/chat/task/{taskId}
```

**Response:**

```json
{
	"taskId": "task_uuid_123",
	"status": "completed", // queued, processing, completed, failed
	"progress": 100,
	"result": "Generated report content...",
	"createdAt": "2024-01-15T10:30:00Z",
	"completedAt": "2024-01-15T10:33:00Z"
}
```

### Content Generation

#### 7. Generate Text Content

```bash
POST /api/v1/generate/text
Content-Type: application/json

{
  "prompt": "Write a technical article about microservices",
  "sessionId": "session_123",
  "parameters": {
    "maxTokens": 2000,
    "temperature": 0.7,
    "style": "technical"
  }
}
```

#### 8. Generate Code

```bash
POST /api/v1/generate/code
Content-Type: application/json

{
  "prompt": "Create a REST API endpoint for user authentication",
  "language": "typescript",
  "framework": "nestjs",
  "sessionId": "session_123"
}
```

### File Operations

#### 9. Edit/Refactor Code

```bash
POST /api/v1/edit/refactor
Content-Type: application/json

{
  "target": "user.service.ts",
  "operation": "refactor",
  "instruction": "Add input validation and error handling",
  "sessionId": "session_123"
}
```

### Session Management

#### 10. Create Session

```bash
POST /api/v1/session/create
Content-Type: application/json

{
  "sessionName": "Development Project",
  "metadata": {
    "project": "manus-api",
    "environment": "development"
  }
}
```

#### 11. Get Session Status

```bash
GET /api/v1/session/{sessionId}
```

**Response:**

```json
{
	"sessionId": "session_123",
	"status": "active",
	"tasksInQueue": 3,
	"completedTasks": 15,
	"configuration": {
		"aiEnabled": true,
		"queueEnabled": true,
		"maxConcurrentTasks": 5
	}
}
```

## 🔧 Specialized Agent Endpoints

### Artistic Inspiration

```bash
POST /api/v1/agents/artistic-inspiration/search
{
  "query": "Van Gogh starry night",
  "style": "Post-Impressionism",
  "period": "1889"
}
```

### Career Planning

```bash
POST /api/v1/agents/career-planning/assess-skills
{
  "userId": "user123",
  "skills": ["JavaScript", "TypeScript", "NestJS", "MongoDB"],
  "experience": "intermediate"
}
```

### Customer Service

```bash
POST /api/v1/agents/customer-service/handle-inquiry
{
  "message": "How do I reset my password?",
  "userId": "user123",
  "priority": "normal"
}
```

### Email Management

```bash
POST /api/v1/agents/email-management/compose
{
  "to": ["colleague@company.com"],
  "subject": "Project Update Meeting",
  "body": "I'd like to schedule a meeting to discuss...",
  "tone": "professional"
}
```

### Learning Platform

```bash
POST /api/v1/agents/learning-platform/enroll
{
  "userId": "user123",
  "courseId": "nestjs-advanced-course"
}
```

## 📊 Real-time Features

### WebSocket Connections

```javascript
// Connect to real-time updates
const socket = io('http://localhost:3001');

// Listen for task progress
socket.on('task:progress', (data) => {
	console.log(`Task ${data.taskId}: ${data.progress}%`);
});

// Listen for completion
socket.on('task:completed', (data) => {
	console.log('Task completed:', data.result);
});
```

### Streaming Responses

```bash
POST /api/v1/chat/stream
Content-Type: application/json

{
  "message": "Write a long technical document",
  "sessionId": "session_123",
  "stream": true
}
```

**Response:** Server-Sent Events (SSE) stream

## 📁 Project Structure

```
src/
├── agents/                    # AI Agent Management
│   ├── agents.controller.ts   # REST API endpoints for agents
│   ├── agents.service.ts      # Business logic for agent operations
│   ├── tools.service.ts       # Tool execution and management
│   ├── langchain.service.ts   # LangChain integration layer
│   ├── dto/                   # Data Transfer Objects
│   └── agents.module.ts       # Agent module configuration
├── ai/                        # AI Service Integration
│   ├── ai.service.ts          # Core AI service (OpenAI integration)
│   └── ai.module.ts           # AI module configuration
├── queue/                     # Background Processing
│   ├── queue.service.ts       # Queue management
│   ├── processors/            # Job processors
│   │   ├── chat.processor.ts  # Chat job processing
│   │   ├── generation.processor.ts # Content generation
│   │   └── edit.processor.ts  # File editing jobs
│   └── queue.module.ts        # Queue module configuration
├── chat/                      # Real-time Chat
│   ├── chat.controller.ts     # Chat API endpoints
│   ├── chat.service.ts        # Chat business logic
│   └── chat.module.ts         # Chat module configuration
├── generate/                  # Content Generation
│   ├── generate.controller.ts # Generation API endpoints
│   ├── generate.service.ts    # Generation logic
│   └── generate.module.ts     # Generation module
├── edit/                      # File Operations
│   ├── edit.controller.ts     # File editing endpoints
│   ├── edit.service.ts        # File operation logic
│   └── edit.module.ts         # Edit module
├── session/                   # Session Management
│   ├── session.controller.ts  # Session API endpoints
│   ├── session.service.ts     # Session persistence
│   └── session.module.ts      # Session module
├── auth/                      # Authentication
│   ├── auth.controller.ts     # Auth endpoints
│   ├── auth.service.ts        # Authentication logic
│   └── auth.module.ts         # Auth module
├── browser/                   # Web Automation
│   ├── browser.service.ts     # Puppeteer integration
│   └── browser.module.ts      # Browser module
├── common/                    # Shared Components
│   ├── config/                # Configuration files
│   │   ├── tools.config.ts    # Tools and agents definition
│   │   └── prompt.config.ts   # AI prompts and tool definitions
│   ├── constants/             # Application constants
│   ├── exceptions/            # Custom exception filters
│   └── interfaces/            # TypeScript interfaces
├── prisma/                    # Database Layer
│   ├── prisma.service.ts      # Prisma client service
│   └── prisma.module.ts       # Database module
├── redis/                     # Cache Layer
│   ├── redis.service.ts       # Redis client service
│   └── redis.module.ts        # Redis module
├── user/                      # User Management
│   ├── user.controller.ts     # User API endpoints
│   ├── user.service.ts        # User business logic
│   └── user.module.ts         # User module
├── app.module.ts              # Root application module
└── main.ts                    # Application entry point
```

## 🔗 Context7 Integration

Manus AI API integrates with Context7 for enhanced documentation and library support:

### Context7 Features

- **Library Documentation**: Access to comprehensive NestJS and related library docs
- **Code Examples**: Real-world code snippets and implementations
- **Best Practices**: Industry-standard patterns and conventions
- **Tool Integration**: Context7-compatible tools for development assistance

### Available Context7 Libraries

- **NestJS Core** (`/nestjs/nest`): Main framework documentation
- **NestJS Prisma** (`/notiz-dev/nestjs-prisma`): Prisma integration patterns
- **NestJS Bull** (`/nestjs/bull`): Queue processing documentation
- **NestJS JWT** (`/nestjs/jwt`): Authentication implementation guides

### Using Context7 in Development

```bash
# Access NestJS documentation
curl -X GET "https://context7.ai/api/docs/nestjs/nest"

# Get specific implementation examples
curl -X GET "https://context7.ai/api/examples/nestjs/bull/queue-setup"
```

## 🔧 Tools and Agents Configuration

### Adding New Tool

```typescript
// src/common/config/tools.config.ts
export const newTool: ToolConfig = {
	name: 'new_tool',
	description: 'New tool description',
	category: ToolCategory.GENERAL,
	schema: {
		type: 'object',
		properties: {
			param1: { type: 'string', description: 'Parameter 1' },
		},
		required: ['param1'],
	},
	handler: async (input) => {
		// Tool processing logic
		return `Result: ${input.param1}`;
	},
};
```

### Creating New Agent

```typescript
// src/common/config/tools.config
export const newAgent: AgentConfig = {
	name: 'new_agent',
	description: 'New agent',
	tools: ['tool1', 'tool2'],
	systemPrompt: 'You are an AI assistant...',
	temperature: 0.7,
	maxTokens: 2000,
};
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Monitoring and Logging

API automatically logs important activities:

- Requests/responses
- Tool executions
- Agent interactions
- Errors and exceptions

## 🔒 Security

- CORS configured for cross-origin requests
- Input validation with class-validator
- Rate limiting (configurable)
- Environment variables for sensitive data

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t manus-ai-api .

# Run container
docker run -p 3000:3000 --env-file .env manus-ai-api
```

### PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

- Email: support@manus.im
- Documentation: [API Docs](http://localhost:3000/api)
- Issues: [GitHub Issues](https://github.com/duonguyen321/issues)

## 🗺️ Roadmap

- [ ] Add authentication/authorization
- [ ] Integrate more AI models
- [ ] WebSocket support for real-time chat
- [ ] File upload/processing capabilities
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Plugin system for custom tools

---

**Manus AI** - AI that can do everything 🤖✨
