---
name: react-next-pr-review
description: "Use when the user asks to review a GitHub pull request in a React or Next.js web project — invocations like 'review PR 123', 'review https://github.com/org/repo/pull/123', 'check this PR', 'review org/repo#123' for a React/Next.js/TypeScript/Tailwind web app (this is the web counterpart to a React Native PR review — do not use for React Native / Expo mobile projects). Fetches the PR via GitHub MCP, auto-detects the stack (React/Next version, router, TypeScript, Tailwind, build tool) from the PR's files, runs a version-aware review against the diff covering security, architecture, hooks, TypeScript, accessibility, performance and more, and shows a review summary in chat only. Never posts anything to GitHub until the user explicitly approves, then posts findings as inline per-file/per-line comments on a single GitHub review — not one bot-style summary comment."
argument-hint: "<PR number, URL, or owner/repo#number>"
---

# React / Next.js PR Review

Fetch a GitHub pull request for a React or Next.js web project, review it against
`references/review-methodology.md` and `references/anti-patterns-reference.md`, show the findings
in chat, and — only after explicit approval — post them to GitHub as inline comments on a single
review (never a lone summary comment).

This skill is self-contained: it does not depend on any other skill, plugin, or command (including
`react-next-toolkit` or its `/review` command) for any part of the flow. It requires a GitHub MCP
server to be connected. If no GitHub MCP tools are available, stop and tell the user to connect one
(Desktop: Settings → Connectors; CLI: `claude mcp add`).

## Hard rules (never violate these)

1. **Never call any GitHub write tool** (create/submit a review, post a comment, add a label, etc.)
   before the user has explicitly approved the findings shown in chat for *this* run. A previous
   approval, on this PR or any other, does not carry over.
2. **Never post a single big summary comment as the review body.** The review's substance must be
   inline comments, one per finding, anchored to a file and line. The top-level review body is
   optional and — if used — short (e.g. "Reviewed — see inline comments.").
3. **Always ask which verdict to submit** (APPROVE / REQUEST_CHANGES / COMMENT) — never assume one,
   even when every finding is Critical or the findings list is empty. A health-score-derived
   suggestion may be shown in the chat summary as a labeled hint, but the verdict question itself is
   asked with no pre-selection.
4. **Phrase every inline comment the way a human reviewer would** (see
   `references/comment-style-guide.md`) — no `[Category]` tags, no CRITICAL/MAJOR/MINOR labels, no
   bracketed severity markers inside the posted comment body. Those labels are for the chat summary
   only. Never mention that the review is automated/AI-generated inside a posted comment.
5. **Never guess an undetermined stack fact.** If Context Intake (step 3) can't establish a version,
   router, or tool from the PR's files, mark it `unknown` and apply the most conservative rule set
   (per Mode B in `references/review-methodology.md`) rather than assuming.
6. **Never silently post a large batch of comments.** If the approved finding count is large (more
   than ~25), pause and ask the user whether to post all of them, only Critical/Major, or a sampled
   subset, before posting anything.

## Step-by-step procedure

### 1. Parse the request

Accept any of: `owner/repo#123`, a full PR URL, or a bare number `123`. A bare number is only
resolvable if the current conversation/Project has already established a default repo (e.g. from
custom instructions or an earlier message this session) — otherwise ask the user which repo.

### 2. Fetch the PR (GitHub MCP)

- PR metadata: title, description, author, base branch, head branch, head commit SHA, mergeable
  state, current labels/reviewers.
- The full list of changed files, each with its diff/patch, additions/deletions, and status
  (added/modified/removed/renamed).
- Existing reviews and review comments already on the PR — keep this list so step 6 can skip
  findings that duplicate something already posted (e.g. on a re-review after new commits).

See `references/github-mcp-tools.md` for expected tool names — verify them against your actually
connected GitHub MCP server, since tool names can vary by server/version.

### 3. Detect the stack and confirm context

Run the Context Intake Protocol from `references/review-methodology.md` §3:

- **Mode A (default):** fetch `package.json`, `tsconfig.json`/`jsconfig.json`, the build-tool config
  (`vite.config.*` / `next.config.*`), the Tailwind config (or its absence, for v4), and the ESLint
  config from the PR's **head SHA** via `get_file_contents`. Detect React/Next/TypeScript/Tailwind
  versions, the build tool, the Next.js router (`app/`, `pages/`, or both), component style
  (functional/class/mixed), and package manager.
- **Mode B (fallback):** if those files aren't reachable (e.g. a fork PR GitHub MCP can't read config
  from), ask the Mode B questions from `references/review-methodology.md` §3 directly, mark any
  unanswered field `unknown`, and note the uncertainty.
- Always loads the same two reference files regardless of detected stack — there is no
  variant-specific file to choose. Phase gating (skipping N/A phases) happens inside step 5, not at
  file-selection time.
- This produces the one-line `CONTEXT CONFIRMED` summary that opens the chat summary in step 6.

If a change spans multiple workspace packages with different stacks (monorepo), detect the relevant
package.json/tsconfig per changed file's workspace rather than assuming one repo-wide stack; note
this explicitly in the summary if it happens.

### 4. Pre-review gate

