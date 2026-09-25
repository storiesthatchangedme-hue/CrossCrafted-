/* ═══════════════════════════════════════════════════════════
   Migration: Add onboarding_complete and onboarding_draft_step
   
   These columns are required by the frontend authentication
   and onboarding flow but were missing from the original schema.
   
   Run this in Supabase SQL Editor.
   ═══════════════════════════════════════════════════════════ */

-- Add onboarding_complete column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'users'
      AND column_name  = 'onboarding_complete'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN onboarding_complete boolean DEFAULT false;
    COMMENT ON COLUMN public.users.onboarding_complete IS
      'Whether the user has completed the onboarding flow';
  END IF;
END $$;

-- Add onboarding_draft_step column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'users'
      AND column_name  = 'onboarding_draft_step'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN onboarding_draft_step integer;
    COMMENT ON COLUMN public.users.onboarding_draft_step IS
      'Last saved onboarding step (0-4), null when onboarding is complete or not started';
  END IF;
END $$;

-- Make username nullable so Google OAuth users can be created
-- with a generated username before they choose one in onboarding.
-- (Only run if username is currently NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'users'
      AND column_name  = 'username'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN username DROP NOT NULL;
  END IF;
END $$;
