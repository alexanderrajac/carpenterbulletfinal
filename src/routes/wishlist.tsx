import { createFileRoute, Link } from "@tanstack/react-router";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { resolveImage } from "@/lib/product-images";
import { toast } from "sonner";
import { Trash2, ShoppingCart, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — Woodverse" },
      { name: "description", content: "View and manage items saved in your Woodverse wishlist." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const items = useWishlist((s) => s.items);
  const toggle = useWishlist((s) => s.toggle);
  const addCart = useCart((s) => s.add);

  function handleAddToCart(item: any) {
    addCart({
      id: item.id,
      slug: item.slug,
      name: item.name,
      price_cents: item.price_cents,
      image_url: item.image_url,
    });
    toast.success(`Added ${item.name} to cart`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-border pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight">Your Wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Items you've saved to buy later.</p>
        </div>
        <Link to="/shop" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
          Continue shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm max-w-lg mx-auto px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <Heart className="h-7 w-7 text-primary/80" />
          </div>
          <h2 className="text-2xl font-display font-medium">Wishlist is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">Browse the collection and save items you like to this list.</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-md">
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="aspect-square bg-muted relative overflow-hidden">
                <img
                  src={resolveImage(item.image_url)}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <button
                  onClick={() => toggle(item)}
                  className="absolute right-3 top-3 p-2 bg-background/80 backdrop-blur-md hover:bg-background text-red-500 rounded-full border border-border shadow-sm cursor-pointer transition-colors"
                  title="Remove from wishlist"
                >
                  <Heart className="h-4 w-4 fill-current text-red-500" />
                </button>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {item.categories?.name && (
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{item.categories.name}</p>
                  )}
                  <h3 className="font-display text-lg font-medium leading-tight hover:text-primary transition-colors">
                    <Link to="/product/$slug" params={{ slug: item.slug }}>
                      {item.name}
                    </Link>
                  </h3>
                  <p className="mt-2 font-mono font-semibold text-foreground text-base">{formatPrice(item.price_cents)}</p>
                </div>
                
                <div className="mt-5 flex gap-2">
                  <Button
                    onClick={() => handleAddToCart(item)}
                    size="sm"
                    className="flex-1 rounded-full gap-1.5 shadow-sm"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </Button>
                  <Button
                    onClick={() => toggle(item)}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-destructive hover:bg-destructive/10 border-destructive/20"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
