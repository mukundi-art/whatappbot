-- Ambani Learn — idempotent schema (safe to re-run)
-- Run this in Supabase SQL Editor. Tables that already exist are skipped.

create extension if not exists "uuid-ossp";

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.learners (
  id            uuid default uuid_generate_v4() primary key,
  full_name     text not null,
  phone         text unique not null,
  email         text,
  language_pref text default 'en' check (language_pref in ('en', 'zu')),
  created_at    timestamptz default now()
);

create table if not exists public.courses (
  id          uuid default uuid_generate_v4() primary key,
  title       text not null,
  description text,
  cover_url   text,
  status      text default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz default now()
);

create table if not exists public.modules (
  id         uuid default uuid_generate_v4() primary key,
  course_id  uuid references public.courses(id) on delete cascade not null,
  title      text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists modules_course_id_idx on public.modules(course_id);

create table if not exists public.lessons (
  id          uuid default uuid_generate_v4() primary key,
  module_id   uuid references public.modules(id) on delete cascade not null,
  title       text not null,
  source_text text,
  video_url   text,
  sort_order  int default 0,
  status      text default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz default now()
);

create index if not exists lessons_module_id_idx on public.lessons(module_id);

create table if not exists public.lesson_content (
  id          uuid default uuid_generate_v4() primary key,
  lesson_id   uuid references public.lessons(id) on delete cascade not null,
  language    text not null check (language in ('en', 'zu')),
  chat_script jsonb not null default '[]',
  created_at  timestamptz default now(),
  unique(lesson_id, language)
);

create table if not exists public.quizzes (
  id         uuid default uuid_generate_v4() primary key,
  lesson_id  uuid references public.lessons(id) on delete cascade not null,
  language   text not null check (language in ('en', 'zu')),
  questions  jsonb not null default '[]',
  created_at timestamptz default now(),
  unique(lesson_id, language)
);

create table if not exists public.enrollments (
  id          uuid default uuid_generate_v4() primary key,
  learner_id  uuid references public.learners(id) on delete cascade not null,
  course_id   uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(learner_id, course_id)
);

create index if not exists enrollments_learner_id_idx on public.enrollments(learner_id);
create index if not exists enrollments_course_id_idx  on public.enrollments(course_id);

create table if not exists public.progress (
  id            uuid default uuid_generate_v4() primary key,
  learner_id    uuid references public.learners(id) on delete cascade not null,
  lesson_id     uuid references public.lessons(id) on delete cascade not null,
  video_watched boolean default false,
  viewed_at     timestamptz default now(),
  unique(learner_id, lesson_id)
);

create index if not exists progress_learner_id_idx on public.progress(learner_id);

create table if not exists public.quiz_attempts (
  id           uuid default uuid_generate_v4() primary key,
  learner_id   uuid references public.learners(id) on delete cascade not null,
  quiz_id      uuid references public.quizzes(id) on delete cascade not null,
  answers      jsonb not null default '[]',
  score        int default 0,
  total        int default 0,
  completed_at timestamptz default now()
);

create index if not exists quiz_attempts_learner_id_idx on public.quiz_attempts(learner_id);
create index if not exists quiz_attempts_quiz_id_idx    on public.quiz_attempts(quiz_id);

-- ─── Enable Row Level Security ───────────────────────────────────────────────

alter table public.learners      enable row level security;
alter table public.courses       enable row level security;
alter table public.modules       enable row level security;
alter table public.lessons       enable row level security;
alter table public.lesson_content enable row level security;
alter table public.quizzes       enable row level security;
alter table public.enrollments   enable row level security;
alter table public.progress      enable row level security;
alter table public.quiz_attempts enable row level security;

-- ─── Drop existing policies (so re-running this is safe) ─────────────────────

do $$ declare
  r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ─── Learners ────────────────────────────────────────────────────────────────
create policy "learners_insert" on public.learners for insert with check (true);
create policy "learners_select" on public.learners for select using (true);
create policy "learners_update" on public.learners for update using (true);

-- ─── Courses ─────────────────────────────────────────────────────────────────
create policy "courses_select_published" on public.courses
  for select using (status = 'published');
create policy "courses_service_all" on public.courses
  for all using (auth.role() = 'service_role');

-- ─── Modules ─────────────────────────────────────────────────────────────────
create policy "modules_select"      on public.modules for select using (true);
create policy "modules_service_all" on public.modules for all using (auth.role() = 'service_role');

-- ─── Lessons ─────────────────────────────────────────────────────────────────
create policy "lessons_select"      on public.lessons for select using (true);
create policy "lessons_service_all" on public.lessons for all using (auth.role() = 'service_role');

-- ─── Lesson content ──────────────────────────────────────────────────────────
create policy "lesson_content_select"      on public.lesson_content for select using (true);
create policy "lesson_content_service_all" on public.lesson_content for all using (auth.role() = 'service_role');

-- ─── Quizzes ─────────────────────────────────────────────────────────────────
create policy "quizzes_select"      on public.quizzes for select using (true);
create policy "quizzes_service_all" on public.quizzes for all using (auth.role() = 'service_role');

-- ─── Enrollments ─────────────────────────────────────────────────────────────
create policy "enrollments_insert" on public.enrollments for insert with check (true);
create policy "enrollments_select" on public.enrollments for select using (true);

-- ─── Progress ────────────────────────────────────────────────────────────────
create policy "progress_insert" on public.progress for insert with check (true);
create policy "progress_update" on public.progress for update using (true);
create policy "progress_select" on public.progress for select using (true);

-- ─── Quiz attempts ───────────────────────────────────────────────────────────
create policy "quiz_attempts_insert" on public.quiz_attempts for insert with check (true);
create policy "quiz_attempts_select" on public.quiz_attempts for select using (true);
