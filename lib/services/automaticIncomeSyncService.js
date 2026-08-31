import "server-only";
import { createAdminSupabaseClient } from "../supabase/client/adminClient.js";
import { createSupabaseOperationsRepository } from "../repositories/supabase/supabaseOperationsRepository.js";
import { createSupabaseAssetsRepository } from "../repositories/supabase/supabaseAssetsRepository.js";
import { fetchIncomeEventsWithConcurrency } from "../market/providers/brapiCorporateIncomeProvider.js";
import { resolveIncomeEligibilityDate, calculateEligibleQuantity } from "../engine/incomeEligibility.js";
import { buildIncomeExpectation } from "../engine/incomeExpectation.js";
import { matchIncomeExpectation } from "../engine/incomeMatching.js";

const WINDOW_DAYS = 550;
function startDate() { const date = new Date(); date.setUTCDate(date.getUTCDate() - WINDOW_DAYS); return date.toISOString().slice(0, 10); }
function relevantAssets(assets, operations) {
  const tickers = new Set(operations.filter((operation) => operation.date >= startDate()).flatMap((operation) => [operation.ticker, operation.targetTicker]).filter(Boolean));
  return assets.filter((asset) => tickers.has(asset.ticker));
}
function eventRow(event) { return { canonical_asset_id: event.canonicalAssetId, ticker: event.ticker, asset_name: event.assetName, event_type: event.eventType, status: event.status, record_date: event.recordDate, ex_date: event.exDate, declaration_date: event.declarationDate, payment_date: event.paymentDate, gross_amount_per_unit: event.grossAmountPerUnit, currency: event.currency, installment: event.installment, period: event.period, source: event.source, source_confidence: event.sourceConfidence, canonical_identity: event.canonicalIdentity, source_updated_at: event.sourceUpdatedAt }; }

async function storeEvent(admin, candidate) {
  const { data: alias } = await admin.from("corporate_income_event_aliases")
    .select("id, event_id, corporate_income_events(id, canonical_identity, version, version_history, status)")
    .eq("provider", candidate.alias.provider).eq("external_identity_hash", candidate.alias.externalIdentityHash).maybeSingle();
  const previous = alias?.corporate_income_events;
  if (previous?.canonical_identity === candidate.event.canonicalIdentity) return { event: previous, created: false, corrected: false };
  const { data: canonical } = await admin.from("corporate_income_events").select("id, version, canonical_identity").eq("canonical_identity", candidate.event.canonicalIdentity).maybeSingle();
  if (canonical) return { event: canonical, created: false, corrected: false };
  const row = eventRow(candidate.event);
  if (previous) {
    row.version = previous.version + 1;
    row.version_history = [...(previous.version_history || []), { eventId: previous.id, version: previous.version, canonicalIdentity: previous.canonical_identity, status: previous.status }];
  }
  const { data: stored, error } = await admin.from("corporate_income_events").insert(row).select("id, version, canonical_identity").single();
  if (error) throw error;
  if (previous) await admin.from("corporate_income_events").update({ status: "CORRECTED" }).eq("id", previous.id);
  return { event: stored, created: true, corrected: Boolean(previous), previousEventId: previous?.id };
}

