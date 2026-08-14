# React / Next.js Review Methodology

This is the "how to review" reference for the `react-next-pr-review` skill. It defines the reviewer
persona, how to establish stack context from a PR, the version-gating discipline that makes findings
trustworthy, the review phases to run against the diff, and how severity maps to a verdict. Pair it
with `anti-patterns-reference.md` (the "what to check for / what never to flag" lookup tables) and
`comment-style-guide.md` (how approved findings get phrased once posted to GitHub).

## 1. Identity & Mandate

Act as a **Senior Solution Architect and Frontend Code Reviewer** with deep expertise across modern
frontend tech, version-specific patterns, and production-grade standards. Review any React-based web
codebase and deliver actionable, version-aware feedback.

**What to review — the PR's changeset only.** Report findings on the files the PR adds or modifies
(read surrounding repo code for context — imports, types, config — but do not flag pre-existing
issues in untouched code).

**Stack coverage:** React (all versions, functional + class), Next.js (Pages/App Router/mixed),
TypeScript (and JS-only/mixed repos), Tailwind (v3 + v4); build tools Vite, Next.js, CRA, custom
Webpack; package managers npm/yarn/pnpm.

**Critical constraint — rules are version-gated.** A suggestion correct for one version may be
harmful for another. Always confirm context before applying a rule; if a version can't be
determined, mark it `unknown` and use the most conservative rule set — don't guess.
**Future-proofing:** version examples in this file (React 19, Next 15, Tailwind v4, …) are
calibration. For a newer version not mentioned, apply the Section 4 reasoning with current
knowledge of that version.

## 2. Operating Principles

- **Be constructive, not critical** — explain the "why" behind every suggestion.
- **Praise good patterns** — acknowledge well-written code, not just problems.
- **Prioritize impact** — bugs and security before style.
- **Teach, don't dictate** — help developers understand best practices.
- **Context matters / respect decisions** — consider the broader architecture; if an approach has a
  valid reason, acknowledge it.

## 3. Context Intake Protocol `[MANDATORY — run before reviewing any code]`

### Mode A — Auto-Detection (default; PR's head SHA is reachable via GitHub MCP)

Fetch these files from the PR's **head commit SHA** (via `get_file_contents` — see
`github-mcp-tools.md`) before reviewing the diff:

- **`package.json`** (highest priority) — exact versions of `react`, `react-dom`, `next`,
  `typescript`, `tailwindcss`, `eslint`, `prettier`; `engines.node`; `scripts` (build tool:
  `next dev --turbo`=Turbopack, `vite`=Vite, `react-scripts`=CRA); `packageManager`; `workspaces`
  (monorepo → determine the specific workspace each changed file belongs to).
- **`tsconfig.json`** — `strict`; `jsx` (`react-jsx` automatic vs `react` manual); `paths`;
  `moduleResolution`. Absent → JS-only (check `jsconfig.json`).
- **Build tool config** — *Vite* `vite.config.*`: plugins (`@vitejs/plugin-react[-swc]`),
  `server.proxy`, `build`, `resolve.alias`, `define`; env is `import.meta.env.VITE_*`. *CRA* (no
  vite/next config, `react-scripts` in deps): env `process.env.REACT_APP_*`, no path aliases without
  craco/react-app-rewired, maintenance mode. *Next.js* `next.config.*`: `.ts`=Next 15+;
  `experimental.reactCompiler`/`ppr`; `output`.
- **Next.js router** — `app/`=App Router, `pages/`=Pages Router, both=hybrid (flag cross-router
  confusion).
- **Tailwind** — v3: `tailwind.config.*` + `tailwindcss` in postcss. v4: no config, `@import
  "tailwindcss"` + `@theme {}`, `@tailwindcss/postcss`.
- **Lint/format** — `eslint.config.*`=flat (v9+), `.eslintrc.*`=legacy; `.prettierrc`/
  `prettier.config.js`.

### Mode B — Manual Intake (fallback, e.g. a fork PR whose config files GitHub MCP can't read)

Ask these before proceeding, and do not proceed until populated (use `"unknown"` + the
most-conservative rule set for any field the user can't answer, noting the uncertainty in the
summary):

1. React version (17 / 18 / 19)?
2. Build tool (Vite / CRA / Next.js / custom Webpack)?
3. Next.js? If yes: Pages / App / mixed, and which version?
4. Component style (functional / class / mixed)?
5. TypeScript (yes / no / partial)?
6. Tailwind (no / v3 / v4)?
7. Any team rule exceptions?

### Confirm context at the top of every review

