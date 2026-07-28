export const AUTH_ERROR_CODES = Object.freeze({
  AUTH_NOT_CONFIGURED: "AUTH_NOT_CONFIGURED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED",
  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
  PASSWORD_MISMATCH: "PASSWORD_MISMATCH",
  INVALID_EMAIL: "INVALID_EMAIL",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  RECOVERY_LINK_INVALID: "RECOVERY_LINK_INVALID",
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  AUTH_PROVIDER_ERROR: "AUTH_PROVIDER_ERROR",
  UNSAFE_REDIRECT: "UNSAFE_REDIRECT",
});

const AUTH_MESSAGES = Object.freeze({
  AUTH_NOT_CONFIGURED: "O acesso por conta ainda não está configurado neste ambiente.",
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  EMAIL_NOT_CONFIRMED: "Confirme seu e-mail antes de entrar.",
  EMAIL_ALREADY_REGISTERED: "Não foi possível concluir o cadastro com esses dados.",
  PASSWORD_TOO_SHORT: "Use uma senha com pelo menos 8 caracteres.",
  PASSWORD_MISMATCH: "As senhas informadas não coincidem.",
  INVALID_EMAIL: "Informe um e-mail válido.",
  SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
  RECOVERY_LINK_INVALID: "Este link é inválido, expirou ou já foi utilizado.",
  AUTH_RATE_LIMITED: "Muitas tentativas foram realizadas. Aguarde e tente novamente.",
  AUTH_PROVIDER_ERROR: "Não foi possível concluir o acesso agora.",
  UNSAFE_REDIRECT: "O destino solicitado não é permitido.",
});

const PROVIDER_CODE_MAP = Object.freeze({
  invalid_credentials: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  email_not_confirmed: AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED,
  user_already_exists: AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
  email_exists: AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
  weak_password: AUTH_ERROR_CODES.PASSWORD_TOO_SHORT,
  over_email_send_rate_limit: AUTH_ERROR_CODES.AUTH_RATE_LIMITED,
  over_request_rate_limit: AUTH_ERROR_CODES.AUTH_RATE_LIMITED,
  session_not_found: AUTH_ERROR_CODES.SESSION_EXPIRED,
  refresh_token_not_found: AUTH_ERROR_CODES.SESSION_EXPIRED,
  refresh_token_already_used: AUTH_ERROR_CODES.SESSION_EXPIRED,
  otp_expired: AUTH_ERROR_CODES.RECOVERY_LINK_INVALID,
  otp_disabled: AUTH_ERROR_CODES.RECOVERY_LINK_INVALID,
});

export class AuthError extends Error {
  constructor(code, options = {}) {
    super(AUTH_MESSAGES[code] || AUTH_MESSAGES.AUTH_PROVIDER_ERROR, { cause: options.cause });
    this.name = "AuthError";
    this.code = code;
    this.status = options.status || null;
  }
}

export function authError(code, options) {
  return new AuthError(code, options);
}

export function normalizeAuthError(error, fallbackCode = AUTH_ERROR_CODES.AUTH_PROVIDER_ERROR) {
  if (error instanceof AuthError) return error;
  const providerCode = typeof error?.code === "string" ? error.code.toLowerCase() : "";
  const code = PROVIDER_CODE_MAP[providerCode]
    || (error?.status === 429 ? AUTH_ERROR_CODES.AUTH_RATE_LIMITED : fallbackCode);
  return authError(code, { cause: error, status: error?.status });
}

export function toPublicAuthError(error) {
  const normalized = normalizeAuthError(error);
  return Object.freeze({ code: normalized.code, message: normalized.message });
}