export async function syncAutomaticIncome({ portfolioId, serverClient, dryRun = false }) {
  const operationsRepository = createSupabaseOperationsRepository(serverClient);
  const assetsRepository = createSupabaseAssetsRepository(serverClient);
  const [operations, assets] = await Promise.all([operationsRepository.listByPortfolio(portfolioId), assetsRepository.listByPortfolio(portfolioId)]);
  const queriedAssets = relevantAssets(assets, operations);
  const coverage = await fetchIncomeEventsWithConcurrency(queriedAssets, { startDate: startDate(), endDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10) });
  const candidates = [];
  for (const result of coverage) for (const candidate of result.events) {
    const cutoff = resolveIncomeEligibilityDate({ ...candidate.event, lastDatePrior: candidate.event.recordDate });
    const quantity = calculateEligibleQuantity(operations, candidate.event.ticker, cutoff.date);
    if (!cutoff.date || quantity <= 0) continue;
    const expectation = buildIncomeExpectation({ ...candidate.event, lastDatePrior: candidate.event.recordDate }, quantity);
    candidates.push({ ...candidate, cutoff, expectation, match: matchIncomeExpectation({ ...expectation, eventType: candidate.event.eventType, ticker: candidate.event.ticker }, operations) });
  }
  if (dryRun) return { dryRun: true, queriedAssets: queriedAssets.length, coverage, candidateCount: candidates.length, eventsCreated: 0, expectationsCreated: 0, operationsCreated: 0 };
  const admin = createAdminSupabaseClient(); let eventsCreated = 0; let expectationsCreated = 0;
  for (const candidate of candidates) {
    const storedResult = await storeEvent(admin, candidate); const stored = storedResult.event;
    if (storedResult.created) eventsCreated += 1;
    const { error: aliasError } = await admin.from("corporate_income_event_aliases").upsert({ provider: candidate.alias.provider, external_id: candidate.alias.externalId, external_identity_hash: candidate.alias.externalIdentityHash, event_id: stored.id, raw_hash: candidate.alias.rawHash, last_seen_at: new Date().toISOString(), metadata: {} }, { onConflict: "provider,external_identity_hash" });
    if (aliasError) throw aliasError;
    const expectationRow = { portfolio_id: portfolioId, event_id: stored.id, eligible_quantity: candidate.expectation.eligibleQuantity, gross_amount: candidate.expectation.grossAmount, known_withholding_amount: candidate.expectation.knownWithholdingAmount, expected_net_amount: candidate.expectation.expectedNetAmount, currency: candidate.expectation.currency, eligibility_date: candidate.expectation.eligibilityDate, expected_payment_date: candidate.expectation.expectedPaymentDate, status: candidate.event.status === "CANCELLED" ? "CANCELLED" : "EXPECTED", confidence: candidate.expectation.confidence, match_status: candidate.match.status, match_candidate_operation_id: ["EXACT_MATCH", "LIKELY_MATCH"].includes(candidate.match.status) ? candidate.match.operationId : null, event_version: stored.version };
    let { data: existingExpectation } = await admin.from("portfolio_income_expectations").select("id, status").eq("portfolio_id", portfolioId).eq("event_id", stored.id).maybeSingle();
    if (!existingExpectation && storedResult.previousEventId) {
      const { data: previousExpectation } = await admin.from("portfolio_income_expectations").select("id, status").eq("portfolio_id", portfolioId).eq("event_id", storedResult.previousEventId).maybeSingle();
      if (previousExpectation && previousExpectation.status === "RECONCILED") {
        await admin.from("portfolio_income_expectations").update({ status: "CONFLICT", source_changed_at: new Date().toISOString() }).eq("id", previousExpectation.id);
        continue;
      }
      if (previousExpectation) {
        const { error } = await admin.from("portfolio_income_expectations").update({ ...expectationRow, source_changed_at: new Date().toISOString() }).eq("id", previousExpectation.id);
        if (error) throw error; existingExpectation = { ...previousExpectation, status: expectationRow.status };
      }
    }
    if (!existingExpectation) { const { error } = await admin.from("portfolio_income_expectations").insert(expectationRow); if (error) throw error; expectationsCreated += 1; }
    else if (candidate.event.status === "CANCELLED" && existingExpectation.status === "RECONCILED") { const { error } = await admin.from("portfolio_income_expectations").update({ status: "CONFLICT", source_changed_at: new Date().toISOString() }).eq("id", existingExpectation.id); if (error) throw error; }
    else if (!["IGNORED", "RECONCILED"].includes(existingExpectation.status)) { const { error } = await admin.from("portfolio_income_expectations").update(expectationRow).eq("id", existingExpectation.id); if (error) throw error; }
  }
  return { dryRun: false, queriedAssets: queriedAssets.length, coverage, candidateCount: candidates.length, eventsCreated, expectationsCreated, operationsCreated: 0 };
}
