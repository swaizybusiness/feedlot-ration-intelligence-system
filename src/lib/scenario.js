const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Build four dressing-percentage scenarios around the economic minimum.
 * The second slot is the first 2-point step that meets or exceeds the target.
 * Examples: 56.00 -> [54,56,58,60], 55.20 -> [54,56,58,60], 48.31 -> [48,50,52,54].
 */
export function buildDressingScenarioSteps(requiredPct) {
  const required = Number.isFinite(Number(requiredPct)) ? Number(requiredPct) : 0;
  const bounded = clamp(required, 0, 100);
  const anchor = Math.ceil(bounded / 2) * 2;
  let start = anchor - 2;

  if (start < 0) start = 0;
  if (start + 6 > 100) start = 94;

  return [start, start + 2, start + 4, start + 6];
}
