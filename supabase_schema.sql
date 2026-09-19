-- ============================================================================
-- SYSTEM // SELF-MASTERY OS — SUPABASE DATABASE SCHEMA & RLS SECURITY POLICIES
-- Execute this entire SQL script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================

-- 1. USER PROFILES & SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  rank_title VARCHAR(50) DEFAULT 'INITIATE',
  theme_name VARCHAR(50) DEFAULT 'cyan',
  sound_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MISSIONS & QUEST STEPS TABLE
CREATE TABLE IF NOT EXISTS public.missions (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category VARCHAR(50) DEFAULT 'TECHNICAL',
  priority VARCHAR(10) DEFAULT 'P2',
  deadline VARCHAR(20) DEFAULT '',
  start_date VARCHAR(20) DEFAULT '',
  estimated_effort VARCHAR(50) DEFAULT '',
  status VARCHAR(20) DEFAULT 'TODO',
  notes TEXT DEFAULT '',
  subtasks JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PHYSICAL PACING / FITNESS ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.fitness_activities (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'PHYSICAL',
  duration VARCHAR(50) DEFAULT '30m',
  target VARCHAR(100) DEFAULT '1 session',
  completed_today BOOLEAN DEFAULT false,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- 4. ATTENTION LOG & DISTRACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.distractions (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INTERNAL STATUS REPORTS / REFLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.reflections (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RECALIBRATION DECOMPRESSION BUFFER TABLE
CREATE TABLE IF NOT EXISTS public.decompression_entries (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CORE DIRECTIVES TABLE
CREATE TABLE IF NOT EXISTS public.core_directives (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  building TEXT DEFAULT '',
  why TEXT DEFAULT '',
  values TEXT DEFAULT '',
  direction TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACCOMPLISHMENT ARCHIVE TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'TECHNICAL',
  priority VARCHAR(10) DEFAULT 'P2',
  completed_at VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces strictly isolated access so signed-in users read/write ONLY their own records.
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decompression_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policy
CREATE POLICY "Users access own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Missions RLS Policy
CREATE POLICY "Users access own missions" ON public.missions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fitness Activities RLS Policy
CREATE POLICY "Users access own fitness" ON public.fitness_activities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Distractions RLS Policy
CREATE POLICY "Users access own distractions" ON public.distractions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reflections RLS Policy
CREATE POLICY "Users access own reflections" ON public.reflections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Decompression RLS Policy
CREATE POLICY "Users access own decompression" ON public.decompression_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Core Directives RLS Policy
CREATE POLICY "Users access own directives" ON public.core_directives
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Achievements RLS Policy
CREATE POLICY "Users access own achievements" ON public.achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
