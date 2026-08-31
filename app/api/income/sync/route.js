import { createServerSupabaseClient } from "@/lib/supabase/client/serverClient";
import { syncAutomaticIncome } from "@/lib/services/automaticIncomeSyncService";
import { enforceMarketRateLimit } from "@/lib/market/server/marketRateLimit";

export async function POST(request) {
  try {
    enforceMarketRateLimit(request);
    const supabase = await createServerSupabaseClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return Response.json({ ok: false, code: "AUTH_REQUIRED" }, { status: 401 });
    const { data: preference } = await supabase.from("user_portfolio_preferences").select("active_portfolio_id").eq("user_id", auth.user.id).maybeSingle();
    if (!preference?.active_portfolio_id) return Response.json({ ok: false, code: "NO_ACTIVE_PORTFOLIO" }, { status: 409 });
    const portfolioId = preference.active_portfolio_id;
    const [{ data: membership }, { data: source }] = await Promise.all([
      supabase.from("portfolio_members").select("role").eq("portfolio_id", portfolioId).eq("user_id", auth.user.id).maybeSingle(),
      supabase.from("portfolio_preferences").select("data_source").eq("portfolio_id", portfolioId).maybeSingle(),
    ]);
    if (!membership || !["owner", "editor"].includes(membership.role)) return Response.json({ ok: false, code: "ACCESS_DENIED" }, { status: 403 });
    if (source?.data_source !== "SUPABASE") return Response.json({ ok: false, code: "SUPABASE_SOURCE_REQUIRED" }, { status: 409 });
    const body = await request.json().catch(() => ({}));
    const result = await syncAutomaticIncome({ portfolioId, serverClient: supabase, dryRun: body.dryRun === true });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("automatic_income_sync_failed", { name: error?.name, code: error?.code });
    return Response.json({ ok: false, code: "INCOME_SYNC_FAILED" }, { status: 502 });
  }
}
