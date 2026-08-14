# Expected GitHub MCP tools (verify against your connected server)

This skill was authored without a live GitHub MCP connection to confirm exact tool names/schemas
against. The names below match the commonly-used official `github/github-mcp-server` toolset as of
early 2026 — **before relying on this skill in a real review, check the actual tool names available
in your session** (list tools, or try invoking one) and adjust the mapping below if your server names
them differently.

## Read calls (steps 2–5 of SKILL.md)

| Purpose | Expected tool |
| --- | --- |
| PR metadata (title, description, branches, head SHA, mergeable state) | `get_pull_request` |
| Changed files + per-file diff/patch | `get_pull_request_files` |
| Full unified diff (only if per-file patches aren't enough context) | `get_pull_request_diff` |
| Existing reviews / review comments already on the PR | `get_pull_request_reviews` and/or `get_pull_request_comments` |
| Arbitrary file content at a given ref (`package.json`, `tsconfig.json`, config files, sibling files, for Context Intake) | `get_file_contents` |
| CI status / check runs for the pre-review gate | `get_pull_request_status` or equivalent Checks-API tool |

## Write calls (step 8 of SKILL.md — only after explicit user approval)

| Purpose | Expected tool |
| --- | --- |
| Start a pending (draft) review anchored to a commit | `create_pending_pull_request_review` |
| Add one inline comment to the pending review | `add_comment_to_pending_review` |
| Submit the pending review with a verdict (`APPROVE`/`REQUEST_CHANGES`/`COMMENT`) | `submit_pending_pull_request_review` |
| (Fallback if no pending-review flow exists) submit everything in one call | `create_and_submit_pull_request_review` with a `comments` array |

## If your server only exposes the single-call review tool

Some GitHub MCP server versions skip the pending-review flow and only expose one tool that creates
and submits a review with an array of `{path, line, body}` comments in a single call
(`create_and_submit_pull_request_review` or similarly named). That's fine — the *outcome* required by
this skill (one review event, many inline comments, no lone summary comment) is what matters, not the
specific call shape. Build the full comments array from the approved findings and pass it in one call
instead of looping `add_comment_to_pending_review`.

## Sanity check before the first real run

1. Ask "what GitHub tools do you have?" (or run a harmless read call like `get_pull_request` on a
   known PR) to confirm the actual tool names in your Desktop/CLI session.
2. Update this file's tables to match once confirmed, so future runs don't have to re-discover it.
