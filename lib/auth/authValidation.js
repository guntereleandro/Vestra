import { AUTH_ERROR_CODES, authError } from "./authErrors.js";

export const AUTH_PASSWORD_MIN_LENGTH = 8;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!isValidEmail(email)) throw authError(AUTH_ERROR_CODES.INVALID_EMAIL);
  return email;
}

export function validatePassword(password) {
  const normalized = typeof password === "string" ? password : "";
  if (normalized.length < AUTH_PASSWORD_MIN_LENGTH) {
    throw authError(AUTH_ERROR_CODES.PASSWORD_TOO_SHORT);
  }
  return normalized;
}

export function validatePasswordConfirmation(password, confirmation) {
  const validPassword = validatePassword(password);
  if (validPassword !== confirmation) throw authError(AUTH_ERROR_CODES.PASSWORD_MISMATCH);
  return validPassword;
}

