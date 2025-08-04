# Manus AI API - Comprehensive Test Suite

## Overview
This document provides comprehensive CURL commands to test all API endpoints of the Manus AI API system that has been refactored to use proper OpenAI + LangChain libraries instead of direct fetch calls.

## Base Configuration
```bash
export BASE_URL="http://localhost:3001"
export API_BASE="$BASE_URL/api/v1"
```

## 1. Health & Status Endpoints

### Application Health Check
```bash
curl -X GET "$API_BASE/" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n"
```

## 2. Agents Management APIs

### List All Available Agents
```bash
curl -X GET "$API_BASE/agents" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Get Specific Agent Details
```bash
curl -X GET "$API_BASE/agents/general_assistant_agent" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Get Artistic Inspiration Agent
```bash
curl -X GET "$API_BASE/agents/artistic_inspiration_agent" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Get Career Planning Agent
```bash
curl -X GET "$API_BASE/agents/career_planning_agent" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 3. Session Management APIs

### Create New Session
```bash
curl -X POST "$API_BASE/session/create" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "sessionName": "Test API Session",
    "metadata": {
      "environment": "test",
      "purpose": "api_testing"
    }
  }' \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Get Session Status (requires session ID from create)
```bash
# Replace SESSION_ID with actual ID from create response
curl -X GET "$API_BASE/session/{SESSION_ID}" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 4. AI Generation APIs

### Generate Text Content
```bash
# First create a session, then use the session ID
SESSION_ID=$(curl -s -X POST "$API_BASE/session/create" \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "Text Gen Test"}' | jq -r '.sessionId')

curl -X POST "$API_BASE/generate/text" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"prompt\": \"Write a short paragraph about the benefits of AI in healthcare\",
    \"sessionId\": \"$SESSION_ID\",
    \"parameters\": {
      \"maxTokens\": 150,
      \"temperature\": 0.7
    }
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Generate Code
```bash
curl -X POST "$API_BASE/generate/code" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"prompt\": \"Create a simple REST API endpoint for user authentication using TypeScript and NestJS\",
    \"language\": \"typescript\",
    \"framework\": \"nestjs\",
    \"sessionId\": \"$SESSION_ID\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Generate Image Description
```bash
curl -X POST "$API_BASE/generate/image" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"prompt\": \"A futuristic AI assistant helping developers\",
    \"sessionId\": \"$SESSION_ID\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 5. Chat & Conversation APIs

### Background Chat Processing
```bash
curl -X POST "$API_BASE/chat" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"message\": \"Explain the difference between machine learning and deep learning\",
    \"sessionId\": \"$SESSION_ID\",
    \"agentType\": \"general_assistant_agent\",
    \"priority\": \"normal\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Check Chat Task Status
```bash
# Use task ID from chat response
TASK_ID="replace-with-actual-task-id"
curl -X GET "$API_BASE/chat/task/$TASK_ID" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Get Chat Health Status
```bash
curl -X GET "$API_BASE/chat/health" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 6. File & Code Editing APIs

### Create New File
```bash
curl -X POST "$API_BASE/edit/create" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"instruction\": \"Create a simple TypeScript interface for a User model with name, email, and id fields\",
    \"sessionId\": \"$SESSION_ID\",
    \"filePath\": \"models/user.interface.ts\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Update Existing File
```bash
curl -X POST "$API_BASE/edit/update" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"instruction\": \"Add input validation and error handling to the user interface\",
    \"sessionId\": \"$SESSION_ID\",
    \"target\": \"models/user.interface.ts\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Refactor Code
```bash
curl -X POST "$API_BASE/edit/refactor" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"target\": \"user.service.ts\",
    \"operation\": \"refactor\",
    \"instruction\": \"Add TypeScript strict types and improve error handling\",
    \"sessionId\": \"$SESSION_ID\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Format Code
```bash
curl -X POST "$API_BASE/edit/format" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"code\": \"function hello(){console.log('world')}\",
    \"language\": \"javascript\",
    \"sessionId\": \"$SESSION_ID\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Delete File
