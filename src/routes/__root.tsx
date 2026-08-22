import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppIcon = () => (
  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.457h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">This page wandered off into the workshop.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "root" });

    // Auto-recover from chunk loading / new deployment mismatches
    const msg = error?.message || "";
    const isChunkError =
      msg.includes("Importing a module script failed") ||
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("dynamically imported module") ||
      msg.includes("Loading chunk");

    if (isChunkError && typeof window !== "undefined") {
      const lastReload = sessionStorage.getItem("chunk_reload_ts");
      const now = Date.now();
      // Only auto-reload once every 10 seconds to prevent endless loops
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("chunk_reload_ts", now.toString());
        window.location.reload();
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      const msg = error?.message || "";
      const isChunkError =
        msg.includes("Importing a module script failed") ||
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("dynamically imported module") ||
        msg.includes("Loading chunk");

      if (isChunkError) {
        window.location.reload();
        return;
      }
    }
    router.invalidate();
    reset();
  };

  const isChunkError =
    error?.message?.includes("Importing a module script failed") ||
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("dynamically imported module") ||
    error?.message?.includes("Loading chunk");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border/80 shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {isChunkError ? "App Update Available" : "Something went wrong"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isChunkError
            ? "A newer version of CarpenterBullet has been released. Tap below to refresh and load the latest updates."
            : error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={handleRetry}
          className="w-full rounded-2xl bg-primary hover:bg-primary/90 px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-lg transition active:scale-95 cursor-pointer"
        >
          {isChunkError ? "Refresh App" : "Try again"}
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CarpenterBullet WoodVerse — India's Premier Wood Industry Marketplace" },
      {
        name: "description",
        content:
          "WoodVerse by CarpenterBullet — Buy raw timber, custom furniture, hardware tools, and book expert carpentry services across India. Teak, mahogany, veneer and more.",
      },
      { name: "robots", content: "index, follow" },
      { name: "theme-color", content: "#92602a" },
      {
        property: "og:title",
        content: "CarpenterBullet WoodVerse — India's Premier Wood Industry Marketplace",
      },
      {
        property: "og:description",
        content:
          "Buy raw timber, custom furniture, hardware, and book expert carpentry services. Shop teak, mahogany, veneer and more at CarpenterBullet WoodVerse.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.carpenterbullet.com/" },
      { property: "og:image", content: "https://www.carpenterbullet.com/favicon.jpg" },
      { property: "og:image:width", content: "128" },
      { property: "og:image:height", content: "128" },
      { property: "og:site_name", content: "CarpenterBullet WoodVerse" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "CarpenterBullet WoodVerse — India's Wood Marketplace" },
      {
        name: "twitter:description",
        content:
          "Buy raw timber, custom furniture, and book expert carpentry services across India.",
      },
      { name: "twitter:image", content: "https://www.carpenterbullet.com/favicon.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/jpeg", href: "/favicon.jpg" },
      { rel: "apple-touch-icon", href: "/favicon.jpg" },
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KYB6XZMHS0"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-KYB6XZMHS0');
            `,
          }}
        />
        <HeadContent />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5F22GKG2');
            `,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const routerState = useRouterState();
  const isPending = routerState.status === "pending";

  useEffect(() => {
    // Vite preload error handler: auto-reload when a deployed chunk is outdated
    const handlePreloadError = () => {
      const lastReload = sessionStorage.getItem("vite_preload_reload");
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("vite_preload_reload", now.toString());
        window.location.reload();
      }
    };
    window.addEventListener("vite:preloadError", handlePreloadError);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });

    return () => {
      window.removeEventListener("vite:preloadError", handlePreloadError);
      subscription.unsubscribe();
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background overflow-x-hidden w-full max-w-[100vw]">
        {isPending && (
          <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] w-full overflow-hidden bg-primary/10">
            <div
              className="h-full bg-primary"
              style={{
                width: "100%",
                transformOrigin: "left",
                animation: "global-loader 1.2s infinite linear",
              }}
            />
            <style>{`
              @keyframes global-loader {
                0% { transform: scaleX(0) translateX(0); }
                50% { transform: scaleX(0.5) translateX(50%); }
                100% { transform: scaleX(0) translateX(200%); }
              }
            `}</style>
          </div>
        )}
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Floating WhatsApp Widget */}
      <motion.a
        href="https://wa.me/message/ZMGYY7674YVZN1"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 group select-none cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none" />
        <div className="relative z-10 flex items-center justify-center text-white">
          <WhatsAppIcon />
        </div>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-out font-sans text-xs font-bold tracking-wide text-white pl-0 group-hover:pl-2">
          Chat on WhatsApp
        </span>
      </motion.a>

      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
