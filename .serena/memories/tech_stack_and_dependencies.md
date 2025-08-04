# Tech Stack and Dependencies

## Core Framework
- **NestJS**: Progressive Node.js framework for building scalable server-side applications
- **TypeScript**: Primary language with strict typing
- **Node.js**: Runtime environment (>= 18.0.0)
- **Bun**: Package manager and build tool for faster development

## Database & ORM
- **MongoDB**: NoSQL database for flexible data storage
- **Prisma**: Modern ORM for database access with type safety
- **Redis**: In-memory data store for caching and queue management

## AI & ML Integration
- **LangChain**: Framework for developing LLM applications
- **OpenAI API**: Primary AI service provider (via OpenRouter)
- **@langchain/community**: Community tools and integrations
- **@langchain/openai**: OpenAI-specific LangChain integration

## Queue & Background Processing
- **BullMQ**: Advanced queue system for background jobs
- **@nestjs/bull**: NestJS integration for Bull queues
- **@nestjs/schedule**: Cron job scheduling

## Authentication & Security
- **@nestjs/jwt**: JWT authentication
- **bcryptjs**: Password hashing
- **helmet**: Security middleware
- **class-validator**: Input validation
- **class-transformer**: Data transformation

## API & Documentation
- **@nestjs/swagger**: OpenAPI/Swagger documentation
- **express**: Web framework
- **cors**: Cross-origin resource sharing

## Email & Communication
- **@nestjs-modules/mailer**: Email sending capabilities
- **puppeteer**: Browser automation for web scraping

## Development Tools
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **ts-node**: TypeScript execution
- **source-map-support**: Better error stack traces

## File Handling & Utilities
- **multer**: File upload middleware
- **multer-storage-cloudinary**: Cloudinary storage integration
- **uuid**: Unique identifier generation
- **moment**: Date/time manipulation
- **axios**: HTTP client
- **csv-parser**: CSV file processing

## Environment
- **Darwin (macOS)**: Primary development environment
- **Docker**: Containerization support
- **PM2**: Process management for production