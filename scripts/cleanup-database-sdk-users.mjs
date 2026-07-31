import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_TEST_URL;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
if (!url || !secretKey) throw new Error("Variaveis server-only de limpeza ausentes.");

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let page = 1;
const testUsers = [];
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  testUsers.push(...data.users.filter((user) => (
    user.email?.startsWith("core05-")
    && user.email.endsWith("@example.invalid")
  )));
  if (data.users.length < 1000) break;
  page += 1;
}

if (testUsers.length) {
  const { error: portfolioError } = await admin
    .from("portfolios")
    .delete()
    .in("created_by", testUsers.map((user) => user.id));
  if (portfolioError) throw portfolioError;
}

for (const user of testUsers) {
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) throw deleteError;
}

console.log(`Limpeza remota concluida: ${testUsers.length} Auth User(s) artificial(is) removido(s).`);
