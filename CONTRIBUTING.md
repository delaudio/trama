# Contributing

## Scope

This repository should stay safe to share publicly.

When contributing, avoid committing machine-specific, user-specific, or organization-specific details unless they are strictly required and intentionally public.

## Privacy Rules

Do not commit:

- absolute filesystem paths such as `/Users/...`
- local usernames
- personal email addresses in repository docs or config files
- internal company registry URLs or private package sources
- local API keys, tokens, cookies, or auth headers
- screenshots or logs that expose private local paths or secrets

## Git Metadata

Before creating public commits, verify your local git identity if needed:

```bash
git config user.name
git config user.email
```

Use a project-safe identity when appropriate for public history.

## Repository Content

Prefer:

- relative paths in documentation
- generic examples in setup instructions
- neutral bundle identifiers and package authors
- repo-local config over machine-specific global assumptions

## Pre-Push Checklist

Before pushing:

1. scan changed files for absolute paths or private identifiers
2. confirm no secrets or local-only config were added
3. verify generated output folders are ignored when appropriate
4. review the staged diff, not only the working tree

Useful commands:

```bash
git diff --cached
rg -n "/Users/|/var/folders|localhost|127\\.0\\.0\\.1|token|secret|apikey|api_key"
```

## If Something Leaks

If private information is committed:

1. remove it from the working tree
2. amend or rewrite history as early as possible
3. force-push only when necessary and with care
4. rotate any exposed secret immediately
