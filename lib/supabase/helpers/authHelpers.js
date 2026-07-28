export async function getAuthenticatedUser(supabase) {
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null, error };
  return { user: data.user || null, error: null };
}

export async function getVerifiedClaims(supabase) {
  const { data, error } = await supabase.auth.getClaims();
  if (error) return { claims: null, error };
  return { claims: data?.claims || null, error: null };
}

