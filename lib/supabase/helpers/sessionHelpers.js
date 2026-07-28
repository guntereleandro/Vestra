export async function getSessionSnapshot(supabase) {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, error };
  return { session: data.session || null, error: null };
}

export function hasActiveSession(session) {
  return Boolean(session?.access_token && session?.user?.id);
}

