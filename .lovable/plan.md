## Woodverse (CarpenterBullet) — Build Plan

A premium Apple-inspired carpentry ecommerce store. Wooden brown + emerald green palette, modern startup polish, fully responsive.

### Stack

- TanStack Start (React 19 + TS), Tailwind v4, shadcn/ui, Framer Motion
- Lovable Cloud (Supabase) for DB, auth, RLS, role-based admin
- TanStack Query for data, server functions for protected reads/writes

### Design system (src/styles.css)

- Wood tones: deep walnut `oklch(0.32 0.05 50)`, warm oak `oklch(0.62 0.08 60)`, cream parchment background `oklch(0.97 0.015 80)`
- Emerald accent: primary CTA `oklch(0.55 0.13 160)`, glow `oklch(0.68 0.14 160)`
- Typography: Fraunces (display, serif) + Inter (body) loaded via `<link>` in `__root.tsx`
- Tokens: `--gradient-wood`, `--gradient-emerald`, `--shadow-soft`, `--shadow-elevated`
- Generous whitespace, soft shadows, rounded-2xl, subtle grain texture on hero

### Database schema (migration)

- `profiles` (id ↔ auth.users, full_name, avatar_url, created_at) + trigger on signup
- `app_role` enum: `admin`, `user`
- `user_roles` (user_id, role) + `has_role()` SECURITY DEFINER function
- `categories` (id, slug, name, description, image_url)
- `products` (id, slug, name, description, price_cents, image_url, category_id, stock, featured, created_at)
- `orders` (id, user_id, total_cents, status, shipping_address jsonb, created_at)
- `order_items` (id, order_id, product_id, quantity, unit_price_cents)
- RLS: public read on categories/products; user-scoped on orders/profiles; admin write via `has_role(auth.uid(),'admin')`
- GRANTs included; seed ~12 carpentry products (chairs, tables, shelves, cutting boards, tools) across 4 categories with AI-generated images

### Routes

- `/` — Home: hero with emerald CTA, featured products, category grid, craftsmanship story
- `/shop` — Product listing with category filter, search, sort (search params via zodValidator)
- `/product/$slug` — Detail with gallery, description, add to cart
- `/cart` — Cart (zustand + localStorage persistence)
- `/checkout` — Mock checkout form → creates order row, clears cart, shows confirmation
- `/auth` — Sign in / sign up (email+password, Google OAuth via Lovable broker)
- `/_authenticated/profile` — Profile + order history
- `/_authenticated/_admin/admin` — Dashboard (stats: products, orders, revenue)
- `/_authenticated/_admin/admin/products` — Product CRUD table with create/edit dialog
- `/_authenticated/_admin/admin/orders` — Orders list with status update

### Auth & roles

- Email/password + Google sign-in (via `lovable.auth.signInWithOAuth("google")`)
- `_authenticated/route.tsx` integration-managed gate
- `_admin` pathless layout: `beforeLoad` checks role via server fn using `requireSupabaseAuth` + `has_role`
- Promote admin via SQL (first-time setup instructions shown to user)

### State & data

- `useCart` (zustand) — items, add/remove/update, totals, hydrated from localStorage
- Server fns: `listProducts`, `getProduct`, `listCategories`, `createOrder`, `listMyOrders`, admin: `upsertProduct`, `deleteProduct`, `listAllOrders`, `updateOrderStatus`
- Public reads use `supabaseAdmin` inside handler (dynamic import) to avoid RLS round-trips; admin writes use `requireSupabaseAuth` + role check

### Components

- `Navbar` (logo, search, cart badge, account menu, mobile drawer)
- `Footer`
- `ProductCard`, `ProductGrid`, `CategoryPill`, `PriceTag`
- `CartDrawer` (sheet) + `/cart` page
- `AdminSidebar` + data tables (shadcn Table)
- Framer Motion: hero fade-up, product card hover lift, page transitions

### Technical notes

- Generate hero image + ~12 product images via imagegen (fast tier) to `src/assets/`
- All colors use semantic tokens — no raw hex in components
- Form validation with zod
- SEO: per-route `head()` with title/description/og tags; product detail uses product image as og:image
- Sonner toasts for cart/order feedback
- Mobile-first responsive across every page

### Build order

1. Enable Lovable Cloud
2. Migration: tables, RLS, grants, roles, trigger, has_role
3. Design tokens + fonts + base layout (Navbar/Footer/\_\_root)
4. Generate images + seed products (insert)
5. Home, Shop, Product detail
6. Cart store + Cart/Checkout
7. Auth pages + profile + order history
8. Admin layout, dashboard, product/order management
9. Polish: motion, SEO, responsive QA
