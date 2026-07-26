import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApiKeys, generateApiKey, revokeApiKey, type ApiKeyItem } from "@/lib/api-keys.functions";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Key,
  Plus,
  Copy,
  Check,
  Shield,
  Trash2,
  Code,
  Terminal,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/api-keys")({
  head: () => ({
    meta: [{ title: "Developer API Keys — CarpenterBullet WoodVerse Admin" }],
  }),
  component: AdminApiKeysPage,
});

const AVAILABLE_SCOPES = [
  { id: "catalog:read", label: "Catalog Read", desc: "View products, timber, and service listings" },
  { id: "catalog:write", label: "Catalog Write", desc: "Create and update product inventory" },
  { id: "orders:read", label: "Orders Read", desc: "Access order details and customer receipts" },
  { id: "bookings:write", label: "Bookings Write", desc: "Book carpenter service dispatches externally" },
];

function AdminApiKeysPage() {
  const queryClient = useQueryClient();
  const getKeys = useServerFn(listApiKeys);
  const createKey = useServerFn(generateApiKey);
  const revokeKey = useServerFn(revokeApiKey);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["catalog:read"]);

  // Raw Key secret reveal state
  const [rawSecretKey, setRawSecretKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => getKeys(),
  });

  const createMutation = useMutation({
    mutationFn: () => createKey({ data: { name: keyName, scopes: selectedScopes } }),
    onSuccess: (res) => {
      setRawSecretKey(res.rawKey);
      setIsCreateOpen(false);
      setKeyName("");
      setSelectedScopes(["catalog:read"]);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key generated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate API Key");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeKey({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key revoked");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke key");
    },
  });

  const handleCopySecret = () => {
    if (rawSecretKey) {
      navigator.clipboard.writeText(rawSecretKey);
      setCopied(true);
      toast.success("API Key copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleScope = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-2">
            <Key className="h-3.5 w-3.5" /> External App Integrations
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight">Developer API Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect external apps, mobile applications, and inventory ERPs to WoodVerse.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-full px-5 py-2.5 bg-primary text-primary-foreground font-semibold shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Generate New API Key
        </Button>
      </div>

      {/* Secret Key Reveal Dialog */}
      {rawSecretKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-4 shadow-lg"
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
            <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
            <span>Save your secret API Key now!</span>
          </div>
          <p className="text-xs text-muted-foreground">
            This secret key will <strong>never be shown again</strong>. Please store it securely in your environment variables.
          </p>
          <div className="flex items-center gap-2 bg-background p-3 rounded-2xl border border-amber-500/40 font-mono text-sm font-bold text-foreground">
            <span className="flex-1 truncate select-all">{rawSecretKey}</span>
            <Button
              onClick={handleCopySecret}
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center gap-1.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy Secret"}</span>
            </Button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setRawSecretKey(null)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              I have saved my secret key →
            </button>
          </div>
        </motion.div>
      )}

      {/* Keys List */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Active API Keys ({keys.filter((k) => k.is_active).length})
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading API Keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-3xl space-y-3">
            <Key className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <p className="font-semibold text-foreground">No API Keys Generated</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create your first API key to securely connect external systems to WoodVerse.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {keys.map((k) => (
              <div
                key={k.id}
                className={`p-5 rounded-2xl border transition-all ${
                  k.is_active
                    ? "bg-card border-border/80 shadow-sm hover:border-primary/40"
                    : "bg-muted/30 border-border/40 opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">{k.name}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase font-mono px-2.5 py-0.5 rounded-full ${
                          k.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                        }`}
                      >
                        {k.is_active ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{k.key_prefix}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {k.scopes.map((sc) => (
                        <span
                          key={sc}
                          className="text-[10px] bg-primary/10 text-primary font-mono font-semibold px-2 py-0.5 rounded-md"
                        >
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-right hidden md:block">
                      <p>Created: {new Date(k.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px]">
                        Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                      </p>
                    </div>

                    {k.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(k.id)}
                        disabled={revokeMutation.isPending}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration Code Example Panel */}
      <div className="p-6 rounded-3xl bg-muted/40 border border-border space-y-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2 text-foreground">
          <Code className="h-5 w-5 text-primary" /> External Integration Example
        </h3>
        <p className="text-xs text-muted-foreground">
          Send your generated API key in the <code>x-api-key</code> HTTP header when calling WoodVerse endpoints:
        </p>

        <div className="bg-black text-amber-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-white/10">
          <pre>{`curl -X GET "https://www.carpenterbullet.com/api/v1/products" \\
  -H "x-api-key: cb_live_8f3a9b1c2d3e4f5a6b7c8d9e0f1a2b3c"`}</pre>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" /> Generate API Key
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Key Label / App Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile Inventory App, POS Sync"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">Permissions / Scopes</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_SCOPES.map((sc) => (
                    <label
                      key={sc.id}
                      onClick={() => toggleScope(sc.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedScopes.includes(sc.id)
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(sc.id)}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-primary"
                      />
                      <div>
                        <p className="text-xs font-bold font-mono text-foreground">{sc.label}</p>
                        <p className="text-[11px] text-muted-foreground">{sc.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 rounded-full py-2.5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                disabled={!keyName.trim() || selectedScopes.length === 0 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="flex-1 rounded-full py-2.5 text-xs font-bold bg-primary text-primary-foreground shadow-md"
              >
                {createMutation.isPending ? "Generating..." : "Generate Key"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
