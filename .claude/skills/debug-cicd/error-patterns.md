# Common CI/CD Error Patterns

Quick reference guide for identifying and fixing common GitHub Actions errors.

## Docker Build Errors

### Pattern: "EBADENGINE Unsupported engine"
```
npm warn EBADENGINE Unsupported engine {
  package: 'next@16.1.6',
  required: { node: '>=20.9.0' },
  current: { node: 'v18.20.8', npm: '10.8.2' }
}
```
**Fix**: Update Dockerfile base image to match required Node version
```dockerfile
FROM node:20-alpine
```

### Pattern: "COPY failed: file not found"
```
COPY failed: file not found in build context or excluded by .dockerignore
```
**Fix**: Check .dockerignore and ensure files exist before COPY
- Verify file paths are relative to build context
- Check if .dockerignore excludes the file
- Ensure files exist in the repository

### Pattern: "failed to solve with frontend dockerfile.v0"
```
failed to solve with frontend dockerfile.v0: failed to create LLB definition
```
**Fix**: Dockerfile syntax error
- Check for typos in Dockerfile commands
- Verify multi-stage build references are correct
- Ensure all ARG/ENV variables are defined before use

## Dependency Errors

### Pattern: "Cannot find module"
```
Error: Cannot find module 'next/server'
```
**Fix**: Dependencies not installed or lock file out of sync
```bash
npm ci  # Use ci instead of install in CI/CD
```

### Pattern: "peer dependency not satisfied"
```
npm ERR! peer dep missing: react@^18.0.0, required by next@16.1.6
```
**Fix**: Install missing peer dependencies in package.json

### Pattern: "lock file out of date"
```
npm ERR! `npm ci` can only install packages when your package.json and package-lock.json are in sync
```
**Fix**: Regenerate lock file locally and commit
```bash
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
```

## Build Errors

### Pattern: "TypeScript compilation failed"
```
error TS2307: Cannot find module '@/components/Header' or its corresponding type declarations
```
**Fix**: Check tsconfig.json paths and file locations
- Verify path alias configuration
- Ensure file exists at the import path
- Check for case sensitivity issues

### Pattern: "Module not found: Can't resolve"
```
Module not found: Can't resolve '@/lib/utils'
```
**Fix**: Webpack/Next.js module resolution issue
- Check next.config.ts/js for path configuration
- Verify import paths match actual file structure
- Clear .next cache in CI by not caching it

### Pattern: "Build failed: Out of memory"
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```
**Fix**: Increase Node memory or optimize build
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

## Test Errors

### Pattern: "Test suite failed to run"
```
ECONNREFUSED: Connection refused (database)
```
**Fix**: Test environment not configured
- Add test database service in workflow
- Set environment variables for tests
- Use test containers or mock database

### Pattern: "Snapshot mismatch"
```
Received value does not match stored snapshot
```
**Fix**: Update snapshots or fix component
```bash
npm test -- -u  # Update snapshots
```

## Authentication/Permissions

### Pattern: "denied: permission_denied"
```
ERROR: denied: permission_denied: write_package
```
**Fix**: Insufficient token permissions
```yaml
permissions:
  contents: read
  packages: write
```

### Pattern: "Error: The process '/usr/bin/git' failed with exit code 128"
```
remote: Permission to repo.git denied to github-actions[bot]
```
**Fix**: Grant write permissions or use PAT
```yaml
permissions:
  contents: write
```

### Pattern: "Failed to push to registry"
```
error: failed to push: denied: unauthorized
```
**Fix**: Registry authentication not configured
```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v2
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

## Environment/Configuration

### Pattern: "Environment variable not defined"
```
Error: API_BASE_URL is not defined
```
**Fix**: Add environment variables to workflow
```yaml
env:
  API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

### Pattern: "Secret not found"
```
Error: Secret 'AWS_ACCESS_KEY_ID' not found
```
**Fix**: Add secret in GitHub repository settings
- Settings → Secrets and variables → Actions → New repository secret

### Pattern: "Invalid workflow file"
```
yaml: line 42: mapping values are not allowed in this context
```
**Fix**: YAML syntax error
- Check indentation (use spaces, not tabs)
- Validate YAML with online validator
- Check for special characters in strings (use quotes)

## Cache Issues

### Pattern: "Cache restore failed"
```
Warning: Cache entry deserialization failed, entry ignored
```
**Fix**: Cache corruption or version mismatch
- Clear cache by changing cache key
- Remove cache action temporarily
- Rebuild cache from scratch

### Pattern: "No cache available"
```
Cache not found for input keys: node-modules-...
```
**Fix**: Expected behavior on first run or cache expiry
- Cache will be created after successful run
- Cache expires after 7 days of no access

## Timeout Errors

### Pattern: "The job running on runner has exceeded the maximum execution time"
```
Error: The job running on runner GitHub Actions 1 has exceeded the maximum execution time of 360 minutes
```
**Fix**: Optimize build or increase timeout
```yaml
jobs:
  build:
    timeout-minutes: 60
```

## Detection Keywords

When scanning logs, look for these indicators:

**Critical Errors:**
- `ERROR:`
- `FATAL:`
- `failed with exit code`
- `Build failed`
- `Error:`
- `Exception:`

**Warnings (may indicate root cause):**
- `WARN:`
- `deprecated:`
- `EBADENGINE`
- `peer dep missing`

**Context Clues:**
- Line numbers: `file.ts:42:15`
- File paths in error messages
- Stack traces
- Command that failed: usually prefixed with `RUN` in Docker or step name in Actions

## Debugging Strategy

1. **Find the actual error** - scroll past warnings to the first ERROR
2. **Identify the command** - what was running when it failed?
3. **Check recent changes** - compare with last successful run
4. **Read the full message** - don't just pattern match, understand context
5. **Verify locally** - can you reproduce the error on your machine?
6. **Check dependencies** - are versions compatible?
7. **Review configuration** - are all settings correct?
8. **Test the fix** - apply fix and verify it resolves the issue
