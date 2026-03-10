#!/bin/bash
# Block git write operations for Paperclip agents only
# PAPERCLIP_RUN_ID is set by Paperclip when launching agents via heartbeat

# Allow if not running as a Paperclip agent
if [ -z "$PAPERCLIP_RUN_ID" ]; then
  exit 0
fi

COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -qE '(^|\s*&&\s*|\s*;\s*|\|\s*)git (commit|push|tag|merge|rebase|reset|stash)' || \
   echo "$COMMAND" | grep -qE '(^|\s*&&\s*|\s*;\s*|\|\s*)git branch -[dD]'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Git write operations are not allowed for Paperclip agents. Only the human operator creates commits and pushes."
    }
  }'
else
  exit 0
fi
