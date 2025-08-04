# Codebase Architecture

## Core Architecture Patterns

### 1. Multi-Agent System
- **Location**: `src/agents/`
- **Pattern**: Each agent has specialized tools and capabilities
- **Configuration**: Centralized in `src/common/config/tools.config.ts`
- **Agents Available**:
  - Artistic Inspiration
  - Career Planning  
  - Customer Service
  - Email Management
  - Learning Platform
  - Stress Management
  - Recommendation System
  - Video Editing
  - General Assistant

### 2. Service Layer Architecture
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic implementation
- **DTOs**: Data transfer objects with validation
- **Guards**: Authentication and authorization
- **Decorators**: Custom decorators for cross-cutting concerns

### 3. Database Design
- **ORM**: Prisma with MongoDB
- **Schema**: Comprehensive schema supporting all agent functionalities
- **Models**: Separate model groups for each agent domain
- **Relationships**: Well-defined relationships between entities

### 4. Configuration Management
- **Environment**: `.env` files for configuration
- **Constants**: Centralized in `src/common/constants/`
- **Tools Config**: Agent and tool definitions in dedicated config files

### 5. Authentication System
- **JWT**: Access and refresh token system
- **OAuth**: Google OAuth integration
- **Guards**: Role-based access control
- **Password**: bcryptjs for hashing

### 6. Error Handling
- **Filters**: Global exception filters
- **DTOs**: Standardized error response format
- **Validation**: Input validation with class-validator