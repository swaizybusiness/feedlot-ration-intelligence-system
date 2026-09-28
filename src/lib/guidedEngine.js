import { calculateIntegrated, integratedDefaults } from './engine.js';

const finite = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const guidedDefaults = Object.freeze({
  ...integratedDefaults,
  heads: 100,
  purchaseWeight: 320,
  purchasePrice: 58000,
  daysOnFeed: 120,
  adg: 1.30,
  asFedIntake: 22,
  dryMatterPct: 48,
  feedWastePct: 3,
  rationPrice: 4200,
  dressingPct: 55.5,
  carcassPrice: 110000,
  byproductRevenuePerSoldHead: 1400000,
  targetProfitPerInitialHead: 2000000,
});

export function calculateGuided(raw = {}) {
  const state = { ...guidedDefaults, ...raw };
  const result = calculateIntegrated(state);

  const slaughterScenarios = [0, 7, 14, 21].map((extraDays) => {
    const scenarioState = {
      ...state,
      daysOnFeed: finite(state.daysOnFeed) + extraDays,
    };
    const scenario = calculateIntegrated(scenarioState);
    return {
      extraDays,
      totalDays: scenario.x.daysOnFeed,
      finalWeight: scenario.finalFeedlotWeight,
      slaughterWeight: scenario.slaughterLiveWeight,
      netHCW: scenario.netHCW,
      profitPerHead: scenario.carcassProfitPerInitialHead,
      lotProfit: scenario.lotCarcassProfit,
      result: scenario,
    };
  });

  const bestSlaughter = slaughterScenarios.reduce((best, current) =>
    current.profitPerHead > best.profitPerHead ? current : best
  , slaughterScenarios[0]);

  const leakages = [
    ['Mortality', result.mortalityEconomicImpact, 'Kehilangan karena sapi mati sebelum menghasilkan revenue penuh.'],
    ['Shrink kedatangan', result.arrivalShrinkEconomicImpact, 'Bobot yang dibayar lebih besar daripada bobot efektif saat tiba.'],
    ['Shrink sebelum potong', result.preSlaughterShrinkEconomicImpact, 'Bobot hidup turun sebelum menjadi basis karkas.'],
    ['Trim karkas', result.trimEconomicImpact, 'Bagian karkas yang tidak menjadi karkas jual bersih.'],
    ['Pakan terbuang', result.feedWasteEconomicImpact, 'Pakan dibayar tetapi tidak berubah menjadi konsumsi produktif.'],
    ['Cooler shrink', result.coolerShrinkRevenueImpact, 'Bobot karkas hilang selama pendinginan.'],
  ].map(([name, impact, explanation]) => ({
    name,
    impact: Math.max(0, finite(impact)),
    explanation,
  })).sort((a, b) => b.impact - a.impact);

  const profit = result.carcassProfitPerInitialHead;
  const target = result.x.targetProfitPerInitialHead;
  const status = profit < 0
    ? 'loss'
    : profit >= target
      ? 'target'
      : 'profit';

  const buyGapPerKg = result.maxPurchasePriceTarget - result.x.purchasePrice;
  const dressingSafetyMargin = result.x.dressingPct - result.requiredDressingBreakEvenPct;

  return {
    state: result.x,
    result,
    status,
    buyGapPerKg,
    dressingSafetyMargin,
    slaughterScenarios,
    bestSlaughter,
    leakages,
    largestLeakage: leakages[0] || null,
    slaughterAction: bestSlaughter.extraDays === 0
      ? 'Potong sekarang'
      : `Pertimbangkan lanjut ${bestSlaughter.extraDays} hari`,
  };
}
