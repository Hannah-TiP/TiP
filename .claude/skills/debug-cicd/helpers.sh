#!/bin/bash
# Helper functions for debug-cicd skill
# These can be sourced by Claude Code when needed

# Extract run ID from GitHub Actions URL
extract_run_id() {
    local url="$1"
    echo "$url" | grep -oE '[0-9]{10,}' | tail -1
}

# Get the most recent failed workflow run
get_latest_failed_run() {
    gh run list --limit 1 --json databaseId,conclusion \
        --jq '.[] | select(.conclusion=="failure") | .databaseId'
}

# Get workflow run status
get_run_status() {
    local run_id="$1"
    gh run view "$run_id" --json conclusion,status,workflowName \
        --jq '{conclusion, status, workflow: .workflowName}'
}

# List recent workflow runs with status
list_recent_runs() {
    gh run list --limit 5 --json databaseId,conclusion,displayTitle,workflowName,createdAt \
        --jq '.[] | "[\(.databaseId)] \(.conclusion // "running") - \(.workflowName) - \(.displayTitle) (\(.createdAt))"'
}

# Get failed job names from a run
get_failed_jobs() {
    local run_id="$1"
    gh run view "$run_id" --json jobs \
        --jq '.jobs[] | select(.conclusion=="failure") | .name'
}

# Extract error lines from logs (last 50 lines of failed step)
extract_error_context() {
    local log_file="$1"
    # Get lines around ERROR, FAIL, or exit code
    grep -B 10 -A 5 -iE 'error:|failed|exit code|fatal|exception' "$log_file" | tail -50
}

# Check if gh CLI is installed and authenticated
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo "ERROR: GitHub CLI (gh) is not installed"
        echo "Install from: https://cli.github.com/"
        return 1
    fi

    if ! gh auth status &> /dev/null; then
        echo "ERROR: GitHub CLI is not authenticated"
        echo "Run: gh auth login"
        return 1
    fi

    return 0
}

# Get workflow file path from run
get_workflow_file() {
    local run_id="$1"
    gh run view "$run_id" --json workflowName \
        --jq '.workflowName' | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]'
}

# Compare current commit with last successful run
get_last_successful_commit() {
    local workflow_name="$1"
    gh run list --workflow "$workflow_name" --limit 10 --json conclusion,headSha \
        --jq '.[] | select(.conclusion=="success") | .headSha' | head -1
}

# Get changed files between two commits
get_changed_files_between() {
    local commit1="$1"
    local commit2="$2"
    git diff --name-only "$commit1" "$commit2"
}

# Format time ago
time_ago() {
    local timestamp="$1"
    local now=$(date +%s)
    local then=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$timestamp" +%s 2>/dev/null || echo "$now")
    local diff=$((now - then))

    if [ $diff -lt 60 ]; then
        echo "${diff}s ago"
    elif [ $diff -lt 3600 ]; then
        echo "$((diff / 60))m ago"
    elif [ $diff -lt 86400 ]; then
        echo "$((diff / 3600))h ago"
    else
        echo "$((diff / 86400))d ago"
    fi
}

# Main function - can be called with run ID or URL
debug_workflow() {
    local input="$1"

    check_gh_cli || return 1

    local run_id
    if [ -z "$input" ]; then
        echo "No run ID provided. Finding most recent failed run..."
        run_id=$(get_latest_failed_run)
        if [ -z "$run_id" ]; then
            echo "No recent failed runs found."
            echo -e "\nRecent runs:"
            list_recent_runs
            return 1
        fi
        echo "Found failed run: $run_id"
    elif [[ "$input" =~ ^[0-9]+$ ]]; then
        run_id="$input"
    else
        # Extract from URL
        run_id=$(extract_run_id "$input")
        if [ -z "$run_id" ]; then
            echo "ERROR: Could not extract run ID from input: $input"
            return 1
        fi
    fi

    echo "Fetching logs for run $run_id..."
    gh run view "$run_id" --log-failed
}

# Export functions for use in subshells
export -f extract_run_id
export -f get_latest_failed_run
export -f get_run_status
export -f list_recent_runs
export -f get_failed_jobs
export -f check_gh_cli
export -f get_workflow_file
export -f debug_workflow
