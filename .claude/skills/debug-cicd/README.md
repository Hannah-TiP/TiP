# Debug CI/CD Skill

A Claude Code skill for debugging GitHub Actions workflow failures.

## Quick Start

```bash
# Debug the most recent workflow run
/debug-cicd

# Debug a specific run by ID
/debug-cicd 22053156315

# Debug from GitHub Actions URL
/debug-cicd https://github.com/Hannah-TiP/TiP/actions/runs/22053156315
```

## Features

- 🔍 **Automatic log fetching** - Retrieves failed job logs using GitHub CLI
- 🎯 **Root cause analysis** - Identifies the exact error and its cause
- 📝 **File location** - Shows which files need to be changed
- 🔧 **Automated fixes** - Can apply fixes with your approval
- 📊 **Comprehensive reporting** - Clear breakdown of the issue and solution

## Common Issues Detected

| Issue Type | Examples |
|------------|----------|
| **Docker Build** | Base image version, missing dependencies, COPY errors |
| **Dependencies** | Version mismatches, engine requirements, peer deps |
| **Tests** | Environment differences, race conditions, snapshots |
| **Deployment** | Credentials, permissions, network issues |
| **Configuration** | YAML syntax, secrets, environment variables |
| **Linting** | Code quality, formatting, type errors |

## Workflow

1. **Fetch** - Downloads logs from failed GitHub Actions run
2. **Analyze** - Identifies error type and root cause
3. **Locate** - Finds affected files in your codebase
4. **Propose** - Suggests specific fixes with file/line references
5. **Apply** - Makes changes (with your confirmation)

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Repository must be a git repository with GitHub remote
- You must have access to view the repository's Actions

## Tips

- The skill automatically handles large log outputs
- It prioritizes the first failure (others may be cascading)
- It can handle URLs, run IDs, or auto-detect recent failures
- It checks recent commits to identify breaking changes

## Example Output

```markdown
## CI/CD Failure Analysis

**Workflow**: Build and Push Docker Image
**Run ID**: 22053156315
**Failed Job**: build-and-push-docker
**Failed Step**: Build and Push Docker Image

### Error Summary
Docker build failed because Node.js 18 is being used, but Next.js 16 requires Node.js >= 20.9.0

### Root Cause
The Dockerfile specifies `node:18-alpine` as the base image across all build stages,
but the project's Next.js 16 dependency requires Node.js version 20 or higher.

### Affected Files
- `Dockerfile:5` - deps stage using node:18-alpine
- `Dockerfile:14` - builder stage using node:18-alpine
- `Dockerfile:34` - runner stage using node:18-alpine

### Recommended Fix
Update all three Dockerfile stages to use `node:20-alpine` instead of `node:18-alpine`

### Changes Required
- [x] `Dockerfile:5`: Change FROM node:18-alpine to FROM node:20-alpine
- [x] `Dockerfile:14`: Change FROM node:18-alpine to FROM node:20-alpine
- [x] `Dockerfile:34`: Change FROM node:18-alpine to FROM node:20-alpine
```

## Troubleshooting

**"gh: command not found"**
- Install GitHub CLI: https://cli.github.com/

**"Run not found"**
- Verify the run ID or URL
- Check you have access to the repository

**"Logs too large to display"**
- The skill automatically reads from saved files
- It focuses on the most relevant error sections

## Customization

Edit `SKILL.md` to:
- Add project-specific error patterns
- Customize allowed tools
- Change the output format
- Add additional analysis steps
