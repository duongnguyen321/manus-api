# Generate PRP - Complete Q&A Upfront

Create comprehensive JavaScript/TypeScript PRP through structured single-pass questioning.

## Feature: $ARGUMENTS

## Process: Complete Question Set → Single Response → Generate PRP

### Step 1: Load All Context

```bash
# Read all AI context first
READ .claude/ai-docs/rules.md                    # AI reasoning patterns
READ .claude/ai-docs/js-ts-standards.yml        # Core standards
READ .claude/ai-docs/framework-patterns.yml     # Framework intelligence
READ .claude/ai-docs/validation-commands.yml    # Quality gates
READ .claude/templates/prp-template.yml # Question structure

# Analyze codebase for framework detection
rg --files -g "*.{js,ts,jsx,tsx,vue,astro}" | head -10
rg "package\.json" -A 20 | grep -E "(react|next|vue|astro|node)"
```

### Step 2: Present Complete Question Set

**Present ALL questions at once for user to answer:**

```markdown
I'll create a comprehensive PRP for: [FEATURE]

Please answer ALL the following questions in a single response:

## 📋 Feature Definition

1. **Goal**: What exactly needs to be built? What's the specific end state you want?

2. **Why**: What's the business value? Who benefits from this? How does it integrate with existing features?

3. **What**: What should users see and be able to do? What are the technical requirements?

4. **Success Criteria**: How will you know this feature is complete and working correctly? (List as checkboxes)

## 🧠 Context & Intelligence

5. **Framework**: Which framework/version are you using? (I detected: [AUTO_DETECTED])

6. **Similar Patterns**: Are there similar features in the codebase I should reference? (File paths/names)

7. **Documentation**: Any official docs, APIs, or external resources I should reference? (URLs)

8. **Gotchas**: Any specific patterns to follow? Library quirks? Constraints I should know about?

9. **Structure**: What new files will be created? Where should they be placed?

## 🏗️ Implementation

10. **Data Models**: What data structures are needed? APIs to call? State to manage?

11. **Task Breakdown**: How should this be broken into logical steps? Any dependencies?

12. **Complexity**: Any complex logic? API integrations? Error handling requirements?

13. **Integration**: Database changes needed? New API routes? Configuration updates?

## ✅ Testing & Validation

14. **Unit Testing**: What specific behaviors need testing? Edge cases? Error conditions?

15. **Integration Testing**: How should this be tested end-to-end? What user workflows?

16. **Additional Requirements**: Any special requirements? Documentation needs? Deployment considerations?

---

**Please provide answers to ALL questions above in your response.**
```

### Step 3: Process Single Response → Generate Complete PRP

Once user provides all answers:

1. **Parse responses** into structured data
2. **Research additional context** based on answers
3. **Generate complete PRP** using template structure
4. **Include framework-specific patterns** from YAML configs
5. **Add executable validation commands** based on detected framework
6. **Save as**: `PRPs/{feature-name}.md`

### Step 4: PRP Structure Generation

Generate complete PRP with these sections:

```yaml
# Generated PRP Structure
feature_definition:
  goal: [from answer 1]
  why: [from answer 2]
  what: [from answer 3]
  success_criteria: [from answer 4]

context_intelligence:
  framework: [from answer 5 + auto-detection]
  documentation: [from answer 7 + research]
  gotchas: [from answer 8 + framework patterns]
  structure: [from answer 9]

implementation_blueprint:
  data_models: [from answer 10]
  task_breakdown: [from answer 11]
  integration_points: [from answer 13]

validation_loop:
  syntax_style: [from validation-commands.yml based on framework]
  unit_tests: [from answer 14]
  integration_tests: [from answer 15]
  production_ready: [framework-specific checks]

final_checklist: [comprehensive quality gates]
anti_patterns: [framework-specific anti-patterns]
```

### Step 5: Quality Assurance

**Verify before saving:**

- [ ] All 16 questions answered and incorporated
- [ ] Framework-specific patterns included from YAML configs
- [ ] Executable validation commands for detected framework
- [ ] Task breakdown is logical and sequential
- [ ] Context sufficient for one-pass implementation

## Output Format

**File**: `PRPs/{feature-name}.md`
**Content**: Complete PRP ready for `/execute-prp` command

## Example Flow

```
User: "Build user authentication system"

AI: "I'll create a comprehensive PRP for: User Authentication System

Please answer ALL the following questions in a single response:

1. Goal: What exactly needs to be built?
2. Why: What's the business value?
[... all 16 questions ...]

Please provide answers to ALL questions above."

User: [Provides complete answers to all 16 questions]

AI: [Generates complete PRP and saves to PRPs/user-authentication.md]
"✅ PRP generated: PRPs/user-authentication.md
Ready for implementation with: /execute-prp user-authentication"
```
