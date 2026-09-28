const clamp = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const safeDiv = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : 0);
const requiredDiv = (numerator, denominator) => {
  if (numerator <= 0) return 0;
  return denominator > 0 ? numerator / denominator : Number.POSITIVE_INFINITY;
};

export const quickLiveDefaults = Object.freeze({
  heads: 1,
  purchaseWeight: 320,
  purchasePrice: 58000,
  saleWeight: 470,
  salePrice: 62000,
  additionalCostPerHead: 8000000,
  targetProfitPerHead: 2000000,
});

export const quickCarcassDefaults = Object.freeze({
  heads: 1,
  liveWeight: 480,
  livePrice: 60000,
  dressingPct: 55,
  carcassPrice: 112000,
  additionalCostPerHead: 1000000,
  byproductRevenuePerHead: 1800000,
  targetProfitPerHead: 1500000,
});

function normalizeLive(raw = {}) {
  const x = { ...quickLiveDefaults, ...raw };
  return {
    heads: clamp(x.heads, 1, 1000000),
    purchaseWeight: clamp(x.purchaseWeight, 0, 2000),
    purchasePrice: clamp(x.purchasePrice, 0, 1000000),
    saleWeight: clamp(x.saleWeight, 0, 2000),
    salePrice: clamp(x.salePrice, 0, 1000000),
    additionalCostPerHead: clamp(x.additionalCostPerHead),
    targetProfitPerHead: clamp(x.targetProfitPerHead),
  };
}

export function calculateQuickLive(raw = {}) {
  const x = normalizeLive(raw);
  const purchaseCost = x.purchaseWeight * x.purchasePrice;
  const saleRevenue = x.saleWeight * x.salePrice;
  const totalCost = purchaseCost + x.additionalCostPerHead;
  const profit = saleRevenue - totalCost;
  const marginPct = safeDiv(profit, saleRevenue) * 100;
  const returnOnCostPct = safeDiv(profit, totalCost) * 100;
  const breakEvenSalePrice = x.saleWeight > 0 ? totalCost / x.saleWeight : 0;
  const targetSalePrice = x.saleWeight > 0 ? (totalCost + x.targetProfitPerHead) / x.saleWeight : 0;
  const maxPurchaseCostTarget = Math.max(0, saleRevenue - x.additionalCostPerHead - x.targetProfitPerHead);
  const maxPurchasePriceTarget = x.purchaseWeight > 0 ? maxPurchaseCostTarget / x.purchaseWeight : 0;
  const breakEvenSaleWeight = x.salePrice > 0 ? totalCost / x.salePrice : 0;
  const targetSaleWeight = x.salePrice > 0 ? (totalCost + x.targetProfitPerHead) / x.salePrice : 0;

  return {
    x,
    purchaseCost,
    saleRevenue,
    totalCost,
    profit,
    marginPct,
    returnOnCostPct,
    breakEvenSalePrice,
    targetSalePrice,
    maxPurchaseCostTarget,
    maxPurchasePriceTarget,
    breakEvenSaleWeight,
    targetSaleWeight,
    lotPurchaseCost: purchaseCost * x.heads,
    lotRevenue: saleRevenue * x.heads,
    lotProfit: profit * x.heads,
  };
}

function normalizeCarcass(raw = {}) {
  const x = { ...quickCarcassDefaults, ...raw };
  return {
    heads: clamp(x.heads, 1, 1000000),
    liveWeight: clamp(x.liveWeight, 0, 2000),
    livePrice: clamp(x.livePrice, 0, 1000000),
    dressingPct: clamp(x.dressingPct, 0, 100),
    carcassPrice: clamp(x.carcassPrice, 0, 1000000),
    additionalCostPerHead: clamp(x.additionalCostPerHead),
    byproductRevenuePerHead: clamp(x.byproductRevenuePerHead),
    targetProfitPerHead: clamp(x.targetProfitPerHead),
  };
}

export function calculateQuickCarcass(raw = {}) {
  const x = normalizeCarcass(raw);
  const dressing = x.dressingPct / 100;
  const purchaseCost = x.liveWeight * x.livePrice;
  const carcassWeight = x.liveWeight * dressing;
  const carcassRevenue = carcassWeight * x.carcassPrice;
  const totalRevenue = carcassRevenue + x.byproductRevenuePerHead;
  const totalCost = purchaseCost + x.additionalCostPerHead;
  const profit = totalRevenue - totalCost;
  const marginPct = safeDiv(profit, totalRevenue) * 100;
  const returnOnCostPct = safeDiv(profit, totalCost) * 100;

  const breakEvenRevenueNeededFromCarcass = Math.max(0, totalCost - x.byproductRevenuePerHead);
  const targetRevenueNeededFromCarcass = Math.max(0, totalCost + x.targetProfitPerHead - x.byproductRevenuePerHead);
  const requiredCarcassWeightBreakEven = requiredDiv(breakEvenRevenueNeededFromCarcass, x.carcassPrice);
  const requiredCarcassWeightTarget = requiredDiv(targetRevenueNeededFromCarcass, x.carcassPrice);
  const requiredDressingBreakEvenPct = requiredDiv(requiredCarcassWeightBreakEven, x.liveWeight) * 100;
  const requiredDressingTargetPct = requiredDiv(requiredCarcassWeightTarget, x.liveWeight) * 100;
  const requiredCarcassPriceBreakEven = requiredDiv(breakEvenRevenueNeededFromCarcass, carcassWeight);
  const requiredCarcassPriceTarget = requiredDiv(targetRevenueNeededFromCarcass, carcassWeight);
  const breakEvenDressingFeasible = Number.isFinite(requiredDressingBreakEvenPct) && requiredDressingBreakEvenPct <= 100;
  const targetDressingFeasible = Number.isFinite(requiredDressingTargetPct) && requiredDressingTargetPct <= 100;
  const maxPurchaseCostTarget = Math.max(0, totalRevenue - x.additionalCostPerHead - x.targetProfitPerHead);
  const maxLivePriceTarget = x.liveWeight > 0 ? maxPurchaseCostTarget / x.liveWeight : 0;
  const requiredByproductTarget = Math.max(0, totalCost + x.targetProfitPerHead - carcassRevenue);

  return {
    x,
    purchaseCost,
    carcassWeight,
    carcassRevenue,
    totalRevenue,
    totalCost,
    profit,
    marginPct,
    returnOnCostPct,
    requiredCarcassWeightBreakEven,
    requiredCarcassWeightTarget,
    requiredDressingBreakEvenPct,
    requiredDressingTargetPct,
    requiredCarcassPriceBreakEven,
    requiredCarcassPriceTarget,
    breakEvenDressingFeasible,
    targetDressingFeasible,
    maxPurchaseCostTarget,
    maxLivePriceTarget,
    requiredByproductTarget,
    lotPurchaseCost: purchaseCost * x.heads,
    lotRevenue: totalRevenue * x.heads,
    lotProfit: profit * x.heads,
  };
}
