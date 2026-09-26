-- ═══════════════════════════════════════════════════════════
-- Fix: Ensure all required columns exist and refresh schema cache
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Add onboarding_complete if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE public.users ADD COLUMN onboarding_complete boolean DEFAULT false;
  END IF;
END $$;

-- 2. Add onboarding_draft_step if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'onboarding_draft_step'
  ) THEN
    ALTER TABLE public.users ADD COLUMN onboarding_draft_step integer;
  END IF;
END $$;

-- 3. Add completed_safe_intro if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'completed_safe_intro'
  ) THEN
    ALTER TABLE public.users ADD COLUMN completed_safe_intro boolean DEFAULT false;
  END IF;
END $$;

-- 4. Add saved_events if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'saved_events'
  ) THEN
    ALTER TABLE public.users ADD COLUMN saved_events text[] DEFAULT '{}';
  END IF;
END $$;

-- 5. Add saved_posts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'saved_posts'
  ) THEN
    ALTER TABLE public.users ADD COLUMN saved_posts text[] DEFAULT '{}';
  END IF;
END $$;

-- 6. Make username nullable (Google OAuth users get auto-generated username)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;
  END IF;
END $$;

-- 7. Make name nullable (Google OAuth may not provide name immediately)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- 8. Force schema cache reload by commenting on the table
COMMENT ON TABLE public.users IS 'CrossCrafted users - schema cache refreshed';

-- 9. Verify - this should show all the columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
