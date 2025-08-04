# Execute PRP - Full Context Implementation

Execute JavaScript/TypeScript PRP with comprehensive context loading.

## PRP: $ARGUMENTS

## Process: Load All Context → Plan → Execute → Validate

### Step 1: MANDATORY Context Loading

**MUST read ALL context before any implementation:**

```bash
# 1. Read AI Rules and Reasoning Patterns
READ .claude/ai-docs/rules.md                    # Core AI reasoning (Ω*, P*, M*, etc.)

# 2. Read All Standards and Patterns
READ .claude/ai-docs/js-ts-standards.yml        # TypeScript requirements, quality gates
READ .claude/ai-docs/framework-patterns.yml     # Framework-specific intelligence
READ .claude/ai-docs/validation-commands.yml    # Executable validation patterns

# 3. Read Project Context
READ .claude/human-docs/README.md       # Project overview and methodology

# 4. Read ALL PRPs for Pattern Understanding
FIND PRPs/ -name "*.md" -exec basename {} \;  # List all PRPs
READ PRPs/[each-prp-file].md           # Read ALL existing PRPs for patterns

# 5. Read Target PRP
READ PRPs/$ARGUMENTS.md                 # The specific PRP to implement

# 6. Read AI Documentation
READ PRPs/ai_docs/*.md                  # All curated Claude Code documentation

# 7. Analyze Codebase Context
rg --files -g "*.{js,ts,jsx,tsx,vue,astro}" | head -20
rg "export.*function|export.*class" --type js --type ts | head -10
rg "package\.json" -A 10 | grep -E "(scripts|dependencies)"
```

### Step 2: Framework Detection and Activation

```bash
# Auto-detect framework from codebase
DETECT_FRAMEWORK() {
  if rg -q "next\.config\." . ; then FRAMEWORK="nextjs15"; fi
  if rg -q "astro\.config\." . ; then FRAMEWORK="astro5"; fi
  if rg -q "\"react\":" package.json ; then FRAMEWORK="react19"; fi
  if rg -q "\"vue\":" package.json ; then FRAMEWORK="vue3"; fi
  if rg -q "server|api" --type js --type ts ; then FRAMEWORK+="_nodejs20"; fi
}

# Activate framework-specific patterns from framework-patterns.yml
ACTIVATE framework_patterns.$FRAMEWORK
LOAD validation_commands.$FRAMEWORK
```

### Step 3: Comprehensive Planning

**Create detailed implementation plan using TodoWrite:**

```yaml
# Planning Structure
context_analysis:
  - codebase_patterns: [identified from context reading]
  - framework_requirements: [from framework-patterns.yml]
  - validation_strategy: [from validation-commands.yml]
  - existing_prp_patterns: [from all PRPs read]

implementation_todos:
  - task_1: [specific file operations with validation]
  - task_2: [following existing patterns from PRPs]
  - task_n: [comprehensive coverage of PRP requirements]

validation_checkpoints:
  - syntax_check: [framework-specific commands]
  - unit_tests: [test patterns from PRPs]
  - integration_validation: [end-to-end verification]
```

### Step 4: Implementation Execution

**Execute following PRP patterns and AI rules:**

1. **Follow Ω\* reasoning patterns** from rules.md
2. **Apply framework-specific intelligence** from framework-patterns.yml
3. **Use existing PRP implementation patterns** learned from context
4. **Implement with P\* planning methodology** (break→subproblems→organize→link)
5. **Apply C\* quality standards** (TypeScript strict, 80% coverage, file limits)
6. **Use Search\* patterns** (ripgrep only, no grep/find)
7. **Follow ¬\* anti-patterns** (no any types, validation required, etc.)

### Step 5: Validation Loop Execution

**Run validation commands from validation-commands.yml:**

```bash
# Level 1: Syntax & Style
EXECUTE validation_commands.$FRAMEWORK.level_1_syntax

# Level 2: Testing
EXECUTE validation_commands.$FRAMEWORK.level_2_tests

# Level 3: Build/Integration
EXECUTE validation_commands.$FRAMEWORK.level_3_build

# Level 4: Framework-Specific
EXECUTE validation_commands.$FRAMEWORK.level_4_*

# Universal Quality Gates
VERIFY coverage_minimum >= 80
VERIFY eslint_max_warnings == 0
VERIFY typescript_errors == 0
```

### Step 6: Final Verification

**Ensure implementation meets all requirements:**

- [ ] ALL context was read and understood
- [ ] Framework patterns properly applied
- [ ] Existing PRP patterns followed
- [ ] Target PRP requirements fully met
- [ ] All validation levels passed
- [ ] Quality gates satisfied
- [ ] Anti-patterns avoided

## Implementation Approach

### With Specific Task Params

If `$ARGUMENTS` includes specific task requirements:

1. **Still read ALL context first** (non-negotiable)
2. **Focus implementation** on specific requirements
3. **Maintain comprehensive validation** for quality

### Without Specific Params

If `$ARGUMENTS` is just PRP name:

1. **Read ALL context first** (non-negotiable)
2. **Implement ENTIRE feature** as specified in PRP
3. **Complete ALL validation levels** before marking done

## Context Integration Examples

```bash
# Example: If implementing React component
READ .claude/ai-docs/framework-patterns.yml → react19 section
APPLY ReactElement types, not JSX.Element
FOLLOW server_components patterns if applicable
USE react_testing_library for tests

# Example: If implementing Node.js API
READ .claude/ai-docs/framework-patterns.yml → nodejs20 section
APPLY domain_driven_design architecture
USE structured_with_pino for logging
VALIDATE with ajv_schemas

# Example: Learning from existing PRPs
READ PRPs/user-auth.md → learn authentication patterns
READ PRPs/dashboard.md → learn component patterns
APPLY similar validation strategies
FOLLOW established error handling approaches
```

## Critical Success Factors

1. **Context Loading is Non-Negotiable** - Must read ALL files before implementation
2. **Pattern Consistency** - Follow patterns established in existing PRPs
3. **Framework Adherence** - Use framework-specific intelligence from YAML configs
4. **Quality Assurance** - All validation levels must pass
5. **Comprehensive Coverage** - Address all PRP requirements, not just subset

## Error Recovery

If validation fails:

1. **Re-read relevant context** (rules, standards, framework patterns)
2. **Check existing PRP implementations** for similar error handling
3. **Apply framework-specific debugging** from validation-commands.yml
4. **Iterate until all quality gates pass**

---

**Remember**: The success of this command depends on comprehensive context loading and pattern following from existing PRPs.
