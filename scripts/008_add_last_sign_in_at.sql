-- Adds last_sign_in_at column to profiles to track last access/auth time
-- Safe to run multiple times due to IF NOT EXISTS

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

-- Optional: index if you plan to query/filter/sort by this column frequently
-- CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in_at ON public.profiles (last_sign_in_at DESC);