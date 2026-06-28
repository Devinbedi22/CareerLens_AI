# CareerLensAI — Project Documentation

This document provides a comprehensive reference for developers new to the project. It describes architecture, authentication, database schema, API routes, server-side AI workflows, background jobs, utilities, hooks, UI components, configuration, and developer workflows.

---

## Contents
- Overview
- Architecture Diagram
- Authentication Flow
- Database Schema (Prisma)
- API & Server Actions (endpoints + exported server functions)
- AI Workflows and prompts
- Background jobs (Inngest)
- Libraries & Utilities (lib/)
- UI Components (components/)
- Hooks (hooks/)
- Middleware
- Configuration & Environment
- Local development & deployment
- Where to start (onboarding for a new dev)

---

## Overview

CareerLensAI is a Next.js 15 App Router application providing AI-powered career tools:
- Resume builder and ATS analysis
- AI-generated cover letters
- Job role recommendations
- Interview quizzes and voice interview simulation
- Industry insights refreshed via scheduled jobs

Core technologies: Next.js (App Router), React 19, Clerk (auth), Prisma (Postgres), Google Gemini (@google/genai`), Inngest (workflows), pdf-parse, Tailwind CSS.

---

## Architecture (High-level)

```mermaid
flowchart LR
  subgraph Browser
    A[React UI - App Router pages] -->|fetch / server actions| B[Next.js Server]
  end

  B --> C[Clerk (Auth)]
  B --> D[Prisma Client]
  B --> E[Google Gemini API]
  B --> F[Inngest (cron + functions)]
  D --> G[(PostgreSQL)]
  F --> E
  F --> D
```

Explanation:
- The frontend imports server actions (files in `actions/`) to perform business logic server-side.
- Authentication handled by Clerk; server-side id from `@clerk/nextjs/server` is used to map to a `User` record in Postgres via Prisma.
- AI calls are made to Gemini through `@google/genai` wrappers in server actions, authenticated with `GEMINI_API_KEY`.
- Inngest performs scheduled industry-insight generation and writes back to the database.

---

## Authentication Flow

1. Clerk handles frontend sign-in/sign-up (ClerkProvider in `app/layout.js` and `app/(auth)/layout.js`).
2. `middleware.js` (Clerk middleware) protects app routes: `/dashboard`, `/resume`, `/interview`, `/ai-cover-letter`, `/onboarding`.
3. On server side, server actions call `auth()` or `currentUser()` from `@clerk/nextjs/server` to get `userId`.
4. `lib/checkUser.js` maps Clerk user to the `User` table (creating a DB user if missing).
5. Many server actions use a helper `getAuthenticatedUser()` (inside each actions file) which throws if unauthenticated and loads DB user via `clerkUserId`.

Security notes:
- Always use server-side `auth()` in server actions; do not rely solely on client-provided tokens.
- The middleware redirects unauthenticated visitors to Clerk sign-in.

---

## Database Schema (Prisma)

File: [prisma/schema.prisma](prisma/schema.prisma)

Models:
- `User` — core user profile.
  - `id` (UUID), `clerkUserId` (unique, maps to Clerk), `email`, `name`, `imageUrl`, `industry`, `bio`, `experience`, `skills` (String[]), relations to `Resume`, `Assessment`, `CoverLetter`, `IndustryInsight`.

- `Resume` — one-to-one with `User` via `userId`.
  - Fields: `content` (markdown text), `atsScore`, `feedback`, timestamps.

- `CoverLetter` — many per user.
  - Fields: `content`, `jobDescription`, `companyName`, `jobTitle`, `status` (draft|completed), timestamps.

- `Assessment` — quizzes, mock interviews, voice interview results.
  - Fields: `quizScore`, `questions` (JSON array), `category`, `improvementTip`.

- `IndustryInsight` — cached industry-level AI data.
  - Fields: `industry` (unique key), `salaryRanges` (JSON[]), `growthRate`, `demandLevel` (enum `HIGH|MEDIUM|LOW`), `topSkills`, `marketOutlook` (enum), `keyTrends`, `recommendedSkills`, `nextUpdate`.

Relations & constraints:
- `User.industryInsight` references `IndustryInsight.industry` (string relation used to associate cached insights with users in same industry).

Operational notes:
- Prisma client is instantiated in `lib/prisma.js`. In development it uses `globalThis.prisma` to reuse the client between hot reloads.

---

## API Routes

- `POST /api/resume/scan` — `app/api/resume/scan/route.js`
  - Accepts `multipart/form-data` with a `pdf` File field.
  - Uses `pdf-parse` to extract text, then calls `scanResumePdf(text)` server action to analyze, save, and return ATS results.

- `GET/POST/PUT /api/inngest` — `app/api/inngest/route.js`
  - Inngest webhook endpoint used to trigger Inngest functions. Wiring uses `inngest/next` serve helper.

Note: Many pages call server actions directly (files in `actions/`) rather than exposing additional REST endpoints.

---

## Server Actions (actions/)

All files under `actions/` are server modules (`"use server"` in many files). They are intended to be imported into page components and run on the server.

Summary of main action files and exported functions:

- `actions/cover-letter.js`
  - `generateCoverLetter(data)` — Generates a personalized cover letter using Gemini. Rate-limited (daily limit). Creates a DB placeholder then updates when AI returns content.
  - `getCoverLetters()` — returns user's cover letters ordered by `createdAt` desc.
  - `getCoverLetter(id)`, `deleteCoverLetter(id)` — helpers to view / delete.

- `actions/resume.js`
  - `saveResume(content)` — upserts resume content for authenticated user and calls `revalidatePath('/resume')`.
  - `getResume()` — returns user's resume record.
  - `scanResumePdf(pdfText)` — analyzes extracted PDF text via Gemini (`analyzeResumeText` internal), writes results to Resume record and returns ATS analysis and suggestions.
  - `improveWithAI({ current, type })` — improves a resume section (summary/experience/skill/project/education) via Gemini prompt.
  - `matchResumeToJobDescription({ resumeText, jobDescription })` — computes vector similarity, then asks Gemini for human-readable feedback; returns matchScore, matched/missing keywords, and AI feedback.
  - `analyzeResume()` — analyze saved resume content via Gemini and return JSON with `score`, `strengths`, `improvements`, etc.
  - `deleteResume()` — delete resume record.

- `actions/dashboard.js`
  - `getJobRecommendations()` — computes role recommendations using `lib/recommendation-engine`, then calls Gemini to get per-role explanations.
  - `getIndustryInsights()` — returns cached IndustryInsight for the user (or generates & writes new insights if stale).
  - `generateAIInsights(industry)` — calls Gemini to build industry-level JSON insights (salaryRanges, topSkills, etc.). Used both by `getIndustryInsights` and Inngest.
  - `refreshIndustryInsights()` — explicit refresh to force update.

- `actions/user.js`
  - `updateUser(data)` — normalizes skills, ensures an `IndustryInsight` exists (creates a basic record and attempts non-blocking AI generation), then upserts the `User` profile.
  - `getUserOnboardingStatus()` — returns `{ isOnboarded }` based on presence of `industry`.

- `actions/interview.js`
  - `generateMockInterview()` — generates 7 JSON interview questions via Gemini tailored to user profile/resume.
  - `evaluateMockInterviewAnswer(question, answer)` — uses Gemini to score and return strengths/weaknesses/improvements (JSON with `score` 0-100).
  - `saveMockInterviewSession(questions, responses)` — aggregates evaluations, computes aggregated report, and stores as `Assessment`.
  - `generateQuiz()` — generate a 10-question multiple-choice quiz via Gemini (strict JSON format requirement), rate-limited per day.
  - `saveQuizResult(questions, answers, score)` — persists quiz results and optionally asks Gemini to create an improvement tip.
  - `getAssessments()`, `getAssessmentById(id)`, `deleteAssessment(id)`, `getQuizStats()` — helpers for assessment list and stats.

- `actions/voice-interview.js`
  - `initializeVoiceInterview(companyId, difficulty, duration)` — returns initial question, profile, personalization context needed by the client.
  - `processVoiceResponse(companyId, userTranscript, conversationHistory, difficulty, currentPhase)` — main loop: attaches user transcript to history, builds a system prompt (see `lib/voice-interview-utils.js`), calls Gemini for next question JSON, validates and returns next question + reasoning.
  - `generateFinalEvaluation(companyId, conversationHistory, difficulty)` — asks Gemini to evaluate full interview and return structured scores and suggestions.
  - `saveVoiceInterviewSession(companyId, difficulty, conversationHistory, evaluation)` — saves as an `Assessment` and stores conversation JSON.
  - `getInterviewContext(companyId)` — returns personalization context for the client.

Implementation patterns to follow:
- All Gemini calls include cleaning/parsing logic to remove code fences and parse strict JSON. Errors are logged server-side and surface user-friendly messages.
- Many functions implement exponential backoff for Gemini retries.

---

## AI Workflows & Prompting

Key characteristics of AI prompts across the codebase:
- The code strictly requests JSON-only responses from Gemini (no markdown, no code fences). The server cleans the model output and attempts to parse JSON.
- Prompts include clear CRITICAL RULES sections that enumerate expected fields and value constraints (e.g., `demandLevel` must be `HIGH|MEDIUM|LOW`).
- Responses are validated against expected schema (helper `validate*` functions in each actions file).

Important files: `actions/cover-letter.js`, `actions/resume.js`, `actions/dashboard.js`, `actions/interview.js`, `actions/voice-interview.js`, `lib/inngest/functions.js`.

Prompt safety & robustness:
- Retry loops and exponential backoff are used when AI calls fail.
- Parsing errors throw clear server errors and are logged.

---

## Background Jobs (Inngest)

Files: `lib/inngest/functions.js`, `lib/inngest/client.js`, `app/api/inngest/route.js`.

- `generateIndustryInsights` (cron weekly) iterates unique industries and calls Gemini to build a validated JSON object for each industry, then upserts `IndustryInsight` records. The function is resilient: it logs failures and continues.
- `manualGenerateIndustryInsights` is an event-based test trigger.

Operational notes:
- Inngest client is created in `lib/inngest/client.js`. Confirm Inngest credentials and region are configured in environment variables when deploying.

---

## Libraries & Utilities (lib/)

- `lib/prisma.js` — Prisma client instantiation (export `db`). Reuses `globalThis.prisma` in development.
- `lib/checkUser.js` — helper to map a Clerk `currentUser()` to a DB `User` record, creating one if missing.
- `lib/helper.js` — small helpers (`entriesToMarkdown`) to help convert structured resume entries to markdown.
- `lib/utils.js` — `cn()` convenience for combining Tailwind class names using `clsx` + `tailwind-merge`.
- `lib/resume-match.js` — TF-IDF style vectorizer, cosine similarity functions, `getResumeMatchAnalysis(resumeText, jobDescription)` returns `matchScore`, `matchedKeywords`, `missingKeywords`, `keywordCoverage`.
- `lib/recommendation-engine.js` — role catalog and `getRoleRecommendations({ resumeContent, skills, experience, profile })` which uses document vectors and heuristics to return top 3 role suggestions.
- `lib/voice-interview-utils.js` — defines interviewer profiles, difficulty settings, builds personalization context, builds the Gemini system prompt for the voice interviewer, parses Gemini evaluation responses, and helper validation functions.
- `lib/inngest/*` — client and function wrappers for scheduled insight generation.

---

## UI Components (components/)

High-level components and purpose (see files for props and usage):

- `components/header.jsx` — site header and navigation.
- `components/hero.jsx` — landing page hero section.
- `components/theme-provider.jsx` — theme switcher wrapper using `next-themes`.

Design-system primitives in `components/ui/` (re-usable across app):
- `button.jsx`, `card.jsx`, `input.jsx`, `textarea.jsx`, `select.jsx`, `label.jsx`, `dialog.jsx`, `accordion.jsx`, `alert-dialog.jsx`, `badge.jsx`, `progress.jsx`, `radio-group.jsx`, `scroll-area.jsx`, `skeleton.jsx`, `sonner.jsx` (toast wrapper), `tabs.jsx`, `dropdown-menu.jsx`.

Page-specific components (under `app/(main)`):
- Resume builder: `app/(main)/resume/_components/resume-builder.jsx`, `entry-form.jsx` — editor UI that calls server actions like `saveResume`, `improveWithAI` and `scanResumePdf`.
- Dashboard view: `app/(main)/dashboard/_components/dashboard-view.jsx` — charts and job recommendations (uses `actions/dashboard.js`).
- Cover letter components: `cover-letter-list.jsx`, `cover-letter-generator.jsx`, `cover-letter-preview.jsx` — UI around `actions/cover-letter.js` functions.
- Interview UI: quiz, performance charts, stats cards — components under `app/(main)/interview/_components`.
- Voice interviewer components: interactive recorder, transcript display, interviewer avatar and conversation canvas under `app/(main)/voice-interview/_components`.

UI pattern:
- Prefer `components/ui/*` primitives for consistent styling and accessibility.

---

## Hooks

- `hooks/use-fetch.js` — lightweight data fetching hook used by client components (e.g., for polling or fetching non-critical data).
- `hooks/use-voice-interview.js` — client hook that manages microphone capture, streaming, speech-to-text handling (if implemented), and conversation state to drive voice interview UI.

When adding hooks: keep them focused and testable; avoid embedding heavy business logic — use server actions for business rules.

---

## Middleware

- `middleware.js` — applies Clerk middleware and route matcher to protect authenticated routes. It uses `createRouteMatcher` to define protected patterns and calls `redirectToSignIn()` when needed.

Important:
- Middleware runs on every request matching the `config.matcher`. It intentionally skips static assets and Next internals.

---

## Configuration & Environment

Key files:
- `package.json` — scripts: `dev`, `build`, `start`, `lint`, `postinstall` (runs `prisma generate`).
- `next.config.mjs` — image remote patterns (e.g., `randomuser.me`).
- `tailwind.config.mjs`, `postcss.config.mjs` — styling setup.

Required environment variables (minimum):
- `DATABASE_URL` — Postgres connection string (Prisma).
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk.
- `GEMINI_API_KEY` — Google Gemini key used by `@google/genai`.
- Clerk redirect URLs: `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`.

Optional/operational variables depending on deployment (Inngest keys, regions, etc.) should be checked in `lib/inngest/client.js` and Inngest dashboard.

---

## Local development

1. Create `.env` with required variables.
2. Install: `npm install`.
3. Generate Prisma client: `npm run postinstall` (runs `prisma generate`).
4. Run migrations when schema changes: `npx prisma migrate dev`.
5. Start dev server: `npm run dev` (Next will run on `http://localhost:3000`).

Testing AI locally:
- Gemini API credentials must be present. Consider using smaller test prompts or mock responses to develop without exhausting tokens.
- Inngest functions can be tested with the `manualGenerateIndustryInsights` event trigger.

---

## Where to start as a new developer

1. Read this file and run the app locally.
2. Sign in via Clerk and create a profile (Onboarding screen) to populate `User.industry`.
3. Inspect `actions/*` to understand business flows; start with `actions/cover-letter.js` and `actions/resume.js` for AI integration examples.
4. Look at `lib/voice-interview-utils.js` for the model prompt strategy and `lib/resume-match.js` for vector matching code.
5. Check Inngest dashboard and `lib/inngest/functions.js` to understand scheduled insights generation.

---

## Troubleshooting & Tips

- AI JSON parsing errors: check logs for returned content. The code strips triple-backticks and attempts to parse JSON; if Gemini returns commentary, generation fails. Update prompts to be stricter when necessary.
- Prisma connection issues: ensure `DATABASE_URL` is valid. Reuse of Prisma client in `lib/prisma.js` avoids connection exhaustion in development.
- Authentication: if users exist in Clerk but not in DB, `lib/checkUser.js` creates DB users on first request.

---

If you want, I can:
- Generate a per-file reference with function signatures and short descriptions for every file in the repo (I can dump as JSON or a long markdown table).
- Add a CONTRIBUTING.md or developer quickstart with exact scripts and debugging commands.

---

Created by GitHub Copilot (GPT-5 mini)
