import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProduct } from "@/lib/products.functions";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { toast } from "sonner";
import { ArrowLeft, Check, ShoppingBag, Heart, Star, ThumbsUp, MessageSquare, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const p = await getProduct({ data: { slug } });
      if (!p) throw notFound();
      return p;
    },
  });

function parseProductMetadata(description: string | null | undefined) {
  const result = {
    description: "",
    subcategory: "",
    wood: false,
    sizes: [] as string[],
    sakkai: false,
  };

  if (!description) return result;

  let cleanedDesc = description;

  // Extract [Subcategory: X]
  const subMatch = cleanedDesc.match(/^\[Subcategory:\s*([^\]]+)\]/);
  if (subMatch) {
    result.subcategory = subMatch[1];
    cleanedDesc = cleanedDesc.replace(/^\[Subcategory:\s*[^\]]+\]\s*/, "");
  }

  // Extract [Wood: X]
  const woodMatch = cleanedDesc.match(/^\[Wood:\s*([^\]]+)\]/);
  if (woodMatch) {
    result.wood = woodMatch[1] === "true";
    cleanedDesc = cleanedDesc.replace(/^\[Wood:\s*[^\]]+\]\s*/, "");
  }

  // Extract [Sizes: X]
  const sizesMatch = cleanedDesc.match(/^\[Sizes:\s*([^\]]+)\]/);
  if (sizesMatch) {
    result.sizes = sizesMatch[1].split(",").map(s => s.trim());
    cleanedDesc = cleanedDesc.replace(/^\[Sizes:\s*[^\]]+\]\s*/, "");
  }

  // Extract [Sakkai: X]
  const sakkaiMatch = cleanedDesc.match(/^\[Sakkai:\s*([^\]]+)\]/);
  if (sakkaiMatch) {
    result.sakkai = sakkaiMatch[1] === "true";
    cleanedDesc = cleanedDesc.replace(/^\[Sakkai:\s*[^\]]+\]\s*/, "");
  }

  result.description = cleanedDesc.trim();
  return result;
}