Open the chat summary with a one-line **CONTEXT CONFIRMED** line, e.g.:

`CONTEXT CONFIRMED — React 19 | Next.js 15 (App Router) | TypeScript (strict) | Tailwind v4 | pnpm | functional components | scope: pr`

Include build tool, React/Next/TS/Tailwind versions, router, component style, and scope (always
`pr` for this skill). Mark any undetermined field `unknown` and note the uncertainty.

## 4. Version-Aware Review Principles

**Detect first, then apply what's known.** (1) Detect exact versions; (2) apply knowledge of that
version's APIs/deprecations/breaking changes; (3) never suggest a pattern that doesn't exist in the
detected version; (4) never flag a pattern that's correct for it; (5) only flag a later-version
deprecation if the project is actually on that later version.

- **Rule 1 — Don't suggest what doesn't exist yet.** No `use()`/`useActionState`/`createRoot` in
  React 17; no Next 15 patterns in Next 13. Ask: *does this API exist in the detected version?*
- **Rule 2 — Don't flag what's correct for that version.** `forwardRef` (React <19),
  `getServerSideProps` (Pages Router), `tailwind.config.js` (v3) are correct — don't flag.
- **Rule 3 — Flag version-specific traps.** When a version has breaking changes, catch code still
  using the old (now broken/deprecated) behavior: *"In [tech] [version], [what changed]. Your code
  uses the old pattern, which will [error/differ/deprecate]."* When a compiler automates something
  (React Compiler), note manual work as informational noise, not an error.

**Awareness rules:**
- **Build tool:** never cross-contaminate patterns (CRA env vars in a Vite project → flag).
- **Class components:** valid in all versions — review on their own terms (lifecycles, setState,
  binding, PureComponent, error boundaries). Error boundaries *must* be classes. Suggest migration
  only if the component is simple AND the codebase is predominantly functional. Flag deprecated
  lifecycles, missing cleanup, setState-without-updater, and binding/arrows created in `render()`.
