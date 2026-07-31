import { createClient } from "@supabase/supabase-js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const url = process.env.SUPABASE_TEST_URL;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
assert(url && secretKey, "Variaveis server-only de validacao ausentes.");

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let page = 1;
let authUsers = 0;
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  authUsers += data.users.length;
  if (data.users.length < 1000) break;
  page += 1;
}

const { count: profiles, error: profilesError } = await admin
  .from("profiles")
  .select("id", { count: "exact", head: true });
if (profilesError) throw profilesError;

assert(authUsers > 0, "Nenhum Auth User existente para validar backfill.");
assert(profiles === authUsers, "Quantidade de profiles diverge da quantidade de Auth Users.");

console.log(`Backfill validado: ${profiles} profile(s) para ${authUsers} Auth User(s).`);
