# Ambani Learn

A micro-learning platform that delivers courses through a WhatsApp-style chat interface. Designed for South African township entrepreneurs and workers, with full English/isiZulu support.

## Features

- 📱 WhatsApp-style chat learning interface
- 🤖 AI-generated bilingual lesson scripts and quizzes (English + isiZulu)
- 🎬 Inline video lessons
- 📊 Admin dashboard with participant tracking and analytics
- 📥 CSV export of participant data
- 🔒 Secure admin login, learner registration by phone number

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ambani-learn
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/keys |
| `ADMIN_EMAIL` | Your admin email address |
| `ADMIN_PASSWORD` | Your admin password |
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 (dev) or your Vercel URL |

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial.sql
   ```
3. Go to **Storage** → **New bucket** → name it `videos`, set it to **Public**
4. Create your admin user:
   - Go to **Authentication** → **Users** → **Invite user**
   - Enter your admin email and password

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — learner interface
Open [http://localhost:3000/login](http://localhost:3000/login) — admin dashboard

### 5. Seed demo data (optional)

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates the "Spaza Shop Owner Masterclass" demo course with a fully published lesson and quiz in both English and isiZulu.

---

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add -A
git commit -m "Initial deploy"
git push
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy**

### Step 3: Add environment variables

In Vercel project → **Settings** → **Environment Variables**, add all variables from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://ambani-learn.vercel.app`)

### Step 4: Redeploy

Trigger a new deployment after adding env vars (Vercel dashboard → **Deployments** → **Redeploy**).

### Step 5: Seed production data

```bash
curl -X POST https://your-app.vercel.app/api/seed
```

---

## Admin Dashboard

URL: `https://your-app.vercel.app/login`

### Creating a course

1. Log in to the admin dashboard
2. Click **+ New Course** → enter title and description
3. Inside the course, click **+ Add Module** → enter module title
4. Inside the module, click **+ Add Lesson** → enter lesson title
5. Click **Edit →** on the lesson
6. Paste your lesson content (or upload a .txt/.pdf/.docx file)
7. Optionally upload a video
8. Click **✨ Generate with AI** — this calls the Anthropic API and generates:
   - A bilingual chat script (English + isiZulu)
   - A bilingual quiz
9. Review and edit the generated content in the **Review & Publish** tab
10. Click **🚀 Publish Lesson** to make it live
11. Back on the course page, click **✅ Publish** to make the whole course visible to learners

---

## Learner URLs

- **Registration**: `https://your-app.vercel.app/register`
- **Courses**: `https://your-app.vercel.app/courses`
- **Share this link** with participants — that's all they need

---

## AI Model

The AI model is configured in one place: `lib/ai/generate.ts` (line with `const MODEL = ...`).

Currently using: `claude-sonnet-4-6`

To update: change the `MODEL` constant. Check [docs.anthropic.com](https://docs.anthropic.com) for the latest model names.

---

## Project Structure

```
app/
  (learner)/          # Learner-facing pages
    register/         # Registration
    courses/          # Course listing
    chat/[courseId]/  # WhatsApp chat interface
  (admin)/            # Admin pages
    login/            # Admin login
    dashboard/        # Dashboard (courses, participants, analytics)
  api/                # API routes (server-side only)
lib/
  ai/                 # AI generation logic and prompts
  supabase/           # Supabase clients and types
supabase/
  migrations/         # Database schema
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database + Auth + Storage**: Supabase
- **Styling**: Tailwind CSS
- **AI**: Anthropic API (claude-sonnet-4-6)
- **Deployment**: Vercel
