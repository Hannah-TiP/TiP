# Example: Missing Environment Variable

This example shows how the skill handles missing environment variables in CI/CD.

## Input

```bash
/debug-cicd
```

## Detected Error

```
Error: API_BASE_URL is not defined
    at buildConfig (/app/src/config/api.ts:12:9)
    at Module.<anonymous> (/app/src/app/api/auth/route.ts:3:1)
```

## Analysis

**Error Type**: Build Error - Configuration/Environment Variable Issue
**Root Cause**: Required environment variable not set in GitHub Actions

## Files Examined

1. **.github/workflows/deploy.yml** - Checked environment variable configuration
2. **src/config/api.ts** - Verified environment variable usage
3. **.env.example** - Checked required variables
4. **next.config.ts** - Reviewed environment variable exposure

## Solution Applied

```yaml
# .github/workflows/deploy.yml

# Add to the build job
env:
  API_BASE_URL: ${{ secrets.API_BASE_URL }}
  NEXT_PUBLIC_API_BASE_URL: ${{ secrets.NEXT_PUBLIC_API_BASE_URL }}
  NEXT_PUBLIC_S3_ENDPOINT: ${{ secrets.NEXT_PUBLIC_S3_ENDPOINT }}

# Or add to specific build step
- name: Build Next.js application
  env:
    API_BASE_URL: ${{ secrets.API_BASE_URL }}
  run: npm run build
```

## Additional Actions Needed

1. Add secrets in GitHub repository settings:
   - Go to Settings → Secrets and variables → Actions
   - Add `API_BASE_URL` secret
   - Add other required secrets from `.env.example`

2. Update workflow to pass secrets as build args to Docker:
   ```yaml
   - name: Build and push
     uses: docker/build-push-action@v5
     with:
       build-args: |
         API_BASE_URL=${{ secrets.API_BASE_URL }}
   ```

3. Update Dockerfile to accept build args:
   ```dockerfile
   ARG API_BASE_URL
   ENV API_BASE_URL=$API_BASE_URL
   ```

## Prevention

- Document all required environment variables in `.env.example`
- Add validation at build time to fail fast with clear error messages
- Use a build-time environment check script
- Keep GitHub Secrets documented in repository README