GitHub MCP cannot run the repo's own lint/typecheck/test scripts — this gate is observational, not
executed. Pull the PR's combined status / check-runs and report pass/fail/pending for whatever CI
checks exist (lint, types, tests, build, or equivalents). Record this in the summary; do not block
the review on it — a Critical-worthy CI failure just gets called out alongside the code findings.

### 5. Run the review against the diff

Using `references/review-methodology.md` (phases, version-aware rules) and
`references/anti-patterns-reference.md` (non-flag zones, anti-pattern catalog):

1. For each changed file, determine which review phases apply (a component file triggers
   Architecture + Functional Correctness + Hooks + TypeScript + Accessibility + Performance + Code
   Quality; a Server Action triggers Security + Functional Correctness + Next.js; a config file
   triggers Standards & Governance; etc. — most files touch several phases, and Phase 2B
   (Functional Correctness) applies to essentially every file that adds a handler, effect, or
   action, regardless of stack). Skip phases whose gating condition isn't met (no TS → skip Phase 5;
   no Tailwind → skip Phase 6; Pages-only router → skip App-Router-only bullets in Phase 4) and note
   the skip.
2. Evaluate the diff hunks against every applicable phase. When a rule needs context beyond the diff
   (e.g. a component-size threshold on a partially-touched file, or "is this pattern used elsewhere
   in the file") fetch the full file at the head SHA via `get_file_contents`.
3. Suppress anything matching a Non-Flag Zone entry before recording a finding.
4. Record each finding as `{file, line, side: "RIGHT", severity: CRITICAL|MAJOR|MINOR|GOVERNANCE|POSITIVE,
   category, note}`. Use the new file's line number (`side: RIGHT`) for added/modified lines; only
   use `LEFT` for a removed line that is itself the problem (rare).
5. Drop any finding that duplicates a `file:line:category` already present in an existing review
   comment fetched in step 2 — do not re-flag it.
6. Apply the graduated thresholds from `references/review-methodology.md` §7 for large PRs: 1–10
   changed files → full review, all phases; 11–25 → full review, prioritize Critical/Major in the
   write-up; >25 → focus Critical/Major/Governance only and state "Minor suggestions sampled, not
   exhaustive."

### 6. Show the review summary — nothing is posted yet

Report using this structure:

```
## Review Result — <owner/repo>#<PR number>: <PR title>
CONTEXT CONFIRMED — React X | Next Y (Router) | TypeScript (strict|loose|none) | Tailwind vZ | pm | component style | scope: pr
Pre-review gate: <CI check name>: <pass|fail|pending> (repeat per check)

### Critical (must fix before merge)
- [Category] file:line — problem — suggested fix

### Major (should fix before merge)
- [Category] file:line — problem — suggested fix

### Minor (nice to have)
- [Category] file:line — problem — suggested fix

### Governance (tech-lead visibility)
- [Category] file:line — problem — suggested fix

### What's Done Well
- (mandatory, never empty — chat-only, never posted to GitHub)

### Skipped phases
- Phase N skipped — not applicable for detected stack (repeat as needed, omit section if none skipped)
```

If it's useful as a quick tooling-style readout, follow with a compact chat-only block:

```yaml
# REVIEW METADATA (chat-only — never posted to GitHub)
findings: { critical: 0, major: 2, minor: 5, positive: 3, governance: 1 }
health_score: 65            # formula in references/review-methodology.md §7
suggested_verdict: "REQUEST_CHANGES"   # a hint only — see step 7, never pre-selected
```

If there are zero findings, still show all sections (empty ones say "None found"), keep "What's Done
Well" populated, and state `✅ All checks passed based on the diff reviewed.`

End every summary with:

> Reply **APPROVE** to post these as inline PR comments, **EDIT** to adjust findings first, or
> **CANCEL** to stop here.

Do not proceed past this point without an explicit APPROVE-equivalent reply in this turn.

### 7. On approval, ask for the verdict explicitly

Ask: "Which review verdict should I submit — **APPROVE**, **REQUEST_CHANGES**, or **COMMENT**?" Do
not pre-select or suggest one, even though step 6's `suggested_verdict` may have hinted at one. Wait
for the user's choice.

### 8. Post as a single pending review with inline comments (GitHub MCP)

1. Determine which approved findings are postable: **Critical, Major, and Minor** findings are
   always inline-comment candidates. **Governance** findings are inline candidates only when they're
   cleanly anchored to a specific `file:line`; a repo-wide observation (e.g. "duplicate-purpose
   dependency in package.json") stays chat-only instead. **Positive** findings are never posted.
2. If the postable count is large (more than ~25), pause and ask the user whether to post all of
   them, only Critical/Major, or a sampled subset — do not post a large batch silently.
3. Start a pending review on the PR anchored to the head commit SHA.
4. For each postable finding the user approved, add one inline comment (`path`, `line`, `side`)
   phrased per `references/comment-style-guide.md`.
5. Submit the pending review with the chosen verdict and a minimal (or empty) top-level body.
6. Report back the review's URL and a count of comments posted.

### Handling a re-review (same PR, new commits pushed)

Re-run steps 2–6 against the new head SHA. Findings whose `file:line:category` was already posted in
a prior review (from step 2's scan) are dropped before the summary is shown — only new or
still-unresolved findings appear, so the second pass doesn't repeat itself.
