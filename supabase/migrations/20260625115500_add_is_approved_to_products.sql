-- Add is_approved column to products table for admin verification
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Update existing products to be approved by default
UPDATE public.products SET is_approved = true WHERE is_approved = false;
