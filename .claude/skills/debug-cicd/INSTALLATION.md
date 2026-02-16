# Debug CI/CD Skill - Installation Complete ✅

A comprehensive Claude Code skill for debugging GitHub Actions workflow failures has been installed in your project.

## 📦 What Was Created

```
.claude/skills/debug-cicd/
├── SKILL.md                           # Main skill instructions (7KB)
├── README.md                          # User guide and quick start
├── INSTALLATION.md                    # This file
├── template.md                        # Output format template
├── error-patterns.md                  # Common error patterns reference
├── helpers.sh                         # Bash helper functions
└── examples/
    ├── docker-node-version.md         # Example: Node version mismatch
    └── missing-env-variable.md        # Example: Missing env vars
```

**Total Files**: 8 files across 2 directories

## 🚀 Quick Start

The skill is immediately available! Try it now:

```bash
# Debug the most recent failed workflow
/debug-cicd

# Debug a specific run by ID
/debug-cicd 22053156315

# Debug from a GitHub Actions URL
/debug-cicd https://github.com/Hannah-TiP/TiP/actions/runs/22053156315
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Auto-detect failures** | Finds the most recent failed run if no arguments provided |
| **Comprehensive analysis** | Identifies error type, root cause, and affected files |
| **Automated fixes** | Can apply fixes with your approval |
| **Smart log parsing** | Handles large logs and extracts relevant errors |
| **Multiple input formats** | Accepts run IDs, URLs, or auto-detection |
| **Error patterns** | Built-in knowledge of common CI/CD issues |
| **Helper scripts** | Bash utilities for advanced debugging |

## 📋 What It Can Debug

### Docker Issues
- ✅ Base image version mismatches (Node, Python, etc.)
- ✅ Missing dependencies in containers
- ✅ COPY command failures
- ✅ Multi-architecture build issues
- ✅ Registry authentication problems

### Dependency Issues
- ✅ Version conflicts and incompatibilities
- ✅ Engine version requirements
- ✅ Peer dependency problems
- ✅ Lock file synchronization

### Build Errors
- ✅ TypeScript compilation errors
- ✅ Module resolution failures
- ✅ Out of memory issues
- ✅ Build configuration problems

### Test Failures
- ✅ Environment configuration
- ✅ Database connection issues
- ✅ Snapshot mismatches
- ✅ Race conditions

### Deployment Issues
- ✅ Permission errors
- ✅ Missing secrets/environment variables
- ✅ Registry push failures
- ✅ Authentication problems

### Configuration Errors
- ✅ YAML syntax errors
- ✅ Workflow configuration issues
- ✅ Cache problems
- ✅ Timeout issues

## 🎯 Example Workflow

1. **Run the skill**:
   ```bash
   /debug-cicd
   ```

2. **Review the analysis**:
   ```markdown
   ## CI/CD Failure Analysis
   **Workflow**: Build and Push Docker Image
   **Error Summary**: Docker build failed due to Node.js version mismatch
   **Root Cause**: Using Node 18, but Next.js 16 requires >= 20.9.0
   **Affected Files**:
   - Dockerfile:5 - deps stage
   - Dockerfile:14 - builder stage
   - Dockerfile:34 - runner stage
   ```

3. **Approve the fix**:
   Claude asks: "Would you like me to apply these changes?"
   You respond: "Yes"

4. **Verify**:
   The skill updates your files and suggests next steps

## 🛠️ Requirements

- **GitHub CLI** (`gh`) - Must be installed and authenticated
  ```bash
  brew install gh        # macOS
  gh auth login         # Authenticate
  ```

- **Git repository** - Must have GitHub as remote

- **Permissions** - Read access to GitHub Actions on the repository

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Quick reference and usage guide |
| `SKILL.md` | Complete instructions for Claude |
| `template.md` | Output format template |
| `error-patterns.md` | Common error patterns and fixes |
| `helpers.sh` | Bash utilities (gh CLI wrappers) |
| `examples/` | Real-world debugging examples |

## 🧪 Test It Now

Let's verify the skill works:

```bash
# Check if gh CLI is available
gh --version

