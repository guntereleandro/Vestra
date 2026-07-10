export const JOURNEY_RECORDS_KEY = "vestra:journeyRecords:v1";

function parse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeRecord(record, key) {
  if (!record || typeof record !== "object") return null;
  const value = safeNumber(record.value);
  if (value <= 0) return null;
  return {
    key,
    value,
    date: typeof record.date === "string" && record.date ? record.date : new Date().toISOString().slice(0, 10),
    label: typeof record.label === "string" ? record.label : "",
    ticker: typeof record.ticker === "string" ? record.ticker : "",
    recordedAt: Number.isFinite(Number(record.recordedAt)) ? Number(record.recordedAt) : Date.now(),
  };
}

export function normalizeJourneyRecords(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce((records, [key, record]) => {
    const normalized = normalizeRecord(record, key);
    if (normalized) records[key] = normalized;
    return records;
  }, {});
}

export function readJourneyRecords() {
  if (typeof localStorage === "undefined") return {};
  return normalizeJourneyRecords(parse(localStorage.getItem(JOURNEY_RECORDS_KEY), {}));
}

export function writeJourneyRecords(records) {
  if (typeof localStorage === "undefined") return {};
  const normalized = normalizeJourneyRecords(records);
  localStorage.setItem(JOURNEY_RECORDS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function mergeJourneyRecords(currentRecords, candidates) {
  const current = normalizeJourneyRecords(currentRecords);
  const next = { ...current };
  candidates.forEach((candidate) => {
    if (!candidate?.key || safeNumber(candidate.value) <= 0) return;
    const previous = next[candidate.key];
    if (!previous || safeNumber(candidate.value) > safeNumber(previous.value)) {
      next[candidate.key] = normalizeRecord({ ...candidate, recordedAt: Date.now() }, candidate.key);
    }
  });
  return next;
}
