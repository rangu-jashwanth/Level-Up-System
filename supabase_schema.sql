-- ============================================================================
-- AETHER // PERSONAL EXECUTION OPERATING SYSTEM — SUPABASE SCHEMA & RLS POLICIES
-- Execute this SQL script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================

-- 1. USER PROFILES & SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_name VARCHAR(50) DEFAULT 'cyan',
  sound_enabled BOOLEAN DEFAULT true,
  daily_focus_goal_minutes INTEGER DEFAULT 120,
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

-- 3. FOCUS SESSIONS TABLE (Real Execution Data)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id VARCHAR(100) DEFAULT '',
  mission_title TEXT DEFAULT '',
  quest_title TEXT DEFAULT '',
  duration_minutes INTEGER DEFAULT 0,
  completed_naturally BOOLEAN DEFAULT true,
  interrupted BOOLEAN DEFAULT false,
  interruption_reason TEXT DEFAULT '',
  resumed BOOLEAN DEFAULT false,
  timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DECOMPRESSION & THOUGHT LOG TABLE
CREATE TABLE IF NOT EXISTS public.decompression_entries (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  mood VARCHAR(50) DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VISION & PERSONAL DIRECTIVES TABLE
CREATE TABLE IF NOT EXISTS public.vision_directives (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  long_term_direction TEXT DEFAULT '',
  important_areas TEXT DEFAULT '',
  personal_principles TEXT DEFAULT '',
  major_goals TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DAILY REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.daily_reviews (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_str VARCHAR(20) NOT NULL,
  what_mattered TEXT DEFAULT '',
  what_happened TEXT DEFAULT '',
  what_was_completed TEXT DEFAULT '',
  what_was_interrupted TEXT DEFAULT '',
  tomorrow_changes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RECALIBRATION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.recalibration_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_reason TEXT DEFAULT '',
  action_chosen TEXT DEFAULT '',
  resumed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces strictly isolated access so signed-in users read/write ONLY their own records.
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decompression_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recalibration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own missions" ON public.missions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own focus sessions" ON public.focus_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own decompression entries" ON public.decompression_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own vision directives" ON public.vision_directives
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own daily reviews" ON public.daily_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own recalibration logs" ON public.recalibration_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

