# AGENTS.md

## Purpose

This repository is intended to be maintained with the help of AI coding agents such as GitHub Copilot.

Agents must prioritize correctness, security, simplicity, readability, maintainability, and testability. The codebase should remain easy to understand for a human maintainer.

Assume this is a small to medium-sized private project unless project-specific documentation says otherwise. Prefer pragmatic solutions over unnecessary abstraction.

## General Principles

Follow these priorities:

1. Correctness
2. Security
3. Simplicity
4. Readability
5. Maintainability
6. Testability
7. Performance where relevant

Guidelines:

* Prefer KISS over cleverness.
* Apply DRY with judgment.
* Follow SOLID where it improves clarity.
* Prefer explicit code over implicit magic.
* Prefer composition over inheritance.
* Prefer standard library features over new dependencies when practical.
* Avoid premature optimization.
* Avoid speculative architecture.
* Avoid large rewrites unless explicitly requested.

## Project Context

Before making recommendations or changes, inspect:

* `README.md`
* build/package configuration
* CI configuration
* tests
* relevant source files
* `docs/architecture.md`, if present
* `docs/conventions.md`, if present

Do not infer architecture from a single file. Understand the surrounding context first.

## Review Rules

When asked to review code or the entire project:

* Do not modify files unless explicitly asked.
* Provide a structured review report.
* Highlight strengths as well as weaknesses.
* Prioritize findings by impact.
* Distinguish facts from assumptions.
* Support recommendations with concrete observations from the codebase.
* Avoid dogmatic advice.
* Do not recommend enterprise patterns for small projects unless clearly justified.

Priority scale:

* P0: Critical correctness, security, or data-loss issue
* P1: Important maintainability, architecture, or reliability issue
* P2: Useful improvement with clear benefit
* P3: Optional or cosmetic improvement

For each relevant finding, include:

* Problem
* Evidence
* Impact
* Recommendation
* Estimated effort: S / M / L

## Code Change Rules

When asked to modify code:

* Keep changes small and reviewable.
* Preserve existing behavior unless explicitly asked to change it.
* Avoid unrelated cleanup.
* Avoid broad formatting-only changes.
* Do not introduce new dependencies without a clear reason.
* Update or add tests when behavior changes.
* Keep public APIs stable unless a breaking change is explicitly requested.
* Explain important trade-offs.

Before large changes, propose a short implementation plan.

## Architecture Guidelines

Prefer simple, understandable architecture.

Good architecture means:

* clear responsibilities
* low coupling
* high cohesion
* understandable module boundaries
* minimal global state
* predictable data flow
* testable components
* no unnecessary layers

Avoid:

* god classes
* circular dependencies
* over-engineered abstractions
* premature plugin systems
* unnecessary inheritance hierarchies
* hidden side effects
* framework lock-in where avoidable

## Testing Guidelines

Tests should focus on behavior and important edge cases.

Prefer:

* fast automated tests
* clear test names
* deterministic tests
* meaningful assertions
* tests close to the behavior being verified

Avoid:

* brittle tests
* excessive mocking
* testing implementation details without benefit
* slow tests in the default CI path unless necessary

If test coverage is weak, recommend high-value tests first.

## Security Guidelines

Check for:

* unsafe input handling
* insecure defaults
* secrets in source code
* weak authentication or authorization patterns
* unsafe deserialization
* command injection risks
* path traversal risks
* dependency risks
* insufficient error handling around external systems

Never print, generate, or expose secrets.

Do not weaken security controls for convenience.

## Dependency Guidelines

Keep dependencies intentional.

Before suggesting a new dependency, consider:

* Is the standard library sufficient?
* Is the dependency actively maintained?
* Is it necessary for the project size?
* Does it increase security or supply-chain risk?
* Is the benefit worth the added complexity?

Prefer small, well-maintained, widely used dependencies.

## Documentation Guidelines

Documentation should explain intent, constraints, and non-obvious decisions.

Prefer:

* concise README updates
* architecture notes for important decisions
* comments for non-obvious code
* examples for public APIs or CLIs

Avoid comments that merely repeat the code.

## Language-Specific Guidance

Follow established best practices for the language and framework used in the project.

Consider language-specific conventions for:

* project layout
* naming
* error handling
* dependency management
* formatting
* typing
* testing
* packaging
* logging

Do not force patterns from one language ecosystem into another.

## Output Style

When reporting findings:

* Be concise but specific.
* Use clear headings.
* Prefer actionable recommendations.
* Separate critical issues from nice-to-have improvements.
* Mention uncertainty explicitly.
* Do not exaggerate minor issues.

For project reviews, use this structure:

1. Executive Summary
2. Strengths
3. Main Risks
4. Architecture Review
5. Code Quality Review
6. Testability Review
7. Security and Dependency Review
8. Prioritized Findings
9. Recommended Next Steps
10. Things Not Worth Changing

## Non-Goals

Do not optimize for:

* academic purity
* unnecessary abstraction
* framework maximalism
* premature scalability
* style-only debates
* large rewrites without strong justification

The best solution is usually the simplest solution that is correct, secure, readable, and easy to maintain.
