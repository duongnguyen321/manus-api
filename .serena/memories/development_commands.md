# Development Commands and Scripts

## Primary Development Commands
```bash
# Development server with hot reload
bun run dev
# or
npm run dev

# Production build
bun run build
# or
npm run build

# Start production server
bun run start
# or
npm run start

# Code formatting
bun run format
# or
npm run format

# Linting with auto-fix
bun run lint
# or
npm run lint
```

## Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db reset
```

## Package Management (Bun preferred)
```bash
# Install dependencies
bun install

# Add new dependency
bun add <package>

# Add dev dependency
bun add -d <package>

# Remove dependency
bun remove <package>

# Update dependencies
bun update
```

## Build and Deployment
```bash
# Clean build
rm -rf dist && bun run build

# Docker build
docker build -t manus-api .

# Docker run
docker run -p 3001:3001 --env-file .env manus-api
```

## Development Workflow
1. **Setup**: Copy .env.example to .env and configure
2. **Install**: Run `bun install`
3. **Database**: Run `npx prisma generate`
4. **Develop**: Run `bun run dev`
5. **Test**: Access http://localhost:3001/api for Swagger docs
6. **Format**: Run `bun run format` before commits
7. **Lint**: Run `bun run lint` to check code quality
8. **Build**: Run `bun run build` for production

## System Commands (macOS)
- **File operations**: Standard Unix commands (ls, cd, grep, find)
- **Process management**: ps, kill, pkill
- **Network**: netstat, lsof
- **Package management**: brew (Homebrew)
- **Version control**: git commands