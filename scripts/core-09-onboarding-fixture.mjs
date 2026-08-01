import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [mode, fixtureFile] = process.argv.slice(2);
const url = process.env.SUPABASE_TEST_URL;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
if (!mode || !fixtureFile || !url || !secretKey) throw new Error("Configuracao de fixture incompleta.");
const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

if (mode === "setup") {
  const id = randomUUID();
  const email = `core09-onboarding-${id}@example.invalid`;
  const password = `Onboarding-${randomUUID()}-Aa1!`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  fs.writeFileSync(fixtureFile, JSON.stringify({ email, password, userId: data.user.id }), { encoding: "utf8", mode: 0o600 });
  console.log("Fixture de onboarding criada.");
} else if (mode === "cleanup") {
  const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
  const { error } = await admin.auth.admin.deleteUser(fixture.userId);
  if (error) throw error;
  fs.rmSync(fixtureFile, { force: true });
  console.log("Fixture de onboarding removida.");
} else {
  throw new Error("Modo invalido.");
}
