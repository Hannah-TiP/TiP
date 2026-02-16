# CI/CD Failure Analysis Template

Use this template for consistent output when debugging GitHub Actions failures.

---

## CI/CD Failure Analysis

**Workflow**: `<workflow-name>`
**Run ID**: `<run-id>`
**Run URL**: `https://github.com/<org>/<repo>/actions/runs/<run-id>`
**Failed Job**: `<job-name>`
**Failed Step**: `<step-name>`
**Commit**: `<commit-sha>` - "<commit-message>"

---

### ⚠️ Error Summary

<1-2 sentence description of what went wrong>

---

### 🔍 Root Cause

<Detailed explanation of the underlying cause>

**Error Type**: <classification> (e.g., Docker Build Error, Dependency Issue, Test Failure)

**Error Message**:
```
<exact error message from logs>
```

**Analysis**:
- <Key observation 1>
- <Key observation 2>
- <Key observation 3>

---

### 📁 Affected Files

| File | Line | Issue |
|------|------|-------|
| `path/to/file1` | 42 | <description> |
| `path/to/file2` | - | <description> |

---

### 🔧 Recommended Fix

<Detailed explanation of the solution>

**Approach**: <High-level strategy>

**Changes Required**:

1. **`path/to/file1`**
   ```diff
   - old line
   + new line
   ```
   *Reason: <why this change is needed>*

2. **`path/to/file2`**
   ```diff
   - old line
   + new line
   ```
   *Reason: <why this change is needed>*

---

### ✅ Verification Steps

After applying the fix:

1. [ ] Commit changes: `git add <files> && git commit -m "fix: <description>"`
2. [ ] Push to trigger new CI/CD run: `git push`
3. [ ] Monitor workflow run: [Link](https://github.com/<org>/<repo>/actions)
4. [ ] <Additional verification step if needed>

**Optional Local Testing**:
```bash
<commands to test locally>
```

---

### 📚 Related Documentation

- [Link to relevant docs 1]
- [Link to relevant docs 2]

---

### 🔮 Prevention

To prevent this issue in the future:

- <Suggestion 1>
- <Suggestion 2>
- <Suggestion 3>

---

### 📊 Context

**Recent Changes**:
```bash
git log --oneline -5
```

**Diff from Last Successful Run**:
<If available, show what changed>

**Similar Past Failures**:
<If this error has occurred before, reference it>

---

## 🤔 Next Steps

Would you like me to:
- [ ] Apply these fixes automatically
- [ ] Provide manual fix instructions
- [ ] Investigate alternative solutions
- [ ] Check for similar issues in other files

---

## 📝 Notes

<Any additional observations, caveats, or warnings>
