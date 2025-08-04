# Rule important

## Rule tools

1. Use Serena MCP to research, search, edit, replace in project
2. Use Context7 MCP to research about library, tool, framework
3. Do not mock any data.

## Rule code reasoning

```rule
## Core Reasoning Engine (Ω*)
Ω* = max(∇ΣΩ) → (β∂Ω/∂Στ ⨁ γ𝝖(Ω|τ,λ)→θ ⨁ δΣΩ(ζ,χ,dyn,meta,hyp,unknown)) ⇌ intent_aligned_reasoning
Ω.modes = {deductive | analogical | exploratory | procedural | contrastive | skeptical}
Ω.hierarchy = break→subproblems ⨁ organize→units ⨁ link→appropriate_mode
Ω.hypothesis = evaluate ⨁ score=f(confidence, evidence, Λ_consistency) ⨁ propagate→{Ψ, Ξ}
Ω.scope = infer_structure ⨁ detect_dependencies ⨁ observe_ripple_effects ⨁ activate_rules ⨁ silent_observe
Ω.guards = challenge_overengineering ⨁ delay_premature_abstraction ⨁ detect_repetition ⨁ propose_reusable_components

## Contradiction Resolution (D*)
D* = identify_contradiction ⨁ resolve_by{rank | scope | abstraction_level} ⨁ log→Ψ
D.priority = user_intent > consistency > optimization

## Planning System (P*)
P* = always_plan_first → maximize(clarity, efficiency)
P.workflow = reflect → analyze_codebase → clarify_questions(4-6) → draft_plan → execute_via_claude_todos → report{done, next, remaining}
P.materialize = if(granularity == execution) → sync_to_claude_todos
P.commit_changes = if(granularity == execution) → commit_changes_to_claude_todos → commit_changes_to_memories → sync_commit_changes_to_git

## Memory Bank (M*) [CRITICAL: Must read all when start]
M* = Στ(λ) ⇌ persistent_memory
M.path = ".serena/memories/"
M.core = {
  projectBrief.md      # Project vision and constraints
  productContext.md    # Business logic and user stories
  activeContext.md     # Current sprint focus
  systemPatterns.md    # Architectural decisions
  techContext.md       # Stack-specific patterns
  progress.md          # Completed work log
}
M.optional = {features/, integrations/, api/, tests/, deployment/}
M.workflow = read_all → verify_completeness → contextualize → strategize → execute → update_docs
M.sync_triggers = new_pattern | major_change | user_command("update memory") | context_shift | claude_todo_completion
M.dependency_reset = on_file_change → reset_dependent_contexts

## Coding Standards (C*)
C.principles = minimize_changes ⨁ test_critical_paths ⨁ respect_architecture ⨁ assess_ripple_effects
C.patterns = KISS ⨁ YAGNI ⨁ DRY ⨁ modular(<300_lines) ⨁ no_mocks_in_production ⨁ reuse_existing_patterns
C.environment = handle_seamlessly ⨁ separate_databases(dev, test, prod) ⨁ protect_env_files
C.confidence = change_only_when{certain | explicitly_requested}

## Technology Stack (Θ*)
Θ.backend = Node.js with {NestJS | Express}
Θ.frontend = {Next.js | React}
Θ.database = {SQL | MongoDB} // Note: Avoid JSON for persistence
Θ.testing = Node.js frameworks
Θ.package_manager = Bun (preferred over npm)

## Rule Learning System (Λ*)
Λ.system_path = ".claude/rules/"
Λ.naming = {
  "0##": core_rules,
  "1##": tool_patterns,
  "3##": testing_rules,
  "###": language_framework_specific,
  "8##": workflow_patterns,
  "9##": templates,
  "_*.mdc": private_rules
}
Λ.intelligence_file = ".clauderules"  # Project-specific patterns and preferences
Λ.capture = implementation_paths | user_preferences | recurring_patterns | challenges | decisions
Λ.autonomy = if(pattern_frequency > threshold) → generate_DRAFT_rule.mdc
Λ.enforcement = align_best_practices ⨁ suggest_when_justified ⨁ enforce_single_responsibility

## Task Management (T*)
T* = Σ(complex_tasks) ⇌ claude_todo_system
T.interface = claude_native_todos  # Use claude's built-in todo list feature
T.structure = {
  task_decomposition: atomic_subtasks,
  priority_levels: {critical, high, medium, low},
  status_tracking: {pending, in_progress, completed, blocked},
  metadata: {estimated_time, dependencies, notes}
}
T.workflow = create_in_claude_todos → track_progress → update_status → sync_with_memory
T.automation = {
  auto_generate: on_plan_approval → populate_claude_todos,
  auto_update: on_task_completion → mark_done_in_claude,
  auto_sync: claude_todo_changes → update_memory_progress
}
T.review = validate_completeness ⨁ check_dependencies ⨁ trigger(M.sync, Λ.extract)

## Test-Driven Development (TDD*)
TDD.specification = infer_tests(task) ⨁ include{edge_cases, validation, regression} ⨁ cross_reference(Λ, known_issues)
TDD.cycle = spec → run → fail → implement → rerun ⨁ if(pass): {Ψ.capture, M.sync, Λ.extract}
TDD.auto_trigger = if(complexity > medium) | explicit_request → generate_test_spec → add_to_claude_todos

## Pattern Abstraction (Φ*)
Φ* = hypothesis_driven_abstraction
Φ.mode = exploratory ⨁ capture_emergent_patterns ⨁ differentiate(rules, templates)
Φ.snapshot = {design_motifs, architectural_structures, naming_conventions}

## Diagnostics & Refinement (Ξ*)
Ξ.error_log = ".serena/memories/errors.md"
Ξ.tracking = log_recurring_issues ⨁ propose_fixes ⨁ if(recurrence > 2) → Λ.generate_draft_rule
Ξ.cleanup = detect_drift{dead_code, broken_imports} ⨁ suggest_refactoring ⨁ archive→Ψ

## Cognitive Trace (Ψ*)
Ψ.enabled = true
Ψ.capture = {
  Ω*: reasoning_chain,
  Φ*: abstractions_found,
  Ξ*: errors_encountered,
  Λ: rules_applied,
  Δ: confidence_weights,
  T: claude_todo_actions,
  output: validation_results
}
Ψ.path = ".serena/memories/trace_{task_id}.md"
Ψ.dialogue = detect_patterns ⨁ suggest_improvements ⨁ flag_weak_assumptions

## Anti-Patterns (¬*)
¬* = prevent_violations → enforce_quality
¬.prohibitions = {
  create_new_patterns_when_existing_work,
  skip_validation_assuming_correctness,
  ignore_failing_tests,
  use_sync_in_async_context,
  hardcode_config_values,
  catch_all_exceptions
}
¬.detection = analyze_code → identify_violations → classify_severity
¬.enforcement = detect_violation → flag_immediately → suggest_correction → block_if{severity > threshold}
¬.priority = prevent > fix > refactor
¬.integration = {
  pattern_reuse → Λ.enforcement,
  validation_requirement → C.confidence ⨁ TDD.cycle,
  test_discipline → TDD.specification,
  async_sync_separation → C.patterns,
  config_externalization → C.environment,
  exception_specificity → Ξ.error_log
}
¬.triggers = code_submission | pull_request | pre_commit_hook
¬.severity_levels = {blocking, critical, warning, suggestion}
¬.resolution = provide_alternative → reference_existing_pattern → update_Λ

## Event Hooks (Σ_hooks)
Σ_hooks = {
  on_session_start:    [M.read_all, M.verify_completeness, T.sync_claude_todos],
  on_task_created:     [M.recall_context, Φ.match_patterns, T.add_to_claude_todos],
  on_plan_created:    [T.populate_claude_todos, TDD.auto_trigger, Ψ.materialize, M.sync],
  on_todo_completed:   [T.mark_done_in_claude, M.update_progress, Ψ.log_completion],
  on_sprint_review:    [M.full_sync, Λ.extract_patterns, Ψ.summarize, T.archive_completed_todos],
  on_error_detected:   [Ξ.track, Λ.capture_for_learning, T.create_fix_todo],
  on_file_modified:    [Λ.check_compliance, Φ.capture_patterns, ¬.detect_violation],
  on_user_feedback:    [Ψ.process_dialogue, M.update_if_needed],
  on_memory_update:    [M.review_all, M.focus(activeContext, progress)],
  on_claude_todo_change: [T.sync_with_memory, Ψ.track_todo_action],
  on_code_submission:  [¬.enforcement, TDD.validate, C.confidence_check]
  on_todo_completed: [P.commit_changes]
}

## CRITICAL RULES (Non-negotiable)
CRITICAL = {
  M.read_all_memory @ session_start,       # Context is everything
  M.reset_dependencies @ file_change,      # Maintain consistency
  C.high_confidence @ production_changes,   # No guessing in production
  P.always_plan_first @ complex_tasks,      # Think before acting
  T.populate_claude_todos @ plan_created,  # Use claude's todo list for task tracking
  TDD.spec_first @ new_features,           # Test-driven by default
  ¬.enforce_all @ code_submission          # Anti-patterns are blocking
}
```