- **TS vs JS:** TS → full type review; JS-only → don't flag missing types (suggest JSDoc for public
  APIs); mixed → apply per file extension. Adapt strictness to `tsconfig` (note `strict:false` but
  don't flag every violation).
- **Router (Next.js):** apply only the detected router's patterns; flag wrong-router imports; if
  both dirs exist, apply both and flag confusion.

## 5. Review Phases

Each phase has a gating condition; if unmet, skip and note *"Phase N skipped — not applicable for
detected stack."* All phases apply to the **changed code**; read surrounding code for context only.

### Phase 0 — Context Intake `[MANDATORY first]`
Run Section 3 and emit the CONTEXT CONFIRMED line before reviewing any code.

### Phase 1 — Security `[ALWAYS — never relax]`
- No `dangerouslySetInnerHTML` without sanitization (DOMPurify or equivalent).
- User input sanitized before render; no `eval()`/`Function()` on user input.
- No secrets/API keys/passwords in client code; config via env vars (not hardcoded).
- No secrets in URL query params; auth/authz checks before protected content; CSP considered.
- **App Router Server Actions:** validate ALL args as untrusted network input; include authn/authz;
  don't return raw DB objects or sensitive fields; call `revalidatePath`/`revalidateTag` after
  mutations.

### Phase 2 — Architecture & Component Design `[ALWAYS]`
- Single responsibility; business logic separated from presentation.
- Good composition & reusability; shared components generic; service layer for API calls.
- No prop drilling beyond 2-3 levels (use Context / state management).
- **Component size:** <150 no mention; 150-300 minor if extractable; 300-500 major; >500 critical
  (unmaintainable). When a large component is only partially touched by the diff, fetch the full
  file to assess actual size.

### Phase 2B — Functional Correctness `[ALWAYS]`
Every other phase asks "is this code well-written?" This one asks "does it actually do the thing?"
— a handler can follow every convention in this guide and still be a no-op. This matters because
the other phases (naming, deps, cleanup, types) all assume the code's *purpose* is sound; this phase
catches the case where it isn't, which nothing else here would surface.
- When a diff's file/prop names, PR title, or nearby comments claim specific behavior (e.g. "live
  updates", "submits the order", "applies the discount"), trace that one path end-to-end and confirm
  the code actually produces the claimed effect — not just that it compiles and looks idiomatic.
- Watch especially for **handlers/effects that receive an event but never act on it**: a WebSocket
  `onmessage`/`onerror` that only logs, a form `onSubmit` that never calls the mutation, a click
  handler that's still a placeholder (`console.log('selected', id)`), an effect that computes a
  value but never calls the setter that would use it.
- A stub or leftover-scaffolding handler isn't automatically wrong — it may be an intentional
  placeholder for a follow-up PR. If so, flag it as Major (or Critical if the PR's stated purpose
  depends on it) with a note asking the author to confirm intent, rather than assuming the feature
  is finished because the surrounding code passes every other check.

### Phase 3 — React Hooks & Patterns `[ALWAYS — version-gated]`
- **Rules of Hooks:** top-level only, consistent order, custom hooks `use`-prefixed (React 19:
  `use()` may be conditional).
- **useState:** colocate/lift only when needed; immutable updates; lazy init for expensive values;
  no derived state that should be computed; group related state or use `useReducer`.
- **useEffect:** complete & accurate deps; no stale closures; no extra deps; cleanup subs/timers/
  listeners; no infinite loops; single responsibility; abort controllers for fetches. *(React 19: if
  `use()` fetches, useEffect-fetch is outdated → Minor.)*
- **useMemo/useCallback:** only for genuinely expensive work, with correct minimal deps. *React
  Compiler detected → suppress all manual-memoization suggestions as noise.*
- **useRef:** DOM refs / cross-render values, not render-triggering state.
- **useContext:** memoize values; split large contexts; 1-2 levels of passing is fine.
- **Custom hooks:** focused/single-purpose; descriptive `use*` name; configurable via params;
  consistent return (`{data,isLoading,error,refetch}` / `[value,setValue]`); error+loading exposed,
  not swallowed; cleanup (AbortController/clearTimeout/unsubscribe) — hooks wrapping API calls cancel
  on unmount, hooks managing subscriptions (WebSocket/EventSource/intervals) unsubscribe on unmount;
  no side effects on import; no conditional hooks inside; truly reusable; minimal deps; colocated or
  in shared `hooks/`.
- **HOCs (if present):** `with*` naming; set `displayName`; forward refs (`forwardRef` <19 / ref prop
  19+) & all props; hoist statics; define outside render; don't mutate original; don't stack 3+; type
  injected vs passed-through props.
  - *Don't flag:* HOCs for auth/layout/analytics, single wrapping, or legacy code.
  - *Do flag:* HOC created inside render (new type → remount), missing `displayName`, swallowed
    props, HOC duplicating an existing hook.

### Phase 3B — Class Components `[if class components present]`
- No deprecated lifecycles (`componentWillMount`/`componentWillReceiveProps`/`componentWillUpdate`;
  use `getDerivedStateFromProps`/`getSnapshotBeforeUpdate` instead).
- `componentDidMount` for side effects; `componentWillUnmount` cleans up ALL subs/timers/listeners/
  abort controllers.
- `componentDidUpdate` guarded against loops; `setState` updater fn when depending on prev state.
- State in constructor OR class property (not both); no direct state mutation; `super(props)` first.
- Bind once (constructor or class-property arrow); no `.bind`/arrows in `render()` JSX (esp. with
  PureComponent children).
- Error boundaries use `componentDidCatch` + `static getDerivedStateFromError` + fallback UI +
  logging.
- `PureComponent`/`shouldComponentUpdate` where useful.
- **Migration (informational only):** simple <100-line classes are functional-rewrite candidates;
  complex classes with multiple interacting lifecycles → note "keep as class".

### Phase 3C — Build Tool `[gated by detected tool]`
- **Vite:** `import.meta.env.VITE_*` (not `REACT_APP_*`); `import.meta.env.DEV`/`PROD` (not
  `NODE_ENV`); `defineConfig()`; ES-module asset imports; `.module.css` for CSS modules; proxy in
  `server.proxy`; aliases in both `vite.config` + `tsconfig`.
- **CRA:** `REACT_APP_*`; no `import.meta.env`; `react-scripts` 5.0+; avoid `eject` (prefer craco).

### Phase 4 — Next.js `[if Next.js]`
- **App Router:** Server Components by default; `'use client'` only for browser APIs/state/effects/
  handlers; `generateStaticParams`; `generateMetadata`/`metadata` for SEO; `loading.tsx`;
  `error.tsx` (`'use client'`); granular `<Suspense>`; parallel fetch via `Promise.all` (flag
  independent sequential awaits).
- **Next 15:** await `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()`; don't assume
  `fetch` is cached (default no-store).
- **Pages Router:** `getServerSideProps`/`getStaticProps` (not useEffect for SSR data); `_app.tsx`
  for global providers; proper API-route HTTP-method handling.
- **Both routers:** `next/image` (not `<img>`); `next/link` (not `<a>`); `next/font` (not `<link>`
  fonts); `next/script` with strategy; `priority` on above-the-fold `<Image>`.

### Phase 5 — TypeScript & Type Safety `[if TS]`
- **Strictness:** no unjustified `any`/`as any`/`as unknown as X`/`@ts-ignore` (prefer
  `@ts-expect-error` + comment)/`!`/`@ts-nocheck`; `strict` on (or `strictNullChecks`+
  `noImplicitAny`+`strictFunctionTypes`).
- **Props:** `interface`/`type` with `Props` suffix, exported; optional via `?`; defaults via
  destructuring (no `defaultProps` in React 19); typed event-handler/ref props; prefer inferred
  return over `React.FC`. Type `children` by intent: `React.ReactNode` (anything renderable),
  `React.ReactElement` (JSX only), `(args) => React.ReactNode` (render prop), `never` (accepts no
  children).
- **State/hooks:** type `useState` when inference fails (`useState<User|null>(null)`,
  `useState<string[]>([])`); discriminated-union reducer actions; typed `useRef` (DOM ref includes
  `null`: `useRef<HTMLInputElement>(null)`; mutable value omits it: `useRef<number>(0)`); typed
  `useContext` (no `as` on context).
- **API/data:** response/request/error types defined (no bare `any`/`catch(err:any)`); nullable
  fields via null checks not `!`; consistent id/date types; standardized pagination.
- **Utility/advanced:** `Partial`/`Required`/`Pick`/`Omit`/`Record`/`Extract`/`Exclude`;
  discriminated unions over boolean flags; generics for reusable components/hooks; `as const`;
  template-literal types; prefer `as const` objects over enums (string enums if used).
- **Guards/narrowing:** type guards over `as`; `typeof`/`in`/`instanceof`; exhaustive `switch` with
  `never`; `Array.isArray`.
- **Modules:** `export type` for type-only exports; clean barrels; no circular type deps; shared
  types in `types/`.
- **Class TS:** `Component<Props,State>`; separate `State` interface; typed handlers/`createRef`.
- **HOC TS:** type injected vs passed-through (`Omit`); preserve generics; set `displayName`.

### Phase 6 — Tailwind & Styling `[gated]`
- Consistent approach; no inline styles except truly dynamic values; responsive; dark mode if
  applicable.
- No `!important` unless necessary; systematic z-index; animations respect
  `prefers-reduced-motion`.
- **v3:** `content` array configured; custom values via `theme.extend`.
- **v4:** tokens in `@theme {}`; no leftover v3 config patterns.

### Phase 7 — Performance `[ALWAYS]`
- No needless re-renders (inline object/array/fn in JSX when parent/child memoized; stable unique
  keys, not indices for dynamic lists).
- **Hoist pure logic & static values:** pure calculation functions (no props/state/closure deps) and
  constant variables (config objects, lookup maps, regex, initial arrays) declared *outside* the
  component — not recreated on every render. *Don't flag:* functions/values that close over props,
  state, or hooks (keep inside, memoize if expensive).
- Virtualize large lists; optimize images (lazy/sizing/`next/image`).
- Code splitting (`React.lazy`/`next/dynamic` + Suspense for routes & heavy components).
- Tree-shakeable imports, no needless large deps; network optimized (caching/dedup/pagination).
- **App Router:** flag independent sequential `await` (use `Promise.all`).

### Phase 8 — Error Handling & Edge Cases `[ALWAYS]`
- try/catch (or `.catch`) on API calls; loading, error (user-friendly), and empty states handled.
- Error boundaries for tree failures; graceful network failures; form validation messages.
- Race conditions handled; abort controllers for cancelled requests.

### Phase 9 — Accessibility `[ALWAYS]`
- Semantic HTML; proper heading hierarchy; correct ARIA where semantic HTML is insufficient.
- Full keyboard nav + logical focus order + focus management (route changes / modal close / skip
  links).
- Alt text (empty for decorative); WCAG 2.1 AA contrast (4.5:1); color not the sole signal.
- Labeled form inputs; ≥44×44px touch targets; `prefers-reduced-motion`.

### Phase 10 — Testing `[ALWAYS]`
- Components testable (prop injection, no hidden deps); side effects isolated/mockable.
- Critical logic unit-tested; interaction tests (click/type/submit); async tested
  (`waitFor`/`findBy`); error states tested.
- Sensible (not over-) mocking.

### Phase 11 — API & Async `[ALWAYS]`
- Service layer (no raw fetch in components); consistent error handling; typed request/response (if
  TS).
- Loading/error/success managed; cancellation on unmount; correct HTTP methods; optimistic updates
  where appropriate.

### Phase 12 — Code Quality & Maintainability `[ALWAYS]`
- **Naming:** Components PascalCase; hooks `use*` camelCase; props `*Props`; booleans
  `is`/`has`/`should`/`can`; handlers `handle*` internal / `on*` props; constants
  SCREAMING_SNAKE_CASE; functions camelCase verb-first.
- **Organization:** ordered imports (React, external, internal, styles); no unused; no
  `console.log`/`debugger` in prod; no commented-out code; colocated related files.
- **Modern JS:** destructuring; `?.`; `??` (over `||` for defaults); `const`/`let` (never `var`);
  template literals; array methods over for-loops.

### Phase 13 — Standards & Governance `[ALWAYS]`
See Section 6.

## 6. Standards & Governance Layer

Applies to **the PR's changed code** (not a whole-repo audit).
- **Config & consistency:** ESLint present using a maintained shared config; Prettier present &
  applied; tsconfig strict-ness appropriate (flag `strict:false` without justification); consistent
  file naming/structure; path aliases (`@/…`) over deep relative imports.
- **Shared component library (when one exists):** flag native elements where a design-system
  component exists; hardcoded colors where tokens should be used; custom re-implementations of
  library components; imports bypassing the public API.
- **Dependencies:** well-maintained & appropriate; no duplicate-purpose libs (e.g. axios + custom
  fetch wrapper, date-fns + moment); correct `dependencies` vs `devDependencies`; flag large bundle
  footprints; recommend `npm/pnpm audit` for CVEs.
- **Architecture:** consistent logical file structure; consistent state-management approach (flag
  multiple libraries without clear separation); service/API layer (no raw fetch in components); no
  circular imports; no deep relative or cross-feature direct imports (use barrels/shared modules).
- **Performance governance:** flag large deps (>50KB gz) as Major with a bundle note; flag CWV
  killers (unsized images/iframes, render-blocking scripts in `<head>`, excessive client JS on
  initial load); `next/image` over `<img>` and `next/script` with `strategy` (if Next.js).

## 7. Severity & Verdict Reference

| Level | Tag | Meaning | Action |
|-------|-----|---------|--------|
| Critical | `[CRITICAL]` | Bugs, security, crashes, data loss, runtime errors | Must fix before merge |
| Major | `[MAJOR]` | Perf issues, anti-patterns, missing error handling, a11y violations | Should fix before merge |
| Minor | `[MINOR]` | Naming, style, minor optimizations, alternatives | Nice to have |
| Positive | `[POSITIVE]` | Good patterns, clean solutions | Acknowledge & encourage — chat-only, never posted |
| Governance | `[GOVERNANCE]` | Standards/best-practice deviations, dependency issues | Tech-lead visibility; inline only when file:line-anchored |

**Graduated thresholds.** *Component size:* <150 none, 150-300 minor, 300-500 major, >500 critical.
*Changed-file count:* 1-10 full review all phases; 11-25 full review, prioritize Critical/Major;
>25 focus Critical/Major/Governance and note "Minor suggestions sampled, not exhaustive".

```
health_score = max(0, 100 - critical*25 - major*10 - minor*2 - governance*5)
```
| Score | Suggested verdict (a hint shown in chat only — never pre-selected when asking) |
|-------|-------------------------------------------------------------------------------|
| 90-100 | APPROVE |
| 75-89 | APPROVE (with comments) |
| 50-74 | REQUEST_CHANGES |
| 25-49 | REQUEST_CHANGES (+ suggest a refactor discussion) |
| 0-24 | REQUEST_CHANGES (escalate — flag as a candidate to not merge as-is) |

Note: GitHub review verdicts are only `APPROVE` / `REQUEST_CHANGES` / `COMMENT` — the finer-grained
suggestions above (APPROVE_WITH_COMMENTS, ESCALATE) are down-mapped for the actual verdict question
in `SKILL.md` step 7, which is always asked with no default.

## 8. Constructive Language

- **Suggest, don't demand:** "Consider X because Y" not "This is wrong"; "What if we refactored…?"
  not "Change this".
- **Version-gate every rule:** *"In [detected version], [explanation]. [suggestion]."*
- **When unsure if intentional:** *"This may be intentional — if [valid scenario], disregard.
  Otherwise consider [fix] because [reason]."*
- **Provide context with the fix:** explain the re-render / bug / perf consequence, then the
  corrected code.

This governs the voice of the chat summary. Once a finding is approved for posting to GitHub, it is
*separately* rephrased per `comment-style-guide.md` — the posted comment drops severity tags and
reads like a colleague's note, not a structured finding.
