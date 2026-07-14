export const DEFAULT_DIAGNOSTIC_RULES = Object.freeze({
  maxPositionPercent: 30,
  maxTopThreePercent: 70,
  maxClassPercent: 60,
  minimumAssets: 5,
  minimumClasses: 3,
  maxIncomeSourcePercent: 60,
  maxQuoteAgeDays: 7,
  minimumIncomeMonths: 6,
  targetAllocationTolerancePercent: 0.1,
  incomeFocusMinimumPercent: 50,
  growthFocusMinimumPercent: 50,
  balancedFocusMaximumClassPercent: 70,
  behaviorMinimumHistoryMonths: 6,
  behaviorMinimumOperations: 6,
  behaviorMinimumClosedPositions: 2,
  behaviorShortHoldingDays: 30,
  behaviorNearbyOperationDays: 7,
  behaviorRelevantRhythmDifferencePercent: 25,
  behaviorContributionConcentrationPercent: 70,
  behaviorMinimumSalesForTurnover: 3,
  scoreWeights: Object.freeze({
    diversification: Object.freeze({ assets: 0.4, classes: 0.35, sectors: 0.25 }),
    concentration: Object.freeze({ largestPosition: 0.5, topThree: 0.3, largestClass: 0.2 }),
    incomeResilience: Object.freeze({ sourceConcentration: 0.7, history: 0.3 }),
    dataQuality: Object.freeze({ quotes: 0.45, quoteFreshness: 0.2, metadata: 0.25, operations: 0.1 }),
    behaviorConsistency: Object.freeze({ regularity: 0.35, rhythmStability: 0.25, assetDispersion: 0.25, historySufficiency: 0.15 }),
  }),
});

const allowedParameters = ["targetAllocation", "maxPositionPercent", "maxClassPercent", "preferredCountries", "preferredCurrencies", "riskProfile", "investmentFocus"];

export function resolveDiagnosticRules(parameters = {}) {
  const custom = {};
  allowedParameters.forEach((key) => { if (parameters[key] !== undefined) custom[key] = parameters[key]; });
  return {
    ...DEFAULT_DIAGNOSTIC_RULES,
    ...custom,
    maxPositionPercent: positive(custom.maxPositionPercent, DEFAULT_DIAGNOSTIC_RULES.maxPositionPercent),
    maxClassPercent: positive(custom.maxClassPercent, DEFAULT_DIAGNOSTIC_RULES.maxClassPercent),
  };
}

function positive(value, fallback) {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
}
