import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
if (!url || !publishableKey || !secretKey) throw new Error("Variaveis SUPABASE_TEST_* ausentes.");

const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `core12-recovery-${randomUUID()}@example.invalid`;
const initialPassword = `Initial-${randomUUID()}-Aa1!`;
const updatedPassword = `Updated-${randomUUID()}-Aa1!`;
let userId = null;

try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true,
  });
  if (createError) throw createError;
  userId = created.user.id;

  const { data: generated, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: "http://localhost:3000/atualizar-senha" },
  });
  if (linkError) throw linkError;
  const tokenHash = generated?.properties?.hashed_token;
  if (!tokenHash) throw new Error("Token de recuperacao nao foi gerado.");

  const recoveryClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: verifyError } = await recoveryClient.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (verifyError) throw verifyError;
  const { error: updateError } = await recoveryClient.auth.updateUser({ password: updatedPassword });
  if (updateError) throw updateError;
  await recoveryClient.auth.signOut();

  const loginClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: oldLoginError } = await loginClient.auth.signInWithPassword({ email, password: initialPassword });
  if (!oldLoginError) throw new Error("Senha anterior permaneceu valida.");
  const { error: newLoginError } = await loginClient.auth.signInWithPassword({ email, password: updatedPassword });
  if (newLoginError) throw newLoginError;
  await loginClient.auth.signOut();

  const expiredClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: reusedTokenError } = await expiredClient.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (!reusedTokenError) throw new Error("Token de recuperacao reutilizado indevidamente.");

  console.log("Recuperacao remota validada: token, nova senha, login e rejeicao de token reutilizado.");
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId);
}
