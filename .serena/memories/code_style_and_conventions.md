# Code Style and Conventions

## TypeScript Configuration
- **Target**: ESNext
- **Module**: NodeNext
- **Decorators**: Enabled (experimentalDecorators: true)
- **Strict Mode**: Partially enabled (strictNullChecks: false)
- **Path Mapping**: `@/*` maps to `./src/*`
- **Source Maps**: Enabled for debugging

## Naming Conventions
- **Files**: kebab-case (e.g., `user.service.ts`, `auth.controller.ts`)
- **Classes**: PascalCase (e.g., `UserService`, `AuthController`)
- **Interfaces**: PascalCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE
- **Variables/Functions**: camelCase
- **Database Models**: PascalCase (Prisma convention)

## NestJS Conventions
- **Controllers**: End with `.controller.ts`
- **Services**: End with `.service.ts`
- **Modules**: End with `.module.ts`
- **DTOs**: End with `.dto.ts`
- **Decorators**: Use NestJS decorators extensively (@Injectable, @Controller, etc.)
- **Dependency Injection**: Constructor-based injection

## File Structure Patterns
```
src/
├── module-name/
│   ├── module-name.controller.ts
│   ├── module-name.service.ts
│   ├── module-name.module.ts
│   ├── dto/
│   │   └── module-name.dto.ts
│   └── interfaces/
└── common/
    ├── config/
    ├── constants/
    ├── exceptions/
    └── interfaces/
```

## Code Quality Rules
- **ESLint**: TypeScript ESLint with Prettier integration
- **Prettier**: Automatic code formatting
- **Validation**: Use class-validator for DTOs
- **Error Handling**: Custom exception filters
- **Logging**: Structured logging with context

## Documentation Standards
- **API Documentation**: Swagger/OpenAPI decorators
- **Code Comments**: JSDoc format for complex functions
- **README**: Comprehensive with examples
- **Environment**: Document all environment variables

## Security Guidelines
- **Input Validation**: Always validate user input
- **Authentication**: JWT-based with refresh tokens
- **Secrets**: Environment variables only
- **CORS**: Properly configured
- **Rate Limiting**: Implement for public endpoints

## Database Conventions
- **Models**: PascalCase names
- **Fields**: camelCase
- **Relations**: Properly defined with Prisma
- **Migrations**: Use Prisma migrations for schema changes

## Testing Patterns (when implemented)
- **Unit Tests**: `.spec.ts` files
- **E2E Tests**: `.e2e-spec.ts` files
- **Test Data**: Mock data in separate files
- **Coverage**: Aim for high test coverage