---
name: debug-cicd
description: Debug GitHub Actions CI/CD failures by fetching logs, analyzing errors, and suggesting or applying fixes
disable-model-invocation: false
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
---

# Debug GitHub Actions CI/CD Errors

Diagnose and fix GitHub Actions workflow failures with comprehensive error analysis and automated fixes.

## Usage

```bash
/debug-cicd                           # Check most recent workflow run
/debug-cicd <run-id>                  # Debug specific run by ID
/debug-cicd <github-actions-url>      # Debug from GitHub Actions URL
```

## Workflow

### 1. Identify the Failed Workflow Run

If `$ARGUMENTS` is provided:
- If it's a URL (contains `github.com`), extract the run ID from it
- If it's a number, use it directly as the run ID
- Validate the run exists and has failed

If no arguments provided:
- Use `gh run list --limit 5 --json conclusion,databaseId,displayTitle,workflowName,createdAt` to show recent runs
- Automatically select the most recent failed run
- Show the user which run you're debugging

### 2. Fetch Failure Logs

Execute: `gh run view <run-id> --log-failed`

This returns logs for only the failed jobs/steps, which is more focused than `--log`.

**Important**: The output may be large (>30KB). If truncated, read from the saved file path provided in the output.

### 3. Analyze the Error

Systematically identify:

**a) Error Type Classification**
- Build errors (compilation, syntax, dependency resolution)
- Test failures (unit tests, integration tests, E2E tests)
- Deployment errors (permissions, credentials, network)
- Docker/container issues (image build, registry push)
- Environment/dependency issues (Node version, Python version, missing tools)
- Timeout or resource exhaustion
- Configuration errors (YAML syntax, secrets, environment variables)
- Linting or code quality checks

**b) Root Cause Analysis**
- Identify the exact command or step that failed
- Find the error message (look for keywords: ERROR, FATAL, failed, exit code, exception)
- Determine the file/line causing the issue if applicable
- Check for dependency version mismatches
- Look for environment-specific issues (OS, architecture, runtime versions)

**c) Context Gathering**
- Note which workflow file is involved (`.github/workflows/*.yml`)
- Identify the job and step names
- Check build arguments and environment variables
- Review recent commits that might have introduced the issue

### 4. Locate Relevant Files

Based on the error type, read the relevant files:

**For build errors:**
- Dockerfile (if Docker build failed)
- package.json, package-lock.json, or other dependency files
- Source code files mentioned in error stack traces
- Configuration files (tsconfig.json, next.config.ts, etc.)

**For workflow errors:**
- `.github/workflows/<workflow-name>.yml`
- Workflow configuration and job definitions

**For deployment errors:**
- Deployment configuration files
- Environment variable files (.env templates)

Use these tools efficiently:
- `Read` to examine specific files
- `Grep` to search for patterns across files
- `Glob` to find relevant configuration files

### 5. Propose Solution

Present your findings in this format:

```markdown
## CI/CD Failure Analysis

**Workflow**: <workflow-name>
**Run ID**: <run-id>
**Failed Job**: <job-name>
**Failed Step**: <step-name>

### Error Summary
<Brief 1-2 sentence description>

### Root Cause
<Detailed explanation of what went wrong>

### Affected Files
- `path/to/file1:line` - <why it's relevant>
- `path/to/file2` - <why it's relevant>

### Recommended Fix
<Detailed explanation of the fix>

### Changes Required
- [ ] `path/to/file`: <specific change>
- [ ] `path/to/file`: <specific change>
```

### 6. Apply Fix (Interactive)

Ask the user if they want you to apply the fix:

"Would you like me to apply these changes?"

If yes:
- Use `Edit` to make the necessary changes
- Show a summary of all changes made
- Suggest next steps (commit, push, test locally)

If no:
- Provide the exact commands or code snippets they can apply manually

## Special Cases

### Docker Build Failures

Common issues:
- Base image version incompatibility (e.g., Node 18 vs Node 20)
- Missing dependencies in container
- File not found (check COPY commands and .dockerignore)
- Build argument not passed correctly
- Multi-architecture build issues

Check:
1. Dockerfile base image versions
2. Package manager versions (npm, yarn, pip)
3. System dependencies (RUN apt-get/apk add)
4. Build stage dependencies

### Dependency Issues

Common issues:
- Version mismatches between package.json and lock files
- Incompatible engine versions
- Missing peer dependencies
- Breaking changes in dependency updates

Check:
1. package.json "engines" field
2. Lock file integrity
3. Recent dependency updates in git history

### Test Failures

Common issues:
- Test environment differences (env vars, mocks)
- Race conditions in async tests
- Snapshot mismatches
- Database connection issues

Check:
1. Test configuration files
2. CI-specific test scripts
3. Environment variable setup in workflow

### Authentication/Permission Errors

Common issues:
- Missing GitHub secrets
- Expired credentials
- Insufficient permissions for registry push
- Token scopes

Check:
1. Workflow YAML for secret references
2. Registry authentication steps
3. Permission declarations in workflow

## Output Guidelines

- Be concise but thorough
- Always reference specific file paths with line numbers
- Provide actionable fixes, not just observations
- If multiple potential causes exist, rank by likelihood
- Include links to relevant documentation when helpful
- Show the exact error message that you're addressing

## Best Practices

1. **Read logs carefully**: Don't just skim—the actual error is often several lines after a scary-looking warning
2. **Check recent changes**: Compare with the last successful run
3. **Verify locally**: If possible, suggest local reproduction steps
4. **Consider side effects**: Changes might affect other parts of the system
5. **Document assumptions**: If you're making assumptions about the fix, state them clearly

## Examples

### Example 1: Node Version Mismatch
```
User: /debug-cicd 22053156315
You: [Fetch logs, identify Node 18 vs Node 20 issue, propose Dockerfile changes, apply fix]
```

### Example 2: Recent Failure
```
User: /debug-cicd
You: [List recent runs, identify most recent failure, analyze and fix]
```

### Example 3: From URL
```
User: /debug-cicd https://github.com/org/repo/actions/runs/123456
You: [Extract run ID, analyze failure, propose solution]
```

## Error Recovery

If you encounter issues:
- If `gh` CLI is not installed, inform the user and provide installation instructions
- If run ID doesn't exist, list recent runs and ask user to clarify
- If logs are too large, focus on the last 200 lines where the actual error usually appears
- If multiple jobs failed, prioritize the first failure (others might be cascading failures)

## Success Criteria

A successful debug session should:
1. ✅ Identify the exact error and root cause
2. ✅ Locate all affected files
3. ✅ Provide a clear, actionable fix
4. ✅ Apply changes (if user approves)
5. ✅ Suggest verification steps

Start debugging now with the provided arguments: `$ARGUMENTS`