# List recent workflow runs
gh run list --limit 5

# Try the skill (if there are any failed runs)
/debug-cicd
```

## ⚙️ Customization

The skill is configured with these settings:

```yaml
name: debug-cicd
description: Debug GitHub Actions CI/CD failures
disable-model-invocation: false  # Can be auto-triggered
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
```

To customize:
1. Edit `.claude/skills/debug-cicd/SKILL.md`
2. Add project-specific error patterns to `error-patterns.md`
3. Modify output format in `template.md`
4. Add new helper functions to `helpers.sh`

## 🔄 Updating the Skill

The skill files are in your project directory. To update:

1. Edit the relevant files in `.claude/skills/debug-cicd/`
2. Changes take effect immediately (no restart needed)
3. Test with `/debug-cicd` to verify changes

## 📖 Learning from Examples

Check out the `examples/` directory for real-world scenarios:

### Docker Node Version Mismatch
```bash
cat .claude/skills/debug-cicd/examples/docker-node-version.md
```
Shows how the skill handled the exact error we just fixed!

### Missing Environment Variables
```bash
cat .claude/skills/debug-cicd/examples/missing-env-variable.md
```
Demonstrates debugging missing secrets in GitHub Actions.

## 🎓 Best Practices

1. **Run after each failure** - Don't manually parse logs anymore
2. **Review before applying** - Always check suggested fixes
3. **Learn from patterns** - The skill documents common issues
4. **Keep it updated** - Add new patterns as you encounter them
5. **Use helpers** - The bash utilities can be used standalone too

## 🔍 Advanced Usage

### Using Helper Scripts Directly

```bash
# Source the helpers
source .claude/skills/debug-cicd/helpers.sh

# Use individual functions
get_latest_failed_run
list_recent_runs
get_failed_jobs 22053156315
```

### Debugging Multiple Runs

```bash
# Debug several runs in sequence
/debug-cicd 12345
/debug-cicd 12346
/debug-cicd 12347
```

### Comparing with Last Success

The skill automatically:
- Identifies the last successful run
- Shows what changed between success and failure
- Highlights suspicious commits

## 🆘 Troubleshooting

### "gh: command not found"
```bash
# Install GitHub CLI
brew install gh          # macOS
# or visit https://cli.github.com/
```

### "Not authenticated with GitHub"
```bash
gh auth login
```

### "No recent failed runs found"
```bash
# List all runs to find a specific one
gh run list --limit 20

# Then debug by ID
/debug-cicd <run-id>
```

### Skill not appearing
```bash
# Verify skill file exists
ls -la .claude/skills/debug-cicd/SKILL.md

# Check file permissions
chmod 644 .claude/skills/debug-cicd/SKILL.md
```

## 🎉 What's Next?

Now that the skill is installed:

1. ✅ **Test it**: Run `/debug-cicd` on any failed workflow
2. 📖 **Read examples**: Check out the example debugging sessions
3. 🛠️ **Customize**: Add your project-specific patterns
4. 🔄 **Iterate**: The skill learns from your codebase patterns

## 📞 Getting Help

If you encounter issues:
1. Check `error-patterns.md` for known issues
2. Review examples in `examples/`
3. Run helpers manually to isolate the problem
4. Check GitHub CLI connection: `gh auth status`

## 🌟 Success Story

This skill was built while debugging the exact issue it's designed to fix! We used it to identify and resolve a Node.js version mismatch in the TiP project's Dockerfile.

**Before**: Manual log parsing, hunting through 36KB of logs
**After**: Instant diagnosis with `/debug-cicd 22053156315`

---

**Skill Version**: 1.0.0
**Created**: February 2026
**Project**: TiP (Travel Intelligence Perfected)

Happy debugging! 🚀