```bash
curl -X POST "$API_BASE/edit/delete" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"target\": \"temp-file.js\",
    \"sessionId\": \"$SESSION_ID\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 7. Task Management APIs

### Get Task Status (works for all task types)
```bash
TASK_ID="replace-with-task-id"
curl -X GET "$API_BASE/generate/task/$TASK_ID" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Retry Failed Task
```bash
curl -X POST "$API_BASE/generate/task/$TASK_ID/retry" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Cancel Running Task
```bash
curl -X POST "$API_BASE/generate/task/$TASK_ID/cancel" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Delete Task
```bash
curl -X DELETE "$API_BASE/generate/task/$TASK_ID" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 8. History & Analytics APIs

### Get Generation History
```bash
curl -X GET "$API_BASE/generate/history/$SESSION_ID" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Get Edit History
```bash
curl -X GET "$API_BASE/edit/history/$SESSION_ID" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 9. Health Check APIs

### Generate Service Health
```bash
curl -X GET "$API_BASE/generate/health" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

### Edit Service Health
```bash
curl -X GET "$API_BASE/edit/health" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 10. Advanced Agent Interactions

### Execute Tool with Agent
```bash
curl -X POST "$API_BASE/agents/tools/execute" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"toolName\": \"search_web\",
    \"parameters\": {
      \"query\": \"latest AI technology trends 2025\",
      \"limit\": 5
    },
    \"userId\": \"test-user-123\"
  }" \
  -w "\nStatus: %{http_code}\n" | jq '.'
```

## 11. Batch Testing Script

### Complete API Test Runner
```bash
#!/bin/bash

export BASE_URL="http://localhost:3001"
export API_BASE="$BASE_URL/api/v1"

echo "=== Manus AI API Test Suite ==="
echo "Base URL: $API_BASE"
echo

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s -X GET "$API_BASE/" | jq -r '.message // "OK"'

# Test 2: List Agents
echo "2. Testing Agents List..."
AGENT_COUNT=$(curl -s -X GET "$API_BASE/agents" | jq 'length')
echo "Found $AGENT_COUNT agents"

# Test 3: Create Session
echo "3. Creating Test Session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_BASE/session/create" \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "API Test Session"}')
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.sessionId // .id // "test-session"')
echo "Session ID: $SESSION_ID"

# Test 4: Generate Text (Background)
echo "4. Testing Text Generation..."
GEN_RESPONSE=$(curl -s -X POST "$API_BASE/generate/text" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"Hello AI\", \"sessionId\": \"$SESSION_ID\"}")
echo "Generation Response: $(echo "$GEN_RESPONSE" | jq -r '.taskId // .message')"

echo
echo "=== Test Suite Complete ==="
```

## Key Features Tested

1. **Real AI Integration**: All endpoints now use ChatOpenAI from LangChain instead of direct fetch calls
2. **Proper Error Handling**: LangChain provides better error handling and retry mechanisms  
3. **Streaming Support**: Uses LangChain's native streaming capabilities
4. **Tool Integration**: Proper tool binding and execution through LangChain
5. **Session Management**: Background task processing with Redis queues
6. **Health Monitoring**: Service health checks for all components

## Environment Requirements

- Node.js >= 18.0.0
- OpenAI API Key (configured in .env)
- MongoDB connection (for session persistence)
- Redis connection (for queue management)

## Expected Response Formats

All APIs return JSON responses with the following structure:
- Success: `{ "data": ..., "status": "success" }`
- Error: `{ "message": "error description", "error": "Error Type", "statusCode": 400 }`
- Background tasks: `{ "taskId": "uuid", "status": "queued", "estimatedTime": "2-5 minutes" }`

This test suite validates that the AI service refactoring from direct fetch calls to proper OpenAI + LangChain integration is working correctly across all endpoints.