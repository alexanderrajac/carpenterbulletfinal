import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProduct } from "@/lib/products.functions";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ShoppingBag,
  Heart,
  Star,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  Leaf,
  Shield,
  Package,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
  Lock,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
} from "lucide-react";
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
    result.sizes = sizesMatch[1].split(",").map((s) => s.trim());
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
          { title: `${loaderData.name} — Buy Online | CarpenterBullet WoodVerse` },
          {
            name: "description",
            content: `Buy ${loaderData.name} online at CarpenterBullet WoodVerse. ${loaderData.description
              ?.replace(/\[.*?\]/g, "")
              .trim()
              .slice(0, 120)} Handcrafted in South India.`,
          },
          {
            name: "keywords",
            content: `${loaderData.name}, buy online, solid wood, teak, handcrafted, CarpenterBullet, WoodVerse${loaderData.seo_keywords ? `, ${loaderData.seo_keywords}` : ''}`,
          },
          { property: "og:title", content: `${loaderData.name} — CarpenterBullet WoodVerse` },
          {
            property: "og:description",
            content: loaderData.description
              ?.replace(/\[.*?\]/g, "")
              .trim()
              .slice(0, 160),
          },
          { property: "og:image", content: resolveImage(loaderData.image_url) },
          { property: "og:type", content: "product" },
        ]
      : [{ title: "Wood Product — CarpenterBullet WoodVerse" }],
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
    {
      name: "Veppamaram",
      multiplier: 1.0,
      description: "Solid Neem wood. Natural pest-resistant, standard base finish.",
    },
    {
      name: "Teak Wood",
      multiplier: 1.5,
      description: "Highly durable solid teak. Premium oils, rich golden brown finish.",
    },
    {
      name: "Vengai",
      multiplier: 1.3,
      description: "Auspicious Vengai hardwood. Extremely heavy and structural quality.",
    },
    {
      name: "Poovarasam",
      multiplier: 1.2,
      description: "Portia tree hardwood. Beautiful dense grains, heirloom status.",
    },
    {
      name: "Mahogany",
      multiplier: 1.1,
      description: "Elegant Mahogany. Fine grain texture, premium reddish luster.",
    },
  ];

  const metadata = parseProductMetadata(p.description);

  const isWoodCustomizable = metadata.wood;

  // Check if size customization is allowed
  const sizeOptions = metadata.sizes.map((sName) => {
    const mult = sName.includes("3x3") ? 0.8 : sName.includes("2x1") ? 0.35 : 1.0;
    return { name: sName, multiplier: mult, description: `Size option: ${sName}` };
  });

  // Check if Sakkai configuration is allowed
  const sakkaiOptions = metadata.sakkai
    ? [
        { name: "1 Sakkai", multiplier: 1.0, description: "Single rebate groove." },
        { name: "2 Sakkai", multiplier: 1.15, description: "Double rebate grooves." },
        { name: "3 Sakkai", multiplier: 1.3, description: "Triple rebate grooves." },
      ]
    : [];

  const [selectedWood, setSelectedWood] = useState(isWoodCustomizable ? "Veppamaram" : "");
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]?.name ?? "");
  const [selectedSakkai, setSelectedSakkai] = useState(sakkaiOptions[0]?.name ?? "");
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [addAssemblyAddon, setAddAssemblyAddon] = useState(false);

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode)) {
      const dateStr = new Date(Date.now() + 4 * 86400000).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      setPincodeStatus(`✓ Eligible for Free Crated Delivery to ${pincode} by ${dateStr}`);
    } else {
      setPincodeStatus("⚠️ Please enter a valid 6-digit Indian Pincode");
    }
  };

  // Seller Offers Selection
  const activeOffers = (p.vendor_offers || []).filter((o: any) => o.is_active);
  const sortedOffers = [...activeOffers].sort((a, b) => a.price_cents - b.price_cents);
  const [selectedOfferId, setSelectedOfferId] = useState<string>(sortedOffers[0]?.id || "");
  const selectedOffer = sortedOffers.find((o: any) => o.id === selectedOfferId) || sortedOffers[0];

  // Dynamic Customizations State (from DB)
  const dynamicCustomizations = Array.isArray(p.customizations) ? p.customizations as any[] : [];
  const [selectedDynamicOptions, setSelectedDynamicOptions] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    dynamicCustomizations.forEach(c => {
      if (c.options && c.options.length > 0) {
        initial[c.name] = c.options[0];
      }
    });
    return initial;
  });

  // Multiple images list & Lightbox Zoom
  const [activeImageState, setActiveImageState] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const imagesList = p.image_url ? p.image_url.split(",").map((img: string) => img.trim()) : [];
  const activeImage = activeImageState ?? (imagesList[0] || "");
  const activeImageIndex = Math.max(0, imagesList.indexOf(activeImage));

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (imagesList.length <= 1) return;
    const prevIdx = (activeImageIndex - 1 + imagesList.length) % imagesList.length;
    setActiveImageState(imagesList[prevIdx]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (imagesList.length <= 1) return;
    const nextIdx = (activeImageIndex + 1) % imagesList.length;
    setActiveImageState(imagesList[nextIdx]);
  };

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

  let dynamicPriceAdditions = 0;
  Object.values(selectedDynamicOptions).forEach(opt => {
    if (opt && opt.price_modifier_cents) {
      dynamicPriceAdditions += opt.price_modifier_cents;
    }
  });

  const basePrice = selectedOffer ? selectedOffer.price_cents : (p.price_cents ?? 0);
  const computedPrice = Math.round(basePrice * totalMultiplier) + dynamicPriceAdditions;

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
    Object.entries(selectedDynamicOptions).forEach(([name, opt]) => {
      optionsArray.push(`${name}: ${opt.label}`);
    });
    const customOptions = optionsArray.join(", ");

    for (let i = 0; i < quantity; i++) {
      add({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price_cents: computedPrice + (addAssemblyAddon ? 49900 : 0),
        image_url: p.image_url,
        customizations: addAssemblyAddon
          ? { ...selectedDynamicOptions, "Carpenter Assembly": { label: "Doorstep Fitting & Polish (+₹499)", price_modifier_cents: 49900 } }
          : selectedDynamicOptions,
        vendor_id: selectedOffer?.vendor_id || null,
        vendor_name: selectedOffer?.vendor_profiles?.business_name || "CarpenterBullet Direct",
      });
    }
    toast.success(
      `Added ${quantity}× ${p.name} ${customOptions ? `(${customOptions})` : ""} to cart`,
    );
    if (buyNow) {
      navigate({ to: "/checkout" });
    }
  }

  function handleWhatsAppOrder() {
    const optionsArray = [];
    if (selectedWood) optionsArray.push(`Wood: ${selectedWood}`);
    if (selectedSize) optionsArray.push(`Size: ${selectedSize}`);
    if (selectedSakkai) optionsArray.push(`Sakkai: ${selectedSakkai}`);
    Object.entries(selectedDynamicOptions).forEach(([name, opt]) => {
      optionsArray.push(`${name}: ${opt.label}`);
    });
    if (addAssemblyAddon) optionsArray.push(`Carpenter Doorstep Assembly & Polish (+₹499)`);

    const customText = optionsArray.length > 0 ? `\n🛠️ *Specs/Options:* ${optionsArray.join(", ")}` : "";
    const finalTotal = formatPrice((computedPrice + (addAssemblyAddon ? 49900 : 0)) * quantity);
    const pinText = pincode ? `\n📍 *Destination Pincode:* ${pincode}` : "";

    const msg = `🪵 *New Product Order / Enquiry — CarpenterBullet*\n\n📦 *Product:* ${p.name}\n🔢 *Quantity:* ${quantity}\n💰 *Price:* ${finalTotal}${customText}${pinText}\n🔗 *Product Link:* https://www.carpenterbullet.com/product/${p.slug}\n\nHi team, I would like to order this item. Please confirm availability and UPI / payment details!`;
    const url = `https://wa.me/918248651695?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleWishlist() {
    toggleWishlist({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price_cents: basePrice,
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
    setReviews(reviews.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r)));
    toast.success("Marked as helpful");
  }

  // Calculate review summary metrics
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const ratingPercent = (stars: number) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return Math.round((count / reviews.length) * 100);
  };

  return (
    <>
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8 pb-28 lg:pb-12">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="mt-4 sm:mt-6 grid gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Product Image & Gallery */}
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-neutral-100/90 via-neutral-100/40 to-neutral-200/50 dark:from-neutral-900/90 dark:via-neutral-900/40 dark:to-neutral-950/80 border border-border/60 shadow-md relative flex items-center justify-center group">
            {/* Ambient blurred backdrop so tall/wide transparent items look full and rich */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 dark:opacity-30 scale-110 pointer-events-none"
              style={{ backgroundImage: `url(${resolveImage(activeImage, "f_auto,q_auto,w_400")})` }}
            />

            {/* Full uncropped centered product image */}
            <motion.img
              key={activeImage}
              initial={{ opacity: 0.85, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={resolveImage(activeImage, "f_auto,q_auto,w_1200")}
              alt={p.name}
              width={1024}
              height={1024}
              onClick={() => setIsZoomOpen(true)}
              className="relative z-10 max-h-full max-w-full object-contain p-3 sm:p-6 drop-shadow-sm cursor-zoom-in select-none"
            />

            {/* Badges & Trust Tag */}
            <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5 pointer-events-none">
              {p.featured && (
                <span className="bg-primary/95 text-primary-foreground font-semibold px-2.5 py-1 rounded-full text-[10px] sm:text-xs shadow-md tracking-wider uppercase">
                  Featured
                </span>
              )}
              <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                ✓ 100% Solid Wood
              </span>
            </div>

            {/* Expand / View Fullscreen Image button */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute top-3 right-3 z-20 p-2 sm:p-2.5 rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur-md border border-border/60 transition-all active:scale-90 cursor-pointer"
              title="View full screen uncropped image"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            {/* Left / Right arrows if multiple images */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur-md border border-border/60 transition-all active:scale-90 cursor-pointer"
                  title="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur-md border border-border/60 transition-all active:scale-90 cursor-pointer"
                  title="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {/* Floating image counter pill */}
                <div className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full shadow-sm pointer-events-none">
                  {activeImageIndex + 1} / {imagesList.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails Gallery — smooth scroll on mobile */}
          {imagesList.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 px-0.5">
              {imagesList.map((img: string, idx: number) => {
                const isActive = img === activeImage;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageState(img)}
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 p-1 transition duration-200 cursor-pointer shrink-0 flex items-center justify-center ${
                      isActive
                        ? "border-primary shadow-md scale-102 ring-2 ring-primary/30"
                        : "border-border/60 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveImage(img, "f_auto,q_auto,w_200")}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Info & Settings */}
        <div className="flex flex-col justify-start lg:sticky lg:top-24 lg:self-start">
          {p.categories && (
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              {(p.categories as any).name}
            </p>
          )}

          <h1 className="mt-2.5 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {p.name}
          </h1>

          {selectedOffer?.vendor_profiles ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 border border-border/40 px-3 py-1.5 rounded-2xl w-fit">
              <span>Sold by:</span>
              <Link
                to="/carpenter/$id"
                params={{ id: selectedOffer.vendor_profiles.id }}
                className="font-semibold text-amber-700 dark:text-amber-500 underline hover:text-primary transition-colors"
              >
                {selectedOffer.vendor_profiles.business_name}
              </Link>
            </div>
          ) : p.vendor_profiles ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 border border-border/40 px-3 py-1.5 rounded-2xl w-fit">
              <span>Sold by:</span>
              <Link
                to="/carpenter/$id"
                params={{ id: p.vendor_profiles.id }}
                className="font-semibold text-amber-700 dark:text-amber-500 underline hover:text-primary transition-colors"
              >
                {p.vendor_profiles.business_name}
              </Link>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 border border-border/40 px-3 py-1.5 rounded-2xl w-fit">
              <span>Sold by:</span>
              <span className="font-semibold text-amber-700 dark:text-amber-500">
                CarpenterBullet Direct
              </span>
            </div>
          )}

          {/* Ratings Summary */}
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-current" : "opacity-30"}`}
                />
              ))}
            </div>
            <span className="font-semibold text-foreground">{avgRating} out of 5</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">
              {reviews.length} customer reviews
            </span>
          </div>

          {/* Pricing Display */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold font-mono text-foreground">
              {formatPrice(computedPrice)}
            </span>
            {(totalMultiplier !== 1.0 || dynamicPriceAdditions > 0) && (
              <>
                <span className="text-sm text-muted-foreground line-through font-mono">
                  {formatPrice(basePrice)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Customized Price (
                  {totalMultiplier > 1.0 || dynamicPriceAdditions > 0
                    ? `+${Math.round((totalMultiplier - 1) * 100)}% + ${formatPrice(dynamicPriceAdditions)}`
                    : `-${Math.round((1 - totalMultiplier) * 100)}%`}
                  )
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
            {((selectedOffer ? selectedOffer.stock : p.stock) ?? 0) > 0 ? (
              <span>
                In stock (<strong>{(selectedOffer ? selectedOffer.stock : p.stock) ?? 0}</strong> items) · Made-to-order options ships in 4–7
                days
              </span>
            ) : (
              <span className="text-destructive font-semibold">
                Sold out (Accepting pre-orders)
              </span>
            )}
          </div>

          {/* Customization Options */}


          {isWoodCustomizable && (
            <div className="mt-6 space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/40">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Select Wood Type
                </label>
                <span className="text-xs text-primary font-semibold">
                  Price adjusts dynamically
                </span>
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
                        {wood.multiplier > 1.0
                          ? `+${Math.round((wood.multiplier - 1) * 100)}%`
                          : "Base"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                      {wood.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="mt-4 space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/40">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Select Size
                </label>
                <span className="text-xs text-primary font-semibold">
                  Price adjusts dynamically
                </span>
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
                        {size.multiplier < 1.0
                          ? `-${Math.round((1 - size.multiplier) * 100)}%`
                          : "Base"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                      {size.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sakkaiOptions.length > 0 && (
            <div className="mt-4 space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/40">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Sakkai Configuration
                </label>
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
                        {sakkai.multiplier > 1.0
                          ? `+${Math.round((sakkai.multiplier - 1) * 100)}%`
                          : "Base"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic DB Customizations */}
          {dynamicCustomizations.map((cust, idx) => (
            <div key={idx} className="mt-4 space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/40">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {cust.name}
                </label>
                <span className="text-xs text-primary font-semibold">Custom Add-on</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {cust.options?.map((opt: any, optIdx: number) => {
                  const isSelected = selectedDynamicOptions[cust.name]?.label === opt.label;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setSelectedDynamicOptions({ ...selectedDynamicOptions, [cust.name]: opt })}
                      className={`text-left p-3.5 rounded-xl border text-sm transition duration-200 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <div className="flex flex-col justify-between h-full">
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-foreground">{opt.label}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground mt-1">
                          {opt.price_modifier_cents > 0
                            ? `+ ${formatPrice(opt.price_modifier_cents)}`
                            : "Base"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity Selector */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Quantity
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1 shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition cursor-pointer disabled:opacity-40"
              >
                <MinusCircle className="h-5 w-5" />
              </button>
              <span className="w-8 text-center font-mono font-semibold text-sm tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(p.stock || 99, q + 1))}
                disabled={quantity >= (p.stock || 99)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition cursor-pointer disabled:opacity-40"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            </div>
            {quantity > 1 && (
              <span className="text-sm font-semibold text-primary font-mono">
                Total: {formatPrice(computedPrice * quantity)}
              </span>
            )}
          </div>

          {/* Professional Carpenter Assembly Upsell Toggle */}
          <div
            onClick={() => setAddAssemblyAddon(!addAssemblyAddon)}
            className={`mt-5 p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
              addAssemblyAddon
                ? "bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30"
                : "bg-muted/30 border-border/60 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={addAssemblyAddon}
                onChange={(e) => setAddAssemblyAddon(e.target.checked)}
                className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
              />
              <div>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>🪛 Add Carpenter Assembly & Polish</span>
                  <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded">Recommended</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Doorstep expert installation & beeswax polish across Chennai / Tamil Nadu
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
              +₹499
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <Button
              disabled={p.stock === 0}
              onClick={() => handleAddCart(true)}
              className="flex-1 rounded-full py-6 text-sm font-bold shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white flex justify-center items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Zap className="h-4 w-4 fill-current" /> Buy Now — Website Checkout
            </Button>

            <Button
              disabled={p.stock === 0}
              onClick={() => handleAddCart(false)}
              className="flex-1 rounded-full py-6 text-sm font-semibold shadow-md bg-primary hover:bg-primary/95 text-primary-foreground flex justify-center items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
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

          {/* Direct WhatsApp Order Button */}
          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="mt-2.5 w-full flex items-center justify-center gap-2 rounded-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer border border-emerald-400/30"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            <span>⚡ Order Instantly on WhatsApp (+91 82486 51695)</span>
          </button>

          {/* Express Shipping Urgency Banner */}
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span>🔥 <strong>4 customers</strong> viewing now · Priority artisan dispatch</span>
            </div>
            <span className="font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">Fast Track</span>
          </div>

          {/* Pincode Delivery Estimator Widget */}
          <div className="mt-4 p-4 rounded-2xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Delivery & Pincode Availability
              </span>
              <span className="text-[10px] text-muted-foreground">Pan-India Shipping</span>
            </div>
            <form onSubmit={checkPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit Pincode (e.g. 560001)"
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary font-mono"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Check
              </button>
            </form>
            {pincodeStatus && (
              <p className={`mt-2 text-xs font-medium ${pincodeStatus.startsWith("✓") ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                {pincodeStatus}
              </p>
            )}
          </div>

          {/* Action Trust Panel */}
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-3.5 text-center text-[10px] sm:text-xs text-muted-foreground font-semibold shadow-sm">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>5-Yr Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-l border-border/60">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-450" />
              <span>Kiln Dried Wood</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-l border-border/60">
              <Truck className="h-4 w-4 text-blue-600 dark:text-blue-450" />
              <span>Crated Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-l border-border/60">
              <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span>Secure UPI/COD</span>
            </div>
          </div>



          <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-border pt-6 text-sm">
            {[
              {
                icon: Leaf,
                label: "Material",
                value: isWoodCustomizable ? `${selectedWood} Hardwood` : "Solid hardwood",
              },
              { icon: Package, label: "Finish", value: "Natural organic oil polish" },
              { icon: MapPin, label: "Origin", value: "Handmade in South India" },
              { icon: Shield, label: "Warranty", value: "Lifetime structural warranty" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/40"
              >
                <div className="h-7 w-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-xs font-medium text-foreground">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {/* Technical Specs Accordion */}
          <div className="mt-8 border-t border-border/60 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Specs & Craftsmanship</h3>
            <div className="space-y-2.5">
              <ProductSpecAccordionItem
                title="Kiln-Dried Moisture Control"
                content="Our timber undergoes rigorous kiln drying to lower moisture levels to 8-12%. This prevents the solid wood from warping, bending, or splitting under seasonal humidity changes."
              />
              <ProductSpecAccordionItem
                title="Traditional Joinery Standards"
                content="Constructed entirely with authentic wood joinery (Mortise & Tenon, Dowels) instead of cheap metal brackets or screws. This creates a resilient heirloom piece that lasts for generations."
              />
              <ProductSpecAccordionItem
                title="Natural Organic Finishing"
                content="Finished with 3 coats of non-toxic food-safe flaxseed oil and pure beeswax polish. Protects the grain while keeping it breathable. Wipe with a dry lint-free cloth."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-20 border-t border-border/80 pt-12">
        <h2 className="font-display text-3xl font-medium tracking-tight mb-8">Customer Reviews</h2>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Review Summary Panel */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Review Overview
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold font-mono">{avgRating}</span>
                <div>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.round(Number(avgRating)) ? "fill-current" : "opacity-30"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {reviews.length} reviews
                  </p>
                </div>
              </div>

              {/* Stars percentage list */}
              <div className="space-y-2 pt-2 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-8 font-medium">{stars} Star</span>
                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${ratingPercent(stars)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground font-mono">
                      {ratingPercent(stars)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write a Review Form */}
            <form
              onSubmit={handleReviewSubmit}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4"
            >
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
                      <Star
                        className={`h-6 w-6 ${stars <= reviewRating ? "fill-current" : "opacity-30"}`}
                      />
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
                <label className="text-xs font-semibold text-muted-foreground">
                  Review Content
                </label>
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
              <div
                key={rev.id}
                className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-base text-foreground">{rev.title}</h4>
                    <div className="flex items-center text-amber-500 gap-1.5 mt-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-current" : "opacity-30"}`}
                          />
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

    {/* Mobile Sticky Buy Bar */}
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border/80 bg-card/98 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] px-3.5 py-2.5"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-base font-extrabold font-mono text-foreground leading-tight">
            {formatPrice(computedPrice)}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{p.name}</p>
        </div>
        <button
          type="button"
          onClick={handleWhatsAppOrder}
          className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
          title="Order on WhatsApp"
          aria-label="Order on WhatsApp"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
        </button>
        <Button
          disabled={p.stock === 0}
          onClick={() => handleAddCart(false)}
          className="rounded-full px-3.5 py-2 text-xs font-semibold shadow-xs bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-1 active:scale-95 transition-all shrink-0"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Cart
        </Button>
        <Button
          disabled={p.stock === 0}
          onClick={() => handleAddCart(true)}
          className="rounded-full px-4 py-2 text-xs font-bold shadow-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 active:scale-95 transition-all shrink-0"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          Buy Now
        </Button>
      </div>
    </div>
    {/* Fullscreen Lightbox Modal for High-Resolution Uncropped Image Inspection */}
    {isZoomOpen && (
      <div
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
        onClick={() => setIsZoomOpen(false)}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between text-white z-10 max-w-7xl mx-auto w-full">
          <div className="min-w-0 pr-4">
            <p className="font-display text-sm sm:text-base font-semibold truncate">{p.name}</p>
            {imagesList.length > 1 && (
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Image {activeImageIndex + 1} of {imagesList.length}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            title="Close image view"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Center High-Res Uncropped Full Image */}
        <div
          className="relative flex-1 flex items-center justify-center my-4 overflow-hidden w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {imagesList.length > 1 && (
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img
            src={resolveImage(activeImage, "f_auto,q_auto,w_1600")}
            alt={p.name}
            className="max-h-[75vh] max-w-[92vw] object-contain drop-shadow-2xl select-none transition-all duration-200"
          />

          {imagesList.length > 1 && (
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer"
              title="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Modal Bottom Thumbnails Gallery */}
        {imagesList.length > 1 ? (
          <div
            className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-2 max-w-7xl mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {imagesList.map((img: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageState(img)}
                className={`h-14 w-14 rounded-xl overflow-hidden border-2 bg-neutral-900 p-1 transition cursor-pointer shrink-0 flex items-center justify-center ${
                  img === activeImage ? "border-amber-500 scale-105 ring-2 ring-amber-500/40" : "border-neutral-700 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={resolveImage(img, "f_auto,q_auto,w_150")}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-neutral-400 py-1">
            Tap anywhere to close
          </div>
        )}
      </div>
    )}
  </>
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

function ProductSpecAccordionItem({ title, content }: { title: string; content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border/65 bg-card/45 rounded-xl overflow-hidden transition-all duration-350 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold text-foreground/95 hover:bg-accent/40 transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <PlusCircle className={`h-4 w-4 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? "rotate-45 text-primary" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 border-t border-border/40 p-4 bg-muted/10" : "max-h-0"}`}>
        <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
