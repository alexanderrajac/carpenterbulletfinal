/**
 * Blog & Vlog System Data Layer & SEO Engine for CarpenterBullet
 * Supports written guides, video vlogs, carpenter profiles, local SEO metadata,
 * and JSON-LD schema generation for Google #1 Ranking.
 */

import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  videoUrl?: string; // YouTube, Vimeo, or MP4 URL for Vlogs
  isVlog: boolean;
  category: "Wood Care" | "Modular Kitchen" | "Teak & Timber" | "Door Repair" | "Villupuram Local Tips" | "Custom Furniture" | "Interior Design";
  authorName: string;
  authorRole: string;
  carpenterId?: string;
  villupuramLocation?: string; // e.g., "Villupuram Town", "Tindivanam", "Gingee", "Mailam", "Vikravandi"
  featuredImage: string;
  tags: string[];
  views: number;
  likes: number;
  publishedAt: string;
  readTime: string;
  isFeatured: boolean;
  status: "published" | "draft" | "pending";
  metaTitle?: string;
  metaDescription?: string;
}

const STORAGE_KEY = "cb_carpenter_blogs_v2";

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-1",
    title: "No. 1 Carpenter Guide: Best Teak Wood Door & Frame Installation in Villupuram",
    slug: "no-1-carpenter-guide-teak-wood-door-installation-villupuram",
    summary: "Complete step-by-step wood door fitting guide by Villupuram's master carpenters. Learn key door frame measurements, wood polish secrets, and anti-termite treatment.",
    content: `
### Why Quality Teak Wood Fitting Matters in Villupuram District

Villupuram district has a rich architectural heritage, ranging from traditional village thinnai houses in Gingee and Tindivanam to modern interior homes along East Pondy Road and Salamedu in Villupuram Town. High humidity during coastal monsoons near Marakkanam and Kottakuppam makes proper timber selection and precision framing mandatory.

#### 1. Choosing the Right Grade Teak
- **First-Quality Burma Teak**: Best for front entrance double doors. Highly resistant to warping.
- **Nilambur Teak**: Excellent grain pattern for living room partition doors and pooja room mandapams.
- **CP Teak (Central Province)**: Cost-effective timber for internal bedroom doors in Tindivanam and Vikravandi apartments.

#### 2. Termite & Weather Protection
Always ensure oil-based anti-termite primer (Solignum or Wood Guard) is applied to all four back edges of the door frame before embedding in cement mortar.

#### 3. Precision Lock & Hinge Fitting
Use stainless steel 304 grade 4-inch bearing hinges for heavy solid teak doors. Standard brass hinges tend to sag over 3-5 years under Villupuram heat conditions.

> **Need expert door installation in Villupuram town, Tindivanam, Gingee, or Mailam?** Book a verified master carpenter directly through CarpenterBullet with instant door-step delivery and transparent rate cards!
    `,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    isVlog: true,
    category: "Door Repair",
    authorName: "Master Arumugam Achari",
    authorRole: "Head Artisan Carpenter, Villupuram",
    carpenterId: "carp-vpm-01",
    villupuramLocation: "Villupuram Town (East Pondy Rd)",
    featuredImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop",
    tags: ["Villupuram Carpenter", "Teak Wood Door", "Door Frame Fitting", "Local SEO Villupuram", "Anti-Termite"],
    views: 3420,
    likes: 289,
    publishedAt: "2026-08-15",
    readTime: "6 min read",
    isFeatured: true,
    status: "published",
    metaTitle: "No. 1 Carpenter in Villupuram | Teak Wood Door Fitting Guide & Rates",
    metaDescription: "Looking for the No. 1 Carpenter in Villupuram district? Learn expert door installation techniques, timber prices in Tindivanam & Gingee, and book verified local artisans."
  },
  {
    id: "blog-2",
    title: "Vlog: Custom Modular Kitchen Wardrobe Design in Tindivanam & Vikravandi",
    slug: "custom-modular-kitchen-wardrobe-vlog-tindivanam-vikravandi",
    summary: "Watch master carpenter Murugan assemble waterproof BWP plywood kitchen cupboards with hydraulic Soft-Close hinges in Tindivanam.",
    content: `
### Step-by-Step Modular Kitchen Construction in Tindivanam

In this exclusive vlog, Carpenter Murugan demonstrates how to manufacture 710 grade Boiling Water Proof (BWP) plywood cabinets fitted with Merino high-gloss laminate sheets.

#### Key Highlights from the Workshop:
1. **Plywood Grade Selection**: 100% Gurjan core plywood used for sink cabinets to prevent water swelling.
2. **Auto-Hinge Alignment**: 3D adjustable soft-close clip-on hinges from Ebco and Hettich.
3. **Aluminum G-Profile Handles**: Sleek seamless handles popular in new house builds across Tindivanam, Vikravandi, and Olakkur.

Watch the full video walkthrough above to see live cut-to-size precision edging and installation tips!
    `,
    videoUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    isVlog: true,
    category: "Modular Kitchen",
    authorName: "Murugan Woodworks",
    authorRole: "Modular Specialist, Tindivanam",
    carpenterId: "carp-tnd-02",
    villupuramLocation: "Tindivanam",
    featuredImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop",
    tags: ["Tindivanam Carpenter", "Modular Kitchen", "BWP Plywood", "Cupboard Fitting", "Villupuram District"],
    views: 2890,
    likes: 215,
    publishedAt: "2026-08-18",
    readTime: "4 min watch",
    isFeatured: true,
    status: "published",
    metaTitle: "Modular Kitchen Carpenter in Tindivanam & Vikravandi | Wood Vlog & Price",
    metaDescription: "Watch Tindivanam's leading carpenter build custom BWP plywood modular kitchen cabinets. Get free doorstep measurement quotes across Villupuram district."
  },
  {
    id: "blog-3",
    title: "How to Maintain Solid Teak & Rosewood Furniture in Tamil Nadu Coastal Climate",
    slug: "maintain-solid-teak-rosewood-furniture-tamil-nadu-climate",
    summary: "Essential wood polishing and conditioning tips to protect wooden cots, dining tables, and sofas from dust, moisture, and fading.",
    content: `
### Preserving Heirloom Wood Furniture in Heat & Humidity

Solid wood furniture is an investment intended to last generations. However, fluctuating temperatures in Tamil Nadu can cause natural wood movement, expansion, or micro-surface dullness.

#### Top Maintenance Tips:
- **Beeswax & Linseed Oil Polish**: Apply natural beeswax once every 6 months to nourish the timber grain. Avoid harsh chemical ammonia sprays.
- **Direct Sunlight Shielding**: Position teak cots away from raw noon sun to prevent UV bleaching.
- **Scratch Repair**: For light scratches on dark Rosewood or Walnut finish, rub a raw walnut shell or polyurethane touch-up marker along the grain.

Follow these simple rules to keep your furniture shining like new for decades!
    `,
    isVlog: false,
    category: "Wood Care",
    authorName: "Karthik Raja",
    authorRole: "Timber Specialist & Polisher",
    carpenterId: "carp-vpm-03",
    villupuramLocation: "Gingee",
    featuredImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop",
    tags: ["Wood Polish", "Teak Furniture Care", "Gingee Carpenters", "Furniture Repair"],
    views: 1950,
    likes: 167,
    publishedAt: "2026-08-10",
    readTime: "5 min read",
    isFeatured: false,
    status: "published",
    metaTitle: "Wood Care & Furniture Maintenance Tips | CarpenterBullet Blog",
    metaDescription: "Learn how to polish and maintain teak wood furniture, cots, and tables. Professional advice from verified South Indian master carpenters."
  },
  {
    id: "blog-4",
    title: "Vlog: Complete House Interior Woodwork Tour in Gingee & Mailam Villages",
    slug: "house-interior-woodwork-tour-gingee-mailam-villages",
    summary: "Full walk-through of a newly completed 3BHK villa interior project featuring solid teak doors, TV unit showcase, and custom wardrobes in Gingee.",
    content: `
### Complete Interior Woodwork Showcase — Gingee District

Take a tour through this magnificent 3BHK home in Gingee near the Fort area. Crafted using premium Teak wood facings, veneer paneling, and LED strip lighting profiles.

#### Featured Carpentry Elements:
1. **Living Room TV Wall Panel**: Fluted charcoal panels with warm LED backlighting.
2. **Master Bedroom Sliding Wardrobe**: Floor-to-ceiling 8ft high sliding door wardrobe with soft-closing sliding tracks.
3. **Pooja Room Carving**: Intricate CNC-routed teak wood doorway with brass bell inserts.

Watch the full vlog to see the craftsman techniques and final client review!
    `,
    videoUrl: "https://www.youtube.com/embed/L_LUpnjgPso",
    isVlog: true,
    category: "Interior Design",
    authorName: "Gingee Craft Works",
    authorRole: "Interior Carpenter Team",
    carpenterId: "carp-gng-04",
    villupuramLocation: "Gingee",
    featuredImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
    tags: ["Gingee Carpenter", "Mailam Woodwork", "TV Unit Design", "Teak Pooja Door", "Villupuram District"],
    views: 4120,
    likes: 380,
    publishedAt: "2026-08-20",
    readTime: "7 min watch",
    isFeatured: true,
    status: "published",
    metaTitle: "Best Interior Carpenter in Gingee & Mailam | House Woodwork Tour Vlog",
    metaDescription: "Watch custom interior woodwork tour in Gingee village. TV units, sliding wardrobes, and teak doors crafted by No. 1 local carpenters."
  }
];