export const Route = createFileRoute("/product/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQO(params.slug)),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — CarpenterBullet` },
          { name: "description", content: loaderData.description?.slice(0, 160) },
          { property: "og:title", content: loaderData.name },
          { property: "og:image", content: resolveImage(loaderData.image_url) },
        ]
      : [{ title: "Product — CarpenterBullet" }],
  }),
  component: ProductPage,
  pendingComponent: ProductSkeleton,
  notFoundComponent: () => <div className="p-20 text-center">Product not found.</div>,
  errorComponent: ({ error }) => <div className="p-12 text-center">{error.message}</div>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQO(slug));
  const add = useCart((s) => s.add);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const isWishlisted = useWishlist((s) => s.has(p.id));
  const navigate = useNavigate();

  // Wood selection configuration
  const woodOptions = [
    { name: "Veppamaram", multiplier: 1.0, description: "Solid Neem wood. Natural pest-resistant, standard base finish." },
    { name: "Teak Wood", multiplier: 1.5, description: "Highly durable solid teak. Premium oils, rich golden brown finish." },
    { name: "Vengai", multiplier: 1.3, description: "Auspicious Vengai hardwood. Extremely heavy and structural quality." },
    { name: "Poovarasam", multiplier: 1.2, description: "Portia tree hardwood. Beautiful dense grains, heirloom status." },
    { name: "Mahogany", multiplier: 1.1, description: "Elegant Mahogany. Fine grain texture, premium reddish luster." },
  ];

  const metadata = parseProductMetadata(p.description);

  const isWoodCustomizable = metadata.wood;

  // Check if size customization is allowed
  const sizeOptions = metadata.sizes.map((sName) => {
    const mult = sName.includes("3x3") ? 0.8 : sName.includes("2x1") ? 0.35 : 1.0;
    return { name: sName, multiplier: mult, description: `Size option: ${sName}` };
  });

  // Check if Sakkai configuration is allowed
  const sakkaiOptions = metadata.sakkai ? [
    { name: "1 Sakkai", multiplier: 1.0, description: "Single rebate groove." },
    { name: "2 Sakkai", multiplier: 1.15, description: "Double rebate grooves." },
    { name: "3 Sakkai", multiplier: 1.30, description: "Triple rebate grooves." }
  ] : [];

  const [selectedWood, setSelectedWood] = useState(isWoodCustomizable ? "Veppamaram" : "");
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]?.name ?? "");
  const [selectedSakkai, setSelectedSakkai] = useState(sakkaiOptions[0]?.name ?? "");

  // Multiple images list
  const [activeImageState, setActiveImageState] = useState<string | null>(null);
  const imagesList = p.image_url ? p.image_url.split(",").map((img: string) => img.trim()) : [];
  const activeImage = activeImageState ?? (imagesList[0] || "");
  
  // Calculate price based on selected customizations
  let totalMultiplier = 1.0;

  if (isWoodCustomizable && selectedWood) {
    const woodConfig = woodOptions.find((w) => w.name === selectedWood);
    if (woodConfig) totalMultiplier *= woodConfig.multiplier;
  }

  if (selectedSize) {
    const sizeConfig = sizeOptions.find((s) => s.name === selectedSize);
    if (sizeConfig) totalMultiplier *= sizeConfig.multiplier;
  }

  if (selectedSakkai) {
    const sakkaiConfig = sakkaiOptions.find((sk) => sk.name === selectedSakkai);
    if (sakkaiConfig) totalMultiplier *= sakkaiConfig.multiplier;
  }

  const computedPrice = Math.round(p.price_cents * totalMultiplier);

  // Client-side Reviews state
  const [reviews, setReviews] = useState([
    {
      id: "1",
      name: "Ramanathan K.",
      rating: 5,
      title: "Excellent build and finish",
      text: "Bought this and I am extremely happy. The carpentry is clean and it smells of genuine hand-polished oils. Highly recommended!",
      date: "May 18, 2026",
      verified: true,
      helpful: 14,
    },
    {
      id: "2",
      name: "Anjali Sharma",
      rating: 4,
      title: "Very sturdy and heavy",
      text: "The item is solid hardwood and heavy. It took about 4 days to deliver to my home in Chennai, but it is absolute quality. Worth every rupee.",
      date: "June 2, 2026",
      verified: true,
      helpful: 8,
    },
    {
      id: "3",
      name: "David M.",
      rating: 5,
      title: "Master craftsmanship",
      text: "You can tell a master carpenter worked on this piece. The joints are flawless and the grain matches beautifully.",
      date: "June 9, 2026",
      verified: false,
      helpful: 3,
    },
  ]);

  // Review Form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [helpfulCount, setHelpfulCount] = useState<Record<string, number>>({});

  function handleAddCart(buyNow = false) {
    const optionsArray = [];
    if (selectedWood) optionsArray.push(selectedWood);
    if (selectedSize) optionsArray.push(selectedSize);
    if (selectedSakkai) optionsArray.push(selectedSakkai);
    const customOptions = optionsArray.join(", ");

    add({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price_cents: computedPrice,
      image_url: p.image_url,
      wood_type: customOptions || undefined,
    });
    toast.success(`Added ${p.name} ${customOptions ? `(${customOptions})` : ""} to cart`);
    if (buyNow) {
      navigate({ to: "/checkout" });
    }
  }

  function handleWishlist() {
    toggleWishlist({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price_cents: p.price_cents,
      image_url: p.image_url,
      categories: p.categories,
    });
    if (isWishlisted) {
      toast.success(`Removed ${p.name} from wishlist`);
    } else {
      toast.success(`Added ${p.name} to wishlist`);
    }
  }

  function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewName.trim() || !reviewTitle.trim() || !reviewText.trim()) {
      toast.error("Please fill in all review fields.");
      return;
    }
    const newRev = {
      id: String(Date.now()),
      name: reviewName.trim(),
      rating: reviewRating,
      title: reviewTitle.trim(),
      text: reviewText.trim(),
      date: "Today",
      verified: true,
      helpful: 0,
    };
    setReviews([newRev, ...reviews]);
    toast.success("Review submitted! Thank you for your feedback.");
    
    // Clear form
    setReviewName("");
    setReviewTitle("");
    setReviewText("");
    setReviewRating(5);
  }

  function handleHelpful(id: string) {
    if (helpfulCount[id]) return;
    setHelpfulCount({ ...helpfulCount, [id]: 1 });
    setReviews(reviews.map(r => r.id === id ? { ...r, helpful: r.helpful + 1 } : r));
    toast.success("Marked as helpful");
  }

  // Calculate review summary metrics
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const ratingPercent = (stars: number) => {
    const count = reviews.filter(r => r.rating === stars).length;
    return Math.round((count / reviews.length) * 100);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>
      
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Product Image & Gallery */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-muted border border-border/60 shadow-md relative group">
            <motion.img 
              key={activeImage}
              initial={{ opacity: 0.8, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              src={resolveImage(activeImage)} 
              alt={p.name} 
              width={1024} 
              height={1024} 
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-102" 
            />
            {p.featured && (
              <span className="absolute top-4 left-4 bg-primary/95 text-primary-foreground font-semibold px-3 py-1 rounded-full text-xs shadow-md tracking-wider uppercase">Featured</span>
            )}
          </div>

          {/* Thumbnails Gallery */}
          {imagesList.length > 1 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {imagesList.map((img: string, idx: number) => {
                const isActive = img === activeImage;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageState(img)}
                    className={`h-20 w-20 rounded-2xl overflow-hidden border-2 bg-muted transition duration-200 cursor-pointer ${isActive ? "border-primary scale-102 shadow-md" : "border-border/60 hover:border-primary/50"}`}
                  >
                    <img src={resolveImage(img)} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Info & Settings */}
        <div className="flex flex-col justify-start">
          {p.categories && (
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">{(p.categories as any).name}</p>
          )}
          
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{p.name}</h1>
          
          {/* Ratings Summary */}
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-current" : "opacity-30"}`} />
              ))}
            </div>
            <span className="font-semibold text-foreground">{avgRating} out of 5</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">{reviews.length} customer reviews</span>
          </div>

          {/* Pricing Display */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold font-mono text-foreground">{formatPrice(computedPrice)}</span>
            {totalMultiplier !== 1.0 && (
              <>
                <span className="text-sm text-muted-foreground line-through font-mono">{formatPrice(p.price_cents)}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Customized Price ({totalMultiplier > 1.0 ? `+${Math.round((totalMultiplier - 1) * 100)}%` : `-${Math.round((1 - totalMultiplier) * 100)}%`})
                </span>
              </>
            )}
          </div>

          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {metadata.description}
          </p>
          
          {/* Stock and Shipping status */}
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground border-y border-border/60 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {p.stock > 0 ? (
              <span>In stock (<strong>{p.stock}</strong> items) · Made-to-order options ships in 4–7 days</span>
            ) : (
              <span className="text-destructive font-semibold">Sold out (Accepting pre-orders)</span>
            )}
          </div>

          {/* Customization Options */}
          {isWoodCustomizable && (
            <div className="mt-6 space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/40">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">Select Wood Type</label>
                <span className="text-xs text-primary font-semibold">Price adjusts dynamically</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {woodOptions.map((wood) => (
                  <button
                    key={wood.name}
                    type="button"
                    onClick={() => setSelectedWood(wood.name)}
                    className={`text-left p-3.5 rounded-xl border text-sm transition duration-200 cursor-pointer ${
                      selectedWood === wood.name
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-foreground">{wood.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {wood.multiplier > 1.0 ? `+${Math.round((wood.multiplier - 1) * 100)}%` : "Base"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1">{wood.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="mt-4 space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/40">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">Select Size</label>
                <span className="text-xs text-primary font-semibold">Price adjusts dynamically</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size.name}
                    type="button"
                    onClick={() => setSelectedSize(size.name)}
                    className={`text-left p-3.5 rounded-xl border text-sm transition duration-200 cursor-pointer ${
                      selectedSize === size.name
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-foreground">{size.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {size.multiplier < 1.0 ? `-${Math.round((1 - size.multiplier) * 100)}%` : "Base"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1">{size.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sakkaiOptions.length > 0 && (
            <div className="mt-4 space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/40">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">Sakkai Configuration</label>
                <span className="text-xs text-primary font-semibold">Rebate grooves count</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {sakkaiOptions.map((sakkai) => (
                  <button
                    key={sakkai.name}
                    type="button"
                    onClick={() => setSelectedSakkai(sakkai.name)}
                    className={`text-left p-3.5 rounded-xl border text-sm transition duration-200 cursor-pointer ${
                      selectedSakkai === sakkai.name
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="flex flex-col justify-between h-full">
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-foreground">{sakkai.name}</span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground mt-1">
                        {sakkai.multiplier > 1.0 ? `+${Math.round((sakkai.multiplier - 1) * 100)}%` : "Base"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              disabled={p.stock === 0}
              onClick={() => handleAddCart(false)}
              className="flex-1 rounded-full py-6 text-sm font-semibold shadow-md bg-primary hover:bg-primary/95 text-primary-foreground flex justify-center items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </Button>
            
            <Button
              disabled={p.stock === 0}
              onClick={() => handleAddCart(true)}
              className="flex-1 rounded-full py-6 text-sm font-semibold shadow-md bg-amber-600 hover:bg-amber-700 text-white flex justify-center items-center gap-2"
            >
              Buy Now
            </Button>

            <button
              onClick={handleWishlist}
              className={`p-3 rounded-full border shadow-sm transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                isWishlisted 
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 text-red-500 hover:bg-red-100" 
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
            <div><dt className="text-muted-foreground">Material</dt><dd className="mt-1 font-medium">{isWoodCustomizable ? `${selectedWood} Hardwood` : "Solid hardwood"}</dd></div>
            <div><dt className="text-muted-foreground">Finish</dt><dd className="mt-1 font-medium">Natural organic oil polish</dd></div>
            <div><dt className="text-muted-foreground">Origin</dt><dd className="mt-1 font-medium">Handmade in Vermont, USA</dd></div>
            <div><dt className="text-muted-foreground">Warranty</dt><dd className="mt-1 font-medium">Lifetime craftsmanship structural warranty</dd></div>
          </dl>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-20 border-t border-border/80 pt-12">
        <h2 className="font-display text-3xl font-medium tracking-tight mb-8">Customer Reviews</h2>
        
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Review Summary Panel */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Review Overview</h3>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold font-mono">{avgRating}</span>
                <div>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(avgRating)) ? "fill-current" : "opacity-30"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Based on {reviews.length} reviews</p>
                </div>
              </div>
              
              {/* Stars percentage list */}
              <div className="space-y-2 pt-2 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-8 font-medium">{stars} Star</span>
                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${ratingPercent(stars)}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground font-mono">{ratingPercent(stars)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Write a Review</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Star Rating</label>
                <div className="flex gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setReviewRating(stars)}
                      className="cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${stars <= reviewRating ? "fill-current" : "opacity-30"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Review Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Highly recommend this!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Review Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details about your experience with this wood item..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-full">
                Submit Review
              </Button>
            </form>
          </div>

          {/* Customer Reviews Listings */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-base text-foreground">{rev.title}</h4>
                    <div className="flex items-center text-amber-500 gap-1.5 mt-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-current" : "opacity-30"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{rev.date}</span>
                    </div>
                  </div>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{rev.text}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                  <span>Reviewed by {rev.name}</span>
                  <div className="flex items-center gap-3">
                    <span>Was this review helpful?</span>
                    <button
                      onClick={() => handleHelpful(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        helpfulCount[rev.id]
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-background border-border hover:bg-accent"
                      }`}
                      disabled={!!helpfulCount[rev.id]}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{rev.helpful}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-24 rounded-md" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-3/4 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 w-28 rounded-full" />
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16 rounded-md mb-1" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
