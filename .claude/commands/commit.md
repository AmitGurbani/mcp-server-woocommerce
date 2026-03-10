---
description: Create a conventional commit with emoji prefix
---

Create a git commit following the project's conventional commit format with emoji prefixes.

## Commit Message Format

```
<type>(<scope>): <emoji> <subject>

[optional body]

[optional footer]
```

## Types and Emojis

- `feat`: ✨ New feature
- `fix`: 🐛 Bug fix
- `docs`: 📝 Documentation changes
- `style`: 💄 Code style/formatting (no logic changes)
- `refactor`: ♻️ Code refactoring
- `perf`: ⚡ Performance improvements
- `test`: ✅ Adding or updating tests
- `chore`: 🔧 Maintenance tasks, dependencies
- `ci`: 👷 CI/CD changes
- `build`: 📦 Build system changes
- `revert`: ⏪ Revert previous commit

## Scopes

Common scopes in this project:
- `tools` - MCP tool files (products, orders, categories, etc.)
- `services` - Base service layer, WooCommerce client
- `server` - Server setup, entry point
- `config` - tsconfig, package.json, .mcp.json
- `deps` - Dependency updates

## CRITICAL: No Attribution in Commits

**DO NOT add any Claude Code attribution to commit messages.**

Commit messages must be clean and end after the optional body/footer. Never include:
- ❌ "Generated with Claude Code"
- ❌ "Co-Authored-By: Claude"
- ❌ Links to claude.com
- ❌ Any other attribution lines

The commit message should contain ONLY:
- ✅ Type, scope, emoji, and subject line
- ✅ Optional body explaining "why"
- ✅ Optional footer (issue references, breaking changes)

## Instructions

1. Run `git status` to see what files are staged/modified
2. Run `git diff --staged` to review staged changes
3. Run `git log --oneline -10` to see recent commit style
4. Analyze the changes and determine:
   - Type (feat, fix, docs, etc.)
   - Scope (which area affected)
   - Clear, concise subject line (50 chars max)
   - Body if needed to explain "why" not "what"
5. Stage any unstaged files that should be included: `git add <files>`
6. Create the commit with proper format (NO ATTRIBUTION!)
7. Run `git status` after committing to confirm

## Examples

```bash
# New MCP tool
git commit -m "feat(tools): ✨ add product variation tools"

# Bug fix in service layer
git commit -m "fix(services): 🐛 handle WooCommerce API timeout errors"

# Documentation update
git commit -m "docs(config): 📝 update CLAUDE.md with new tools"

# Dependency upgrade
git commit -m "chore(deps): ⬆️ upgrade zod to v4"

# Refactoring
git commit -m "refactor(services): ♻️ extract pagination logic to helper"
```

## Important Notes

- Keep subject line under 50 characters
- Use imperative mood ("add" not "added" or "adds")
- Don't end subject line with period
- Reference issue numbers in body/footer: "Fixes #123"
- Use body to explain "why" the change was needed

## What Not to Commit

- Files with secrets (`.env`, `credentials.json`)
- Large binary files
- Generated files (`build/` directory)
- `node_modules/` directory
