export const GARDEN_EVIDENCE_STORAGE_KEY = "threshold.garden.observation.v1";
export const REMEMBERED_ATTENTION_SECONDS = 12;

const EMPTY_EVIDENCE = Object.freeze({
  seen: false,
  attentionSeconds: 0
});

function normalizeEvidence(value) {
  if (!value || typeof value !== "object") {
    return EMPTY_EVIDENCE;
  }

  return Object.freeze({
    seen: value.seen === true,
    attentionSeconds: Number.isFinite(value.attentionSeconds)
      ? Math.max(0, Math.floor(value.attentionSeconds))
      : 0
  });
}

function writeEvidence(storage, evidence) {
  storage.setItem(GARDEN_EVIDENCE_STORAGE_KEY, JSON.stringify(evidence));
  return evidence;
}

export function readGardenObservation(storage) {
  const raw = storage.getItem(GARDEN_EVIDENCE_STORAGE_KEY);
  if (!raw) {
    return EMPTY_EVIDENCE;
  }

  try {
    return normalizeEvidence(JSON.parse(raw));
  } catch (error) {
    throw new Error("Garden observation evidence is unreadable.", { cause: error });
  }
}

export function recordGardenSeen(storage) {
  const evidence = readGardenObservation(storage);
  return writeEvidence(storage, Object.freeze({ ...evidence, seen: true }));
}

export function recordGardenAttention(storage, seconds = 1) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError("Garden attention must be a non-negative number of seconds.");
  }

  const evidence = readGardenObservation(storage);
  return writeEvidence(storage, Object.freeze({
    seen: true,
    attentionSeconds: evidence.attentionSeconds + Math.floor(seconds)
  }));
}

export function gardenRepresentation(evidence) {
  const normalized = normalizeEvidence(evidence);
  if (normalized.attentionSeconds >= REMEMBERED_ATTENTION_SECONDS) {
    return "remembered";
  }
  if (normalized.seen) {
    return "seen";
  }
  return "idea";
}
