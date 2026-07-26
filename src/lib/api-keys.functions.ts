import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import crypto from "crypto";

export type ApiKeyItem = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

const CreateApiKeyInput = z.object({
  name: z.string().min(1, "Name is required").max(100),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
});

const RevokeApiKeyInput = z.object({
  id: z.string().uuid(),
});

function hashKey(secretKey: string): string {
  return crypto.createHash("sha256").update(secretKey).digest("hex");
}

export const generateApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof CreateApiKeyInput>) => CreateApiKeyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Generate secret key: cb_live_<32 hex chars>
    const randomHex = crypto.randomBytes(16).toString("hex");
    const rawKey = `cb_live_${randomHex}`;
    const keyPrefix = rawKey.slice(0, 12);
    const hashed = hashKey(rawKey);

    const { data: inserted, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        user_id: context.userId,
        name: data.name,
        key_prefix: `${keyPrefix}...`,
        hashed_key: hashed,
        scopes: data.scopes,
        is_active: true,
      })
      .select("id, name, key_prefix, scopes, is_active, created_at")
      .single();

    if (error) {
      throw new Error(`Failed to create API Key: ${error.message}`);
    }

    return {
      rawKey, // Returned ONCE to the user
      apiKey: inserted as ApiKeyItem,
    };
  });

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, key_prefix, scopes, is_active, last_used_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch API Keys: ${error.message}`);
    }

    return (data || []) as ApiKeyItem[];
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof RevokeApiKeyInput>) => RevokeApiKeyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) {
      throw new Error(`Failed to revoke API Key: ${error.message}`);
    }

    return { success: true };
  });

const VerifyKeyInput = z.object({
  rawKey: z.string().min(1),
});

export const verifyApiKey = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof VerifyKeyInput>) => VerifyKeyInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const hashed = hashKey(data.rawKey);
    const { data: keyRecord, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, name, scopes, is_active")
      .eq("hashed_key", hashed)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !keyRecord) {
      return { valid: false, reason: "Invalid or revoked API Key" };
    }

    // Update last_used_at timestamp
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRecord.id);

    return {
      valid: true,
      userId: keyRecord.user_id,
      name: keyRecord.name,
      scopes: keyRecord.scopes,
    };
  });
