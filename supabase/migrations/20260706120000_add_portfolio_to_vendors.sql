-- Migration: Add portfolio_images column to vendor_profiles
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] DEFAULT '{}';
