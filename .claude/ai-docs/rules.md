# AI Rules - JavaScript/TypeScript Development

## `Ω*` | Core Reasoning Engine

```
Ω* = max(∇ΣΩ) → js_ts_aligned_reasoning
Ω.modes = {deductive | analogical | exploratory | procedural | contrastive | skeptical}
Ω.hierarchy = break→subproblems ⨁ organize→units ⨁ link→appropriate_mode
Ω.guards = challenge_overengineering ⨁ delay_premature_abstraction ⨁ detect_repetition
```

## `P*` | Planning System

```
P* = always_plan_first → maximize(clarity, efficiency)
P.workflow = reflect → analyze_codebase → clarify_questions → draft_plan → execute → report
P.materialize = sync_to_claude_todos
```

## `M*` | Memory System

```
M* = persistent_memory ⇌ context_loading
M.ai_docs = "@include .claude/ai-docs/"
M.standards = "@include .claude/ai-docs/js-ts-standards.yml"
M.frameworks = "@include .claude/ai-docs/framework-patterns.yml"
M.validation = "@include .claude/ai-docs/validation-commands.yml"
M.workflow = read_all → verify_completeness → contextualize → execute
```

## `Θ*` | JavaScript/TypeScript Intelligence

```
Θ* = framework_adaptive_reasoning
Θ.ecosystem = React19+ | NextJS15+ | NodeJS20+ | Astro5+ | Vue3+ | Nuxt3+
Θ.package_manager = Bun > pnpm > yarn > npm
Θ.typescript = strict_mode_required ⨁ no_any_type ⨁ explicit_return_types
Θ.patterns = KISS ⨁ YAGNI ⨁ DRY ⨁ component_composition
```

## `C*` | Code Quality System

```
C* = enforce_quality_standards
C.typescript = {strict: true, noImplicitAny: true, noUncheckedIndexedAccess: true}
C.testing = {coverage_minimum: 80, frameworks: Vitest|Jest|Node_Test_Runner}
C.validation = MUST_validate_external_data_with_Zod_or_AJV
C.file_limits = {component: 200_lines, general: 500_lines, function: 50_lines}
```

## `S*` | Security Framework

```
S* = security_first_development
S.input_validation = validate_ALL_external_data
S.environment = NEVER_secrets_in_code ⨁ use_env_vars
S.headers = csp_required ⨁ hsts_enforce ⨁ cors_explicit
```

## `Perf*` | Performance Standards

```
Perf* = optimize_for_real_world_usage
Perf.frontend = bundle_size_monitoring ⨁ code_splitting ⨁ image_optimization
Perf.backend = NEVER_block_event_loop ⨁ connection_pooling ⨁ caching
Perf.universal = async_await_preferred ⨁ streaming_for_large_responses
```

## `Search*` | Search System

```
Search* = ripgrep_enforcement
Search.FORBIDDEN = {grep | find_with_name}
Search.REQUIRED = {rg | "rg --files -g '*.{js,ts,jsx,tsx,vue,astro}'"}
```

## `T*` | Testing Strategy

```
T* = comprehensive_testing_approach
T.hierarchy = {unit: component_level, integration: api_level, e2e: workflow_level}
T.requirements = {coverage: 80_percent, co_location: tests_near_source, isolation: no_interdependencies}
```

## `¬*` | Anti-Patterns

```
¬* = prevent_violations → enforce_quality
¬.prohibited = {
  any_type: NEVER_use_any,
  skip_validation: NEVER_trust_external_data,
  sync_in_async: NEVER_block_event_loop,
  jsx_element: NEVER_use_JSX_Element_use_ReactElement,
  prop_drilling: NEVER_beyond_2_levels,
  console_log: NEVER_commit_debug_statements,
  ts_ignore: NEVER_ignore_typescript_errors
}
```

## `Auto*` | Framework Auto-Detection

```
Auto* = intelligent_framework_activation
Auto.React19 = triggers{package_json_react|jsx_files} → activate{ReactElement_types|Actions_API}
Auto.NextJS15 = triggers{next_config|app_directory} → activate{App_Router|Server_Actions}
Auto.NodeJS20 = triggers{server_files|api_routes} → activate{Domain_Design|Pino_logging}
Auto.Astro5 = triggers{astro_config|astro_files} → activate{Islands_Architecture|pnpm_required}
Auto.Vue3 = triggers{vue_files|composition_api} → activate{Composition_API|Auto_imports}
```

## `V*` | Validation System

```
V* = executable_quality_gates
V.basic = "npm run lint && npm run test && npm run build"
V.comprehensive = load_framework_specific_validation_from_shared_config
V.enforcement = ALL_gates_must_pass_before_completion
```

## `PRP*` | Product Requirement Prompts

```
PRP* = Product_Requirement_Prompts_system
PRP.concept = "PRP = PRD + curated_intelligence + agent_runbook"
PRP.methodology = {context_is_king, validation_loops, information_dense, progressive_success}
PRP.commands = {execute: "/execute-prp [name]", generate: "/generate-prp [description]"}
```

## `CRITICAL*` | Non-negotiable Rules

```
CRITICAL = {
  M.read_all_configs @ session_start,
  Θ.typescript_strict @ all_projects,
  C.validate_external_data @ all_boundaries,
  Search.use_ripgrep @ all_searches,
  T.80_percent_coverage @ all_features,
  ¬.enforce_all @ code_submission,
  V.all_gates_pass @ completion
}
```

---

## Project Context

**Nature**: PRP Framework for JavaScript/TypeScript development  
**Concept**: "PRP = PRD + curated codebase intelligence + agent/runbook"  
**Goal**: Enable AI agents to ship production-ready code on first pass

## Commands Available

- `/execute-prp [prp-name]` - Execute a PRP implementation
- `/generate-prp [description]` - Create comprehensive PRP via structured Q&A

## Validation Pattern

```bash
npm run lint && npm run test && npm run build
# Framework-specific validation loaded from validation-commands.yml
```

## Success Methodology

1. **Context is King** - Comprehensive documentation and examples
2. **Validation Loops** - Executable tests and quality gates
3. **Information Dense** - JavaScript/TypeScript ecosystem patterns
4. **Progressive Success** - Start simple, validate, enhance