export function getStoredBlogs(): BlogPost[] {
  if (typeof window === "undefined") return INITIAL_BLOG_POSTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BLOG_POSTS));
      return INITIAL_BLOG_POSTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BLOG_POSTS;
  } catch (err) {
    console.error("Error reading stored blogs:", err);
    return INITIAL_BLOG_POSTS;
  }
}

export function saveBlogsToStorage(blogs: BlogPost[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
  } catch (err) {
    console.error("Error saving blogs to storage:", err);
  }
}

export async function fetchAllBlogs(): Promise<BlogPost[]> {
  // Try fetching from local storage first (with seed fallback)
  const local = getStoredBlogs();
  try {
    // Optionally fetch from Supabase if table exists
    const { data, error } = await supabase
      .from("carpenter_blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const dbBlogs: BlogPost[] = data.map((b: any) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        summary: b.summary,
        content: b.content,
        videoUrl: b.video_url,
        isVlog: b.is_vlog,
        category: b.category,
        authorName: b.author_name,
        authorRole: b.author_role,
        carpenterId: b.carpenter_id,
        villupuramLocation: b.villupuram_location,
        featuredImage: b.featured_image,
        tags: b.tags || [],
        views: b.views || 0,
        likes: b.likes || 0,
        publishedAt: b.published_at || b.created_at,
        readTime: b.read_time || "5 min read",
        isFeatured: !!b.is_featured,
        status: b.status || "published",
        metaTitle: b.meta_title,
        metaDescription: b.meta_description,
      }));
      // Merge with local seed blogs if missing
      const merged = [...dbBlogs];
      local.forEach((l) => {
        if (!merged.some((m) => m.slug === l.slug)) {
          merged.push(l);
        }
      });
      saveBlogsToStorage(merged);
      return merged;
    }
  } catch (e) {
    console.warn("Supabase blog query skipped, returning local dataset.", e);
  }
  return local;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  const blogs = await fetchAllBlogs();
  const blog = blogs.find((b) => b.slug === slug);
  if (blog) {
    // Increment view count locally
    blog.views = (blog.views || 0) + 1;
    saveBlogsToStorage(blogs);
  }
  return blog;
}

