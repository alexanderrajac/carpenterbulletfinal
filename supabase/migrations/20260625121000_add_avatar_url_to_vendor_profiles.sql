-- Add avatar_url column to vendor_profiles table for custom workshop logos/profile photos
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;
