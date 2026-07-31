import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_TEST_URL;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
const credentialFile = process.env.SUPABASE_TEST_CREDENTIAL_FILE;
if (!url || !secretKey || !credentialFile) {
  throw new Error("Configuracao server-only do teste de interface ausente.");
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `core05-interface-${randomUUID()}@example.invalid`;
const password = `Interface-${randomUUID()}-Aa1!`;
const { error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) throw error;

fs.writeFileSync(credentialFile, JSON.stringify({ email, password }), {
  encoding: "utf8",
  mode: 0o600,
});
console.log("Usuario artificial de interface criado; credenciais mantidas somente em arquivo temporario.");
