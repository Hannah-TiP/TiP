# Example: Docker Node Version Mismatch

This example shows how the debug-cicd skill handles a Node.js version mismatch in a Docker build.

## Input

```bash
/debug-cicd 22053156315
```

## Detected Error

```
You are using Node.js 18.20.8. For Next.js, Node.js version ">=20.9.0" is required.
```

## Analysis

**Error Type**: Docker Build Error - Environment/Dependency Issue
**Root Cause**: Base image version incompatibility

## Files Examined

1. **Dockerfile** - Checked all `FROM` statements
2. **package.json** - Verified Next.js version (16.1.6)
3. **GitHub Actions logs** - Confirmed build stage failure

## Solution Applied

```diff
# Stage 1: Dependencies
-FROM node:18-alpine AS deps
+FROM node:20-alpine AS deps

# Stage 2: Builder
-FROM node:18-alpine AS builder
+FROM node:20-alpine AS builder

# Stage 3: Runner
-FROM node:18-alpine AS runner
+FROM node:20-alpine AS runner
```

## Verification Steps

1. Commit the Dockerfile changes
2. Push to trigger new CI/CD run
3. Verify build passes with Node 20

## Prevention

- Keep Dockerfile Node version in sync with package.json engines field
- Consider adding engines field to package.json:
  ```json
  "engines": {
    "node": ">=20.9.0",
    "npm": ">=10.0.0"
  }
  ```
- Use dependabot or renovate to track Node.js LTS updates
