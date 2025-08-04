# PRP Framework - JavaScript/TypeScript Development

## Quick Start

This is a **Product Requirement Prompt (PRP) Framework** designed for JavaScript/TypeScript development.

**Core Concept**: `PRP = PRD + curated codebase intelligence + agent/runbook`

## For Business Analysts & Product Managers

### Step 1: Describe Your Feature

Fill out the feature request template:

```markdown
## Feature Description

[Describe what you want to build]

## Framework Context

- [ ] React 19+
- [ ] Next.js 15+
- [ ] Node.js 20+
- [ ] Astro 5+
- [ ] Vue 3+
- [ ] Nuxt 3+

## Success Criteria

- [ ] What does success look like?
- [ ] How will you measure it?
```

### Step 2: Generate Comprehensive PRP

Run: `/generate-prp [feature-name]`

The AI will ask you structured questions to create a complete implementation guide.

### Step 3: Execute Implementation

Run: `/execute-prp [prp-name]`

The AI will implement the entire feature following best practices.

## For Developers

### Available Commands

- `/generate-prp [description]` - Interactive PRP creation via Q&A
- `/execute-prp [prp-name]` - Full feature implementation

### Framework Support

- **React 19+**: Server Components, Actions API, ReactElement types
- **Next.js 15+**: App Router, Turbopack, Server Actions
- **Node.js 20+**: Native TypeScript, Domain-driven design
- **Astro 5+**: Islands Architecture, pnpm mandatory
- **Vue 3+/Nuxt 3+**: Composition API, Auto-imports

### Quality Standards

- **TypeScript**: Strict mode, no `any` types
- **Testing**: 80% coverage minimum
- **Validation**: Zod for all external data
- **Search**: ripgrep (rg) only, no grep/find
- **Package Manager**: bun > pnpm > yarn > npm

## File Structure

```
.claude/
├── ai-docs/                # AI documentation (markdown, YAML)
├── commands/               # AI commands
├── templates/              # PRP templates
└── human-docs/            # Documentation (markdown)
```

## Success Methodology

1. **Context is King** - Comprehensive documentation and examples
2. **Validation Loops** - Executable tests and quality gates
3. **Information Dense** - JavaScript/TypeScript ecosystem patterns
4. **Progressive Success** - Start simple, validate, enhance
