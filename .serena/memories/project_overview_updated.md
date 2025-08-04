# Manus AI API - Project Overview

## Project Purpose
Manus AI API is a comprehensive, versatile AI system built with NestJS that provides specialized AI agents capable of performing various tasks. The project aims to create a modular, scalable AI platform that can handle multiple types of AI-powered operations through specialized agents.

## Key Features
- **Multi-Agent AI System**: 9 specialized AI agents including artistic inspiration, career planning, customer service, email management, learning platform, stress management, recommendation, video editing, and general assistant
- **Real-time Background Processing**: Uses BullMQ with Redis for queue management and background task processing
- **Session Persistence**: AI tasks can run in the background with session persistence for offline capability
- **Browser Automation**: Integration with Puppeteer for web scraping and browser automation
- **Comprehensive Tool System**: Extensive system tools including file operations, shell commands, browser automation, web search, and deployment capabilities
- **Real AI Integration**: Uses OpenAI API with real AI services (no mock data)
- **RESTful API**: Complete REST API with Swagger documentation
- **Database Integration**: MongoDB with Prisma ORM for data persistence

## Target Use Cases
- Automated AI assistance for various domains
- Background AI task processing
- Multi-modal AI interactions (text, file, web)
- Enterprise AI workflow automation
- Educational and creative AI tools
- Customer service automation

## Architecture Highlights
- **Microservice-ready**: Modular architecture with clear separation of concerns
- **Queue-based Processing**: Background job processing for scalability
- **Real-time Capabilities**: WebSocket support and streaming responses
- **Security**: JWT authentication, input validation, CORS, Helmet
- **Monitoring**: Comprehensive logging and error handling
- **Deployment Ready**: Docker support, PM2 configuration