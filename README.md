# NextStep AI

NextStep AI is a modern AI-powered career guidance platform built with Next.js. It delivers personalized resume building, cover letter generation, interview preparation, and industry insights through a mix of server-side AI workflows, authenticated user sessions, and database-backed user profiles.

## 🚀 What this project does

- Authenticates users with Clerk.
- Stores user profiles, resumes, cover letters, interview assessments, and industry insights in PostgreSQL via Prisma.
- Generates AI-driven cover letters, career recommendations, and market insights using Google Gemini.
- Parses uploaded PDF resumes for text extraction and intelligent resume analysis.
- Uses a modular Next.js App Router structure for authenticated and main application flows.
- Supports scheduled industry insight updates with Inngest.

## 🧱 Architecture

### Frontend

- Next.js 15 App Router (`app/` directory)
- React 19 components
- Tailwind CSS for styling
- `app/layout.js` configures global layout, Clerk auth provider, theme provider, and shared header/footer
- `components/ui/` contains reusable UI primitives for buttons, cards, dialogs, forms, and more
- `app/(auth)/` handles sign-in and sign-up pages
- `app/(main)/` contains the authenticated app experience:
  - dashboard
  - onboarding
  - resume builder
  - AI cover letter generator
  - interview practice
  - voice interview

### Backend

- Next.js API routes under `app/api/`
- Server actions in `actions/` for business logic
- `lib/prisma.js` to instantiate Prisma client
- Clerk server auth in `@clerk/nextjs/server`
- `app/api/resume/scan/route.js` for resume PDF upload and parsing
- `lib/inngest/functions.js` for scheduled industry insight generation

### Data & Persistence

- Prisma ORM with PostgreSQL datasource
- Models in `prisma/schema.prisma`:
  - `User`
  - `Resume`
  - `CoverLetter`
  - `Assessment`
  - `IndustryInsight`
- Industry data cached for up to 7 days and refreshed automatically by Inngest cron jobs

### AI Workflows

- AI cover letter generation in `actions/cover-letter.js`
- AI dashboard recommendations and insight creation in `actions/dashboard.js`
- Resume editing and job match analysis in `actions/resume.js`
- Resume PDF text extraction using `pdf-parse`
- Google Gemini integration via `@google/genai` using `GEMINI_API_KEY`

## 🧪 Tech stack

- `next` v15
- `react` v19
- `tailwindcss`
- `prisma` + `@prisma/client`
- `@clerk/nextjs` for authentication
- `@google/genai` for Gemini with `GEMINI_API_KEY`
- `inngest` for scheduled workflow orchestration
- `pdf-parse` for resume PDF parsing
- `recharts` for analytics visualizations
- `react-hook-form` + `zod` for forms and validation
- `sonner` for toast notifications
- `lucide-react` icons
- `@radix-ui` primitives for accessible UI components

## 📁 Key folders and files

- `app/` — Next.js App Router pages and layouts
- `app/api/` — API routes
- `actions/` — server-side logic for cover letters, resume management, dashboards, and more
- `components/` — shared UI and page components
- `components/ui/` — reusable design system components
- `lib/` — helpers, Prisma client, auth and Inngest utilities
- `prisma/` — database schema and migrations
- `data/` — static marketing content, industry lists, FAQ, feature cards
- `public/` — static assets

## ✨ Main features

### Authentication & onboarding

- Clerk-based sign-in and sign-up flows
- Automatic user creation in the database after authentication
- Onboarding form to capture industry, experience, skills, and profile data

### Resume experience

- Save and persist resume content
- Upload PDF resumes for text extraction and analysis
- Match resume against job descriptions
- Use AI to generate resume writing recommendations

### AI cover letter generation

- Create personalized cover letters based on user profile and job description
- Enforce daily generation limits
- Persist cover letters in the database
- View, delete, and manage generated cover letters

### Career dashboard

- Job role recommendations based on resume content and skills
- AI-generated explanations for why each role is recommended
- Industry outlook, salary ranges, demand, and top skills

### Interview preparation

- Adaptive interview practice flows and analytics
- Performance tracking with charts and improvement tips
- Voice interview features for more realistic preparation

## ⚙️ Environment variables

Create a `.env` file with the following values:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
GEMINI_API_KEY=
```

## 🚀 Local development

Install dependencies:

```bash
npm install
```

Generate Prisma client after install (runs automatically via `postinstall`):

```bash
npm run postinstall
```

Run the app:

```bash
npm run dev
```

Open the app at `http://localhost:3000`

## 🧩 Notes

- This project is optimized for server-side AI workflows and authenticated state via Clerk.
- Industry insights are refreshed automatically through Inngest scheduled jobs.
- The system stores rich user profiles and career assets to deliver tailored recommendations.

## 📦 Deployment

- Build using `npm run build`
- Start with `npm start`
- Deploy to any platform supporting Next.js, such as Vercel, Railway, or Fly.io

## 💡 Tips for contributors

- Keep AI prompt structure and JSON validation rules intact when updating `actions/`.
- Preserve Clerk auth flow and user profile creation in `lib/checkUser.js`.
- Use the `components/ui/` primitives for consistent look and feel across pages.
- Update Prisma schema and run `npx prisma migrate dev` if the database model changes.

---

Made with Next.js, Clerk, Prisma, and Gemini AI.
