export const MARKET_ERRORS = {
  PROVIDER_NOT_CONFIGURED: "PROVIDER_NOT_CONFIGURED",
  RATE_LIMITED: "RATE_LIMITED",
  TIMEOUT: "TIMEOUT",
  ASSET_NOT_FOUND: "ASSET_NOT_FOUND",
  INVALID_TICKER: "INVALID_TICKER",
  NETWORK_ERROR: "NETWORK_ERROR",
  PROVIDER_ERROR: "PROVIDER_ERROR",
};

export class MarketError extends Error {
  constructor(code, message = code, status = 400) {
    super(message);
    this.name = "MarketError";
    this.code = code;
    this.status = status;
  }
}

export function marketErrorResponse(error) {
  const code = error?.code || MARKET_ERRORS.PROVIDER_ERROR;
  const status = error?.status || (code === MARKET_ERRORS.PROVIDER_NOT_CONFIGURED ? 503 : 500);
  return Response.json({ ok: false, error: { code, message: userMarketMessage(code) } }, { status });
}

export function userMarketMessage(code) {
  const messages = {
    [MARKET_ERRORS.PROVIDER_NOT_CONFIGURED]: "O provedor de mercado ainda nao esta configurado.",
    [MARKET_ERRORS.RATE_LIMITED]: "O limite temporario de consultas foi atingido.",
    [MARKET_ERRORS.TIMEOUT]: "Nao foi possivel atualizar as cotacoes agora.",
    [MARKET_ERRORS.ASSET_NOT_FOUND]: "O ativo informado nao foi encontrado.",
    [MARKET_ERRORS.INVALID_TICKER]: "O ticker informado e invalido.",
    [MARKET_ERRORS.NETWORK_ERROR]: "Nao foi possivel conectar ao provedor de mercado.",
    [MARKET_ERRORS.PROVIDER_ERROR]: "Nao foi possivel consultar o provedor de mercado.",
  };
  return messages[code] || messages[MARKET_ERRORS.PROVIDER_ERROR];
}
