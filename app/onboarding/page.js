import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { getServerAuthUser } from "@/lib/auth/serverAuthService";
import { createServerSupabaseClient } from "@/lib/supabase/client/serverClient";
import { getSafeRedirectPath } from "@/lib/auth/authRedirects";

export const metadata = { title: "Primeiro acesso", robots: { index: false, follow: false } };

export default async function OnboardingPage({ searchParams }) {
  const user = await getServerAuthUser().catch(() => null);
  if (!user) redirect("/entrar?next=/onboarding");
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("portfolio_members").select("portfolio_id").limit(1);
  if (data?.length) redirect("/dashboard");
  const params = await searchParams;
  const next = getSafeRedirectPath(params?.next, "/dashboard");
  return <div className="page-container grid min-h-[calc(100vh-4rem)] place-items-center py-12"><section className="card w-full max-w-xl rounded-3xl p-6 sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9b86c]/25 bg-[#d9b86c]/10 text-[#d9b86c]"><Landmark aria-hidden="true" size={21} /></span><p className="eyebrow mt-7">Primeiro acesso</p><h1 className="font-display mt-2 text-4xl">Boas-vindas.</h1><p className="mt-3 text-sm leading-7 text-[#898e89]">Configure o essencial para comecar. Voce podera ajustar essas informacoes depois.</p><OnboardingForm next={next} /></section></div>;
}
