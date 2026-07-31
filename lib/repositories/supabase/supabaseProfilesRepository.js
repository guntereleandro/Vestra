import { brandConfig } from "../../config/brandConfig.js";
import {
  assertRecordInput,
  getSupabaseRepositoryClient,
  throwSupabaseRepositoryError,
} from "./supabaseRepositoryUtils.js";

function normalizeProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    locale: row.locale,
    currency: row.default_currency,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseProfilesRepository(client) {
  return {
    async getCurrent() {
      const supabase = getSupabaseRepositoryClient(client);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      throwSupabaseRepositoryError(authError);
      if (!authData?.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, locale, default_currency, timezone, created_at, updated_at")
        .eq("id", authData.user.id)
        .maybeSingle();
      throwSupabaseRepositoryError(error);
      return normalizeProfile(data);
    },

    async upsert(profile = {}) {
      assertRecordInput(profile);
      const supabase = getSupabaseRepositoryClient(client);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      throwSupabaseRepositoryError(authError, "write");
      if (!authData?.user?.id) {
        throwSupabaseRepositoryError({ code: "42501" }, "write");
      }

      const payload = {
        id: authData.user.id,
        display_name: String(profile.displayName || "").trim(),
        avatar_url: profile.avatarUrl || null,
        locale: profile.locale || brandConfig.defaultLocale,
        default_currency: profile.currency || brandConfig.defaultCurrency,
        timezone: profile.timezone || "America/Sao_Paulo",
      };
      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("id, display_name, avatar_url, locale, default_currency, timezone, created_at, updated_at")
        .single();
      throwSupabaseRepositoryError(error, "write");
      return normalizeProfile(data);
    },
  };
}

export const supabaseProfilesRepository = createSupabaseProfilesRepository();
