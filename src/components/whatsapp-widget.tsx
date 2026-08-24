import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_PHONE = "918248651695"; // Official CarpenterBullet WhatsApp Phone

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);

  // Auto-prompt subtly after 5 seconds of browsing
  useEffect(() => {
    const timer = setTimeout(() => {
      // Keep badge visible
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const openWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text.trim() || "Hi CarpenterBullet! I would like to inquire about your solid wood furniture, timber catalog, and carpentry services.");
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const quickEnquiries = [
    {
      title: "🛋️ Custom Furniture Order",
      desc: "Get a quote for custom cot, sofa, or dining table",
      msg: "Hi CarpenterBullet! I want a quote for custom solid wood furniture in Chennai/Tamil Nadu.",
    },
    {
      title: "🔨 Book a Local Carpenter",
      desc: "Door fitting, modular kitchen, repairs & polish",
      msg: "Hi CarpenterBullet! I need to hire a skilled carpenter for woodwork at my home/office.",
    },
    {
      title: "🪵 Raw Teak & Timber Supply",
      desc: "Bulk wholesale timber lumber & wood planks",
      msg: "Hi CarpenterBullet! I am looking for raw timber/teak wood planks and wholesale pricing.",
    },
    {
      title: "💬 General WhatsApp Support",
      desc: "Direct chat with our workshop masters",
      msg: "Hi CarpenterBullet team! I need some assistance with my order and woodwork.",
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowNotificationBadge(false);
          }}
          className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xl shadow-emerald-600/40 border border-emerald-400/40 cursor-pointer transition-all duration-300"
          aria-label="Chat on WhatsApp"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6 fill-white text-emerald-600" />
            {showNotificationBadge && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            {isOpen ? "Close Chat" : "Direct WhatsApp Quote"}
          </span>
          <span className="sm:hidden font-bold text-xs tracking-wide">
            {isOpen ? "Close" : "WhatsApp"}
          </span>
        </motion.button>
      </div>

      {/* WhatsApp Modal / Drawer Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-36 right-4 sm:bottom-22 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl bg-card border border-border/80 shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-base shadow-inner">
                      🪵
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-emerald-700"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      CarpenterBullet Desk
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 fill-emerald-300 text-white" />
                    </h3>
                    <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      Online · Replies in ~2 mins
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-emerald-50/90 mt-2 leading-relaxed bg-white/10 px-3 py-1.5 rounded-xl">
                👋 Need custom dimensions, live timber photos, or instant carpenter booking? Chat directly with us!
              </p>
            </div>

            {/* Content: Quick Enquiries */}
            <div className="p-3.5 max-h-[320px] overflow-y-auto space-y-2 bg-muted/20">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-1">
                Choose a Quick Request:
              </p>

              {quickEnquiries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => openWhatsApp(q.msg)}
                  className="w-full text-left p-2.5 rounded-2xl border border-border/60 bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer group shadow-sm flex items-center justify-between"
                >
                  <div className="pr-2">
                    <p className="font-semibold text-xs text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {q.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{q.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>

            {/* Custom message input box */}
            <div className="p-3 bg-card border-t border-border/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  openWhatsApp(customMsg);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Type custom enquiry..."
                  className="flex-1 rounded-xl bg-muted/60 border border-border/80 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-background transition-all"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-md"
                  title="Send to WhatsApp"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-2.5 w-2.5 text-emerald-600" /> +91 82486 51695
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Tamil Nadu & Pan-India
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
