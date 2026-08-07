import { normalizePortfolioHistory } from "../data/portfolioHistory.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { localPortfolioSnapshotsRepository } from "../repositories/local/localPortfolioSnapshotsRepository.js";
import { supabasePortfolioSnapshotsRepository } from "../repositories/supabase/supabasePortfolioSnapshotsRepository.js";
import { supabasePortfoliosRepository } from "../repositories/supabase/supabasePortfoliosRepository.js";
import { invalidateRemotePortfolioCache } from "./dataSourceResolver.js";

function comparable(snapshot) {
  return ["totalInvested", "currentValue", "profitLoss", "dividends", "positionsCount"]
    .map((field) => Number(snapshot[field]).toFixed(8)).join("|");
}

export function reconcileSnapshots(localInput, remoteInput) {
  const local = normalizePortfolioHistory(localInput);
  const remote = normalizePortfolioHistory(remoteInput);
  const remoteByDate = new Map(remote.map((snapshot) => [snapshot.date, snapshot]));
  const missing = [], identical = [], conflicts = [];
  local.forEach((snapshot) => {
    const existing = remoteByDate.get(snapshot.date);
    if (!existing) missing.push(snapshot);
    else if (comparable(existing) === comparable(snapshot)) identical.push(snapshot);
    else conflicts.push({ date: snapshot.date, local: snapshot, remote: existing });
  });
  return { local, remote, missing, identical, conflicts };
}

export async function previewLocalSnapshotsImport() {
  const portfolio = await supabasePortfoliosRepository.getActive();
  if (!portfolio) throw new Error("NO_ACTIVE_PORTFOLIO");
  const [local, remote] = await Promise.all([
    localPortfolioSnapshotsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    supabasePortfolioSnapshotsRepository.listByPortfolio(portfolio.id),
  ]);
  const { missing, identical, conflicts } = reconcileSnapshots(local, remote);
  return {
    portfolio, localCount: local.length, remoteCount: remote.length,
    missing, identical, conflicts,
    period: local.length ? { start: local[0].date, end: local.at(-1).date } : null,
  };
}

export async function importLocalSnapshots({ confirmed = false } = {}) {
  if (!confirmed) throw new Error("CONFIRMATION_REQUIRED");
  const preview = await previewLocalSnapshotsImport();
  if (!["owner", "editor"].includes(preview.portfolio.role)) throw new Error("READ_ONLY_SOURCE");
  for (const snapshot of preview.missing) {
    await supabasePortfolioSnapshotsRepository.upsertDaily({ ...snapshot, portfolioId: preview.portfolio.id });
  }
  invalidateRemotePortfolioCache(preview.portfolio.id);
  return { ...preview, imported: preview.missing.length };
}
