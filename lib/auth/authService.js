"use client";

import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
} from "../supabase/client/browserClient.js";
import {
  AUTH_ERROR_CODES,
  authError,
  normalizeAuthError,
  toPublicAuthError,
} from "./authErrors.js";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "./authValidation.js";
import { getAuthCallbackUrl, getSafeRedirectPath } from "./authRedirects.js";

function getClient() {
  if (!isBrowserSupabaseConfigured()) throw authError(AUTH_ERROR_CODES.AUTH_NOT_CONFIGURED);
  return createBrowserSupabaseClient();
}

function runtimeOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

async function runAuthOperation(operation, fallbackCode) {
  try {
    return await operation();
  } catch (error) {
    throw normalizeAuthError(error, fallbackCode);
  }
}

export async function signUpWithPassword(input) {
  const email = validateEmail(input.email);
  const password = validatePasswordConfirmation(input.password, input.passwordConfirmation);
  const emailRedirectTo = getAuthCallbackUrl({
    next: "/confirmar-email?status=success",
    type: "signup",
    runtimeOrigin: runtimeOrigin(),
  });

  return runAuthOperation(async () => {
    const { data, error } = await getClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) throw error;
    return { user: data.user || null, requiresEmailConfirmation: !data.session };
  });
}

export async function signInWithPassword(input) {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);

  return runAuthOperation(async () => {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, session: data.session };
  }, AUTH_ERROR_CODES.INVALID_CREDENTIALS);
}

export async function signOut() {
  return runAuthOperation(async () => {
    const { error } = await getClient().auth.signOut({ scope: "local" });
    if (error) throw error;
    return { ok: true };
  });
}

export async function requestPasswordRecovery(emailValue) {
  const email = validateEmail(emailValue);
  const redirectTo = getAuthCallbackUrl({
    next: "/atualizar-senha",
    type: "recovery",
    runtimeOrigin: runtimeOrigin(),
  });

  return runAuthOperation(async () => {
    const { error } = await getClient().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return { ok: true };
  });
}

export async function updatePassword(input) {
  const password = validatePasswordConfirmation(input.password, input.passwordConfirmation);

  return runAuthOperation(async () => {
    const client = getClient();
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) {
      throw normalizeAuthError(userError, AUTH_ERROR_CODES.RECOVERY_LINK_INVALID);
    }
    const { data, error } = await client.auth.updateUser({ password });
    if (error) throw error;
    return { user: data.user };
  }, AUTH_ERROR_CODES.RECOVERY_LINK_INVALID);
}

export async function getAuthenticatedUser() {
  return runAuthOperation(async () => {
    const { data, error } = await getClient().auth.getUser();
    if (error) throw error;
    return data.user || null;
  }, AUTH_ERROR_CODES.SESSION_EXPIRED);
}

export function normalizeAuthResult(error) {
  return toPublicAuthError(error);
}

export function resolvePostAuthRedirect(value) {
  return getSafeRedirectPath(value);
}