export async function createOrUpdateBlog(post: Partial<BlogPost>): Promise<BlogPost> {
  const blogs = getStoredBlogs();
  let existingIndex = blogs.findIndex((b) => b.id === post.id || b.slug === post.slug);

  const slugified = (post.title || "carpenter-blog")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const newPost: BlogPost = {
    id: post.id || `blog-${Date.now()}`,
    title: post.title || "Untitled Carpenter Guide",
    slug: post.slug || `${slugified}-${Math.floor(Math.random() * 1000)}`,
    summary: post.summary || "",
    content: post.content || "",
    videoUrl: post.videoUrl,
    isVlog: !!post.isVlog || !!post.videoUrl,
    category: post.category || "Wood Care",
    authorName: post.authorName || "Master Carpenter",
    authorRole: post.authorRole || "Artisan",
    carpenterId: post.carpenterId,
    villupuramLocation: post.villupuramLocation || "Villupuram District",
    featuredImage:
      post.featuredImage ||
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop",
    tags: post.tags || ["Carpentry", "Villupuram"],
    views: post.views || 1,
    likes: post.likes || 0,
    publishedAt: post.publishedAt || new Date().toISOString().split("T")[0],
    readTime: post.readTime || "5 min read",
    isFeatured: !!post.isFeatured,
    status: post.status || "published",
    metaTitle: post.metaTitle || post.title,
    metaDescription: post.metaDescription || post.summary,
  };

  if (existingIndex >= 0) {
    blogs[existingIndex] = { ...blogs[existingIndex], ...newPost };
  } else {
    blogs.unshift(newPost);
  }

  saveBlogsToStorage(blogs);
  return newPost;
}

export async function deleteBlog(id: string): Promise<boolean> {
  const blogs = getStoredBlogs();
  const filtered = blogs.filter((b) => b.id !== id);
  saveBlogsToStorage(filtered);
  return true;
}

export function generateBlogJSONLD(post: BlogPost) {
  const canonicalUrl = `https://www.carpenterbullet.com/blog/${post.slug}`;
  
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": post.isVlog ? "VideoObject" : "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "image": [post.featuredImage],
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.authorName,
      "jobTitle": post.authorRole,
      "worksFor": {
        "@type": "LocalBusiness",
        "name": "CarpenterBullet — Villupuram District Carpenters",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": post.villupuramLocation || "Villupuram",
          "addressRegion": "Tamil Nadu",
          "addressCountry": "IN"
        }
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "CarpenterBullet WoodVerse",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.carpenterbullet.com/favicon.jpg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };

  if (post.isVlog && post.videoUrl) {
    (blogPostingSchema as any)["embedUrl"] = post.videoUrl;
    (blogPostingSchema as any)["thumbnailUrl"] = post.featuredImage;
    (blogPostingSchema as any)["uploadDate"] = post.publishedAt;
    (blogPostingSchema as any)["name"] = post.title;
  }

  return JSON.stringify(blogPostingSchema);
}
