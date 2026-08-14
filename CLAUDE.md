## Project

RM Helper Tool — internal RM (Resource Manager) / team-management app: skills, projects, goals, certifications, internal sessions, and CV-based skill tests, with AI-assisted extraction and test generation.

- Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 + shadcn/ui
- Prisma 7 (`prisma-client` generator, Postgres via `@prisma/adapter-pg`), local DB via `docker-compose.yml` (`postgres:16-alpine` on port 5434)
- Auth: JWT sessions (`jose`) in `lib/session.ts`, edge auth guard in `proxy.ts` (matches all routes except `/api`, `_next/*`, static files), route-level RBAC in `lib/rbac.ts` (role re-checked from DB per request, not cached in the JWT)
- AI: `@anthropic-ai/sdk` (`lib/anthropic.ts`, `lib/ai.ts`) with an Ollama fallback (`lib/ollama.ts`) toggled by `AI_PROVIDER=ollama`; used for CV skill extraction (`lib/skills.ts`) and skill-test question generation (`lib/testGenerator.ts`)
- PDF parsing via `unpdf` (`lib/pdf.ts`), Excel export via `exceljs` (`lib/exportTeamGoalsExcel.ts`), email via `nodemailer` (`lib/mailer.ts`)

## Folder Structure

- `app/(auth)/` — login, register, forgot/reset password, verify-email pages, each with a co-located `_components/` form
- `app/(dashboard)/` — feature areas, each split into a personal view and a `team/` view for managers: `certifications/`, `goals/`, `projects/`, `sessions/`, `tests/`, plus `team/` (roster/overview) and `profile/`
- `app/_components/` — app-wide shared components (sidebar, header nav, analytics section)
- `app/api/` — route handlers mirroring the dashboard features (`auth/`, `certifications/`, `goals/`, `profile/`, `projects/`, `sessions/`, `team/`, `tests/`); nested `team/` routes act on another user's data for RM-role access
- `app/generated/prisma/` — Prisma Client output (generated, do not hand-edit; regenerate via `prisma generate` / `npx prisma migrate dev`)
- `components/ui/` — vendored shadcn/ui primitives (see guidelines below)
- `components/` (root) — app-specific shared components (`auth-card`, `form-field`, `meter`, `page-header`, `skill-rows-editor`, `stat-tile`, `team-pill`)
- `lib/` — server/shared logic: `prisma.ts` (client singleton), `session.ts` (JWT issue/verify/refresh), `rbac.ts` (role guards), `ai.ts`/`anthropic.ts`/`ollama.ts` (LLM calls), `skills.ts` (CV parsing), `testGenerator.ts`, `analytics.ts` (skill/test breakdown), `api.ts` (server-side same-origin fetch helper), `mailer.ts`, `pdf.ts`, `exportTeamGoalsExcel.ts`, `validation.ts`, `userSkills.ts`, `theme.ts` (client dark-mode store), `utils.ts` (`cn` helper)
- `hooks/` — client hooks (`use-mobile`)
- `prisma/` — `schema.prisma` and `migrations/`
- `proxy.ts` — edge middleware auth guard (login/session redirect logic)

## Data Model (prisma/schema.prisma)

- `User` (role: `RM` | `TEAM_MEMBER`, self-referential `managerId`/`reports`) is the hub for `UserSkill`, `ProjectAssignment`, `Goal` (owned + assigned), `Certification` (owned + assigned), `InternalSession` (created + presented), `OrganisationalSessionAttendance`, and `Test`
- `Test` → `Question[]`, optionally linked to a `Goal`
- Enums: `ExpertiseLevel`, `Role`, `GoalType`, `GoalStatus`, `CertStatus`

## APIs (app/api/**)

- `auth/` — `login`, `logout`, `register`, `me`, `forgot-password`, `reset-password`, `verify-email`
- `certifications/`, `goals/[goalId]/updates`, `profile`, `projects/[assignmentId]`, `sessions/attendance`, `sessions/internal[/[sessionId]/deliver]`, `tests/[testId][/submit]` — personal CRUD for the logged-in user
- `team/` — RM-only views over reports: `team/[userId]/projects`, `team/[userId]/skills`, `team/certifications`, `team/goals`, `team/projects`, `team/search`, `team/sessions[/attendance]`, `team/sessions/[sessionId]/assign`, `team/tests`

## Env Vars (.env)

`DATABASE_URL`, `SESSION_SECRET`, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`, `APP_URL`, `ANTHROPIC_API_KEY`, `AI_PROVIDER` (`anthropic` default | `ollama`), `OLLAMA_MODEL`

## Package-Specific Guidelines

<!-- guidelines:shadcn -->
### shadcn/ui

- Components under `components/ui/**` are vendored library code — don't hand-edit them; regenerate via `npx shadcn@latest add <component>` instead.
- shadcn components are exempt from the no-inline-style / lint rules that apply to the rest of the codebase.
- Never let a `shadcn init`/`add` run silently overwrite the project's `@theme` color block — verify it after every shadcn command.
