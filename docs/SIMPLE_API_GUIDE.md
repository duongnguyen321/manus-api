# Simple AI API - Quick Start Guide

## Overview

The Simple AI API provides the fastest way to interact with Manus AI capabilities right after account creation. Just create a session and start chatting - the AI will automatically execute code, browse web, manage files, and more based on your requests.

## Quick Start (3 Steps)

### 1. Create Account & Get Token

```bash
# Create account
curl -X POST "http://localhost:3001/api/v1/auth/create-account" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword",
    "name": "Your Name"
  }'

# Login to get token
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

### 2. Create Simple AI Session

```bash
curl -X POST "http://localhost:3001/api/v1/simple/sessions" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "sessionId": "simple_1234567890_abc123",
  "message": "Simple AI session created. You can now chat, execute code, browse web, and more!",
  "created": "2025-08-04T11:00:00.000Z"
}
```

### 3. Start Chatting

```bash
curl -X POST "http://localhost:3001/api/v1/simple/chat" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! Can you help me write a Python script to calculate fibonacci numbers?",
    "sessionId": "simple_1234567890_abc123"
  }'
```

## What the AI Can Do

The Simple AI automatically uses these capabilities based on your requests:

### 🐍 **Code Execution**
- **Python**: Data analysis, machine learning, web scraping
- **Node.js**: Web development, API testing, automation
- **Bash**: System operations, file management, tools

**Example requests:**
- "Write a Python script to analyze this CSV data"
- "Create a Node.js API endpoint for user authentication"
- "Use bash to find all large files in the current directory"

### 🌐 **Web Browsing & Scraping**
- Navigate websites and extract information
- Take screenshots and analyze web content
- Monitor websites for changes
- Automate web interactions

**Example requests:**
- "Go to news.ycombinator.com and get the top 5 stories"
- "Take a screenshot of google.com"
- "Check if the price changed on this product page"

### 📁 **File Operations**
- Read, write, and manage files
- Process documents and data
- Create reports and documentation
- Handle multiple file formats

**Example requests:**
- "Create a CSV file with sample sales data"
- "Read this JSON file and convert it to YAML"
- "Generate a report from these log files"

### 🔍 **Web Search & Research**
- Search for current information
- Gather data from multiple sources
- Fact-checking and verification
- Research assistance

**Example requests:**
- "Search for the latest AI research papers"
- "Find information about Python 3.12 new features"
- "Research the best practices for API security"

### 💬 **Natural Conversation**
- Answer questions on any topic
- Explain complex concepts
- Provide step-by-step guidance
- Generate creative content

## Advanced Usage Examples

### Data Analysis Workflow
```bash
curl -X POST "http://localhost:3001/api/v1/simple/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a Python script that downloads stock data for AAPL, analyzes the trends, and creates a visualization",
    "sessionId": "your_session_id"
  }'
```

### Web Development Helper
```bash
curl -X POST "http://localhost:3001/api/v1/simple/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Build a simple React component for a todo list with add, delete, and mark complete functionality",
    "sessionId": "your_session_id"
  }'
```

### Research Assistant
```bash
curl -X POST "http://localhost:3001/api/v1/simple/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Research the current state of quantum computing and create a summary report with key developments and major players",
    "sessionId": "your_session_id"
  }'
```

## API Endpoints

### Health Check
```bash
GET /api/v1/simple/health
```

### Session Management
```bash
# Create session
POST /api/v1/simple/sessions

# Get session details
GET /api/v1/simple/sessions/{sessionId}

# Delete session (cleans up all resources)
DELETE /api/v1/simple/sessions/{sessionId}
```

### Chat Interface
```bash
# Send message to AI
POST /api/v1/simple/chat
{
  "message": "Your message here",
  "sessionId": "optional_session_id"
}
```

## Response Format

All chat responses include:

```json
{
  "response": "AI response message",
  "sessionId": "session_identifier", 
  "toolsUsed": ["list", "of", "tools", "used"],
  "executionTime": 1500,
  "timestamp": "2025-08-04T11:00:00.000Z"
}
```

## Key Features

✅ **Automatic Tool Selection**: AI chooses the right tools based on your request  
✅ **Session Persistence**: All context and resources are maintained  
✅ **Resource Management**: Docker containers and browser contexts auto-managed  
✅ **Security**: All code execution in isolated Docker containers  
✅ **Real Implementation**: No mocks - all tools perform actual operations  
✅ **Prompt-Driven**: Uses advanced prompts from Manus AI system  

## Docker Control (Advanced)

If you need direct Docker control, use the separate Docker API:

```bash
# Execute code directly
POST /api/v1/docker/execute
{
  "language": "python",
  "code": "print('Hello World')",
  "sessionId": "optional"
}

# Create persistent container
POST /api/v1/docker/containers
{
  "language": "python", 
  "sessionId": "your_session"
}
```

## Error Handling

- **401 Unauthorized**: Missing or invalid token
- **404 Not Found**: Session doesn't exist
- **400 Bad Request**: Invalid request format
- **500 Internal Error**: Server error (check logs)

## Tips for Best Results

1. **Be Specific**: Clear requests get better results
2. **Use Context**: Reference previous messages in the session
3. **Break Down Complex Tasks**: Large projects work better in steps
4. **Provide Examples**: Show desired input/output format when possible
5. **Session Management**: Delete sessions when done to free resources

## Next Steps

1. Create your account and get started immediately
2. Try different types of requests to see AI capabilities
3. Build complex workflows by chaining requests
4. Integrate into your applications via the REST API

The Simple AI API makes powerful AI capabilities accessible with minimal setup - just authenticate and start chatting!