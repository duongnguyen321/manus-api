# Code Style & Conventions

## TypeScript Configuration
- **Target**: ESNext
- **Module**: NodeNext
- **Decorators**: Enabled (experimentalDecorators: true)
- **Strict Checks**: Partially disabled (strictNullChecks: false, noImplicitAny: false)
- **Path Mapping**: `@/*` maps to `./src/*`

## Code Style
- **Formatter**: Prettier
- **Linter**: ESLint with TypeScript support
- **File Extensions**: `.ts` for TypeScript files
- **Import Style**: ES6 imports/exports

## NestJS Conventions
- **Decorators**: Extensive use of NestJS decorators (@Controller, @Injectable, @Get, etc.)
- **Modules**: Feature-based module organization
- **DTOs**: class-validator and class-transformer for validation
- **Services**: Business logic separation in services
- **Guards**: Authentication and authorization guards

## Project Structure
```
src/
├── agents/           # AI agents module
├── auth/            # Authentication
├── common/          # Shared utilities, configs, constants
├── mail/            # Email functionality
├── prisma/          # Database service
├── user/            # User management
├── redis/           # Cache management
├── cron/            # Scheduled tasks
└── main.ts          # Application entry point
```

## File Naming
- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **Modules**: `*.module.ts`
- **DTOs**: `*.dto.ts`
- **Interfaces**: `I*.ts` prefix
- **Decorators**: `*.decorator.ts`
- **Guards**: `*.guard.ts`