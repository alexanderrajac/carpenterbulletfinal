-- Add Customizations and SEO Keywords to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_keywords TEXT DEFAULT '';

-- Add Customizations to order_items to track what the user selected
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '[]'::jsonb;
