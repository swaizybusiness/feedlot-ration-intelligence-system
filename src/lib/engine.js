const clamp = (n, min = 0, max = Number.POSITIVE_INFINITY) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const safeDiv = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : 0);
const pct = (n) => clamp(n, 0, 100) / 100;

export const integratedDefaults = Object.freeze({
  heads: 1000,
  purchaseWeight: 320,
  purchasePrice: 58000,
  arrivalShrinkPct: 3.5,
  freightPerHead: 450000,
  commissionPerHead: 150000,
  mortalityPct: 0.8,
  deathTimingPct: 50,
  daysOnFeed: 120,
  adg: 1.3,
  asFedIntake: 22,
  dryMatterPct: 48,
  feedWastePct: 3,
  rationPrice: 4200,
  healthPerAnimalDay: 2500,
  laborPerAnimalDay: 3500,
  yardagePerAnimalDay: 2500,
  fixedOverheadPerInitialHead: 450000,
  otherProductionCostPerInitialHead: 250000,
  annualInterestPct: 10,
  operatingCapitalExposurePct: 50,
  preSlaughterShrinkPct: 2,
  dressingPct: 55.5,
  entryDressingPct: 49,
  trimPct: 0.8,
  carcassPrice: 110000,
  slaughterCostPerSoldHead: 600000,
  byproductRevenuePerSoldHead: 1400000,
  coolerShrinkPct: 2,
  boningYieldPct: 70,
  blendedMeatPrice: 165000,
  processingCostPerSoldHead: 850000,
  targetProfitPerInitialHead: 2000000,
  targetMarginPct: 5,
  targetRoiPct: 8,
});

export const jagalDefaults = Object.freeze({
  heads: 100,
  liveWeight: 480,
  livePrice: 60000,
  purchaseBasisShrinkPct: 0,
  preSlaughterShrinkPct: 2,
  inboundPerHead: 350000,
  holdingPerHead: 150000,
  dressingPct: 55,
  trimPct: 0.8,
  carcassPrice: 112000,
  slaughterCostPerHead: 550000,
  overheadPerHead: 300000,
  byproductRevenuePerHead: 1800000,
  coolerShrinkPct: 2,
  boningYieldPct: 70,
  blendedMeatPrice: 168000,
  processingCostPerHead: 900000,
  targetProfitPerHead: 1500000,
  targetMarginPct: 5,
  targetRoiPct: 7,
});

function normalizeIntegrated(raw = {}) {
  const x = { ...integratedDefaults, ...raw };
  return {
    ...x,
    heads: clamp(x.heads, 1, 1_000_000),
    purchaseWeight: clamp(x.purchaseWeight, 1, 2000),
    purchasePrice: clamp(x.purchasePrice, 0, 1_000_000),
    arrivalShrinkPct: clamp(x.arrivalShrinkPct, 0, 30),
    freightPerHead: clamp(x.freightPerHead),
    commissionPerHead: clamp(x.commissionPerHead),
    mortalityPct: clamp(x.mortalityPct, 0, 99),
    deathTimingPct: clamp(x.deathTimingPct, 0, 100),
    daysOnFeed: clamp(x.daysOnFeed, 1, 1000),
    adg: clamp(x.adg, 0, 10),
    asFedIntake: clamp(x.asFedIntake, 0, 200),
    dryMatterPct: clamp(x.dryMatterPct, 1, 100),
    feedWastePct: clamp(x.feedWastePct, 0, 50),
    rationPrice: clamp(x.rationPrice, 0, 500_000),
    healthPerAnimalDay: clamp(x.healthPerAnimalDay),
    laborPerAnimalDay: clamp(x.laborPerAnimalDay),
    yardagePerAnimalDay: clamp(x.yardagePerAnimalDay),
    fixedOverheadPerInitialHead: clamp(x.fixedOverheadPerInitialHead),
    otherProductionCostPerInitialHead: clamp(x.otherProductionCostPerInitialHead),
    annualInterestPct: clamp(x.annualInterestPct, 0, 100),
    operatingCapitalExposurePct: clamp(x.operatingCapitalExposurePct, 0, 100),
    preSlaughterShrinkPct: clamp(x.preSlaughterShrinkPct, 0, 30),
    dressingPct: clamp(x.dressingPct, 1, 90),
    entryDressingPct: clamp(x.entryDressingPct, 1, 90),
    trimPct: clamp(x.trimPct, 0, 30),
    carcassPrice: clamp(x.carcassPrice, 0, 1_000_000),
    slaughterCostPerSoldHead: clamp(x.slaughterCostPerSoldHead),
    byproductRevenuePerSoldHead: clamp(x.byproductRevenuePerSoldHead),
    coolerShrinkPct: clamp(x.coolerShrinkPct, 0, 20),
    boningYieldPct: clamp(x.boningYieldPct, 1, 100),
    blendedMeatPrice: clamp(x.blendedMeatPrice, 0, 2_000_000),
    processingCostPerSoldHead: clamp(x.processingCostPerSoldHead),
    targetProfitPerInitialHead: clamp(x.targetProfitPerInitialHead),
    targetMarginPct: clamp(x.targetMarginPct, 0, 95),
    targetRoiPct: clamp(x.targetRoiPct, 0, 500),
  };
}

function integratedCore(raw = {}) {
  const x = normalizeIntegrated(raw);
  const mortality = pct(x.mortalityPct);
  const survival = 1 - mortality;
  const deathTiming = pct(x.deathTimingPct);
  const arrivalShrink = pct(x.arrivalShrinkPct);
  const preSlaughterShrink = pct(x.preSlaughterShrinkPct);
  const dressing = pct(x.dressingPct);
  const entryDressing = pct(x.entryDressingPct);
  const trim = pct(x.trimPct);
  const coolerShrink = pct(x.coolerShrinkPct);
  const boningYield = pct(x.boningYieldPct);
  const feedWaste = pct(x.feedWastePct);
  const operatingExposure = pct(x.operatingCapitalExposurePct);

  const purchaseAnimalCost = x.purchaseWeight * x.purchasePrice;
  const landedPurchaseCost = purchaseAnimalCost + x.freightPerHead + x.commissionPerHead;
  const arrivalWeight = x.purchaseWeight * (1 - arrivalShrink);
  const liveGain = x.adg * x.daysOnFeed;
  const finalFeedlotWeight = arrivalWeight + liveGain;
  const slaughterLiveWeight = finalFeedlotWeight * (1 - preSlaughterShrink);
  const averageLiveWeight = (arrivalWeight + finalFeedlotWeight) / 2;

  const expectedSoldHeads = x.heads * survival;
  const effectiveDaysPerInitialHead = x.daysOnFeed * (survival + mortality * deathTiming);
  const totalAnimalDays = x.heads * effectiveDaysPerInitialHead;

  const dmiPerDay = x.asFedIntake * pct(x.dryMatterPct);
  const feedPurchasedPerDay = x.asFedIntake * (1 + feedWaste);
  const feedCostPerDay = feedPurchasedPerDay * x.rationPrice;
  const feedCostPerInitialHead = feedCostPerDay * effectiveDaysPerInitialHead;
  const healthCostPerInitialHead = x.healthPerAnimalDay * effectiveDaysPerInitialHead;
  const laborCostPerInitialHead = x.laborPerAnimalDay * effectiveDaysPerInitialHead;
  const yardageCostPerInitialHead = x.yardagePerAnimalDay * effectiveDaysPerInitialHead;
  const exitCostPerInitialHead = survival * x.slaughterCostPerSoldHead;

  const operatingCostPreFinance =
    feedCostPerInitialHead +
    healthCostPerInitialHead +
    laborCostPerInitialHead +
    yardageCostPerInitialHead +
    x.fixedOverheadPerInitialHead +
    x.otherProductionCostPerInitialHead +
    exitCostPerInitialHead;

  const periodRate = pct(x.annualInterestPct) * safeDiv(x.daysOnFeed, 365);
  const purchaseFinancing = landedPurchaseCost * periodRate;
  const operatingFinancing = operatingCostPreFinance * periodRate * operatingExposure;
  const financingCostPerInitialHead = purchaseFinancing + operatingFinancing;
  const finishingCostPerInitialHead = operatingCostPreFinance + financingCostPerInitialHead;
  const allInCostPerInitialHead = landedPurchaseCost + finishingCostPerInitialHead;

  const grossHCW = slaughterLiveWeight * dressing;
  const trimKg = grossHCW * trim;
  const netHCW = grossHCW - trimKg;
  const effectiveNetDressingPct = safeDiv(netHCW, slaughterLiveWeight) * 100;
  const coldCarcassWeight = netHCW * (1 - coolerShrink);
  const coolerLossKg = netHCW - coldCarcassWeight;
  const saleableMeatWeight = coldCarcassWeight * boningYield;
  const liveToMeatYieldPct = safeDiv(saleableMeatWeight, slaughterLiveWeight) * 100;

  const carcassRevenuePerSoldHead = netHCW * x.carcassPrice;
  const totalRevenuePerSoldHead = carcassRevenuePerSoldHead + x.byproductRevenuePerSoldHead;
  const expectedRevenuePerInitialHead = survival * totalRevenuePerSoldHead;
  const carcassProfitPerInitialHead = expectedRevenuePerInitialHead - allInCostPerInitialHead;
  const carcassProfitPerSoldHead = safeDiv(carcassProfitPerInitialHead, survival);
  const carcassMarginPct = safeDiv(carcassProfitPerInitialHead, expectedRevenuePerInitialHead) * 100;
  const carcassRoiPct = safeDiv(carcassProfitPerInitialHead, allInCostPerInitialHead) * 100;

  const meatRevenuePerSoldHead = saleableMeatWeight * x.blendedMeatPrice + x.byproductRevenuePerSoldHead;
  const meatRevenuePerInitialHead = survival * meatRevenuePerSoldHead;
  const meatCostPerInitialHead = allInCostPerInitialHead + survival * x.processingCostPerSoldHead;
  const meatProfitPerInitialHead = meatRevenuePerInitialHead - meatCostPerInitialHead;
  const meatMarginPct = safeDiv(meatProfitPerInitialHead, meatRevenuePerInitialHead) * 100;

  const soldGainEquivalent = survival * liveGain;
  const dmiExpectedPerInitialHead = dmiPerDay * effectiveDaysPerInitialHead;
  const fcrDM = safeDiv(dmiExpectedPerInitialHead, soldGainEquivalent);
  const feedCostOfGain = safeDiv(feedCostPerInitialHead, soldGainEquivalent);
  const allInFinishingCOG = safeDiv(finishingCostPerInitialHead, soldGainEquivalent);
  const dmiPctAverageBW = safeDiv(dmiPerDay, averageLiveWeight) * 100;

  const entryCarcassEquivalent = arrivalWeight * entryDressing;
  const carcassGain = grossHCW - entryCarcassEquivalent;
  const carcassADG = safeDiv(carcassGain, x.daysOnFeed);
  const carcassCapturePct = safeDiv(carcassGain, liveGain) * 100;

  const costPerKgFinalLive = safeDiv(allInCostPerInitialHead, survival * finalFeedlotWeight);
  const costPerKgNetHCW = safeDiv(allInCostPerInitialHead, survival * netHCW);
  const carcassProfitPerKgNetHCW = safeDiv(carcassProfitPerInitialHead, survival * netHCW);
  const costPerKgSaleableMeat = safeDiv(meatCostPerInitialHead, survival * saleableMeatWeight);
  const landedCostPerKgArrival = safeDiv(landedPurchaseCost, arrivalWeight);

  const lotAllInCost = allInCostPerInitialHead * x.heads;
  const lotCarcassRevenue = expectedRevenuePerInitialHead * x.heads;
  const lotCarcassProfit = carcassProfitPerInitialHead * x.heads;
  const lotNetHCW = expectedSoldHeads * netHCW;
  const lotSaleableMeat = expectedSoldHeads * saleableMeatWeight;

  return {
    x,
    survival,
    mortality,
    purchaseAnimalCost,
    landedPurchaseCost,
    arrivalWeight,
    liveGain,
    finalFeedlotWeight,
    slaughterLiveWeight,
    averageLiveWeight,
    expectedSoldHeads,
    effectiveDaysPerInitialHead,
    totalAnimalDays,
    dmiPerDay,
    feedPurchasedPerDay,
    feedCostPerDay,
    feedCostPerInitialHead,
    healthCostPerInitialHead,
    laborCostPerInitialHead,
    yardageCostPerInitialHead,
    operatingCostPreFinance,
    financingCostPerInitialHead,
    finishingCostPerInitialHead,
    allInCostPerInitialHead,
    grossHCW,
    trimKg,
    netHCW,
    effectiveNetDressingPct,
    coldCarcassWeight,
    coolerLossKg,
    saleableMeatWeight,
    liveToMeatYieldPct,
    carcassRevenuePerSoldHead,
    totalRevenuePerSoldHead,
    expectedRevenuePerInitialHead,
    carcassProfitPerInitialHead,
    carcassProfitPerSoldHead,
    carcassMarginPct,
    carcassRoiPct,
    meatRevenuePerSoldHead,
    meatRevenuePerInitialHead,
    meatCostPerInitialHead,
    meatProfitPerInitialHead,
    meatMarginPct,
    fcrDM,
    feedCostOfGain,
    allInFinishingCOG,
    dmiPctAverageBW,
    entryCarcassEquivalent,
    carcassGain,
    carcassADG,
    carcassCapturePct,
    costPerKgFinalLive,
    costPerKgNetHCW,
    carcassProfitPerKgNetHCW,
    costPerKgSaleableMeat,
    landedCostPerKgArrival,
    lotAllInCost,
    lotCarcassRevenue,
    lotCarcassProfit,
    lotNetHCW,
    lotSaleableMeat,
  };
}

function solveUpperBound({ target, evaluate, low = 0, high, iterations = 60 }) {
  let lo = low;
  let hi = high;
  for (let i = 0; i < iterations; i += 1) {
    const mid = (lo + hi) / 2;
    if (evaluate(mid) >= target) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function calculateIntegrated(raw = {}) {
  const r = integratedCore(raw);
  const { x, survival } = r;
  const trimFactor = 1 - pct(x.trimPct);
  const preSlaughterFactor = 1 - pct(x.preSlaughterShrinkPct);
  const dressing = pct(x.dressingPct);

  const expectedByproductCredit = survival * x.byproductRevenuePerSoldHead;
  const requiredRevenueTarget = r.allInCostPerInitialHead + x.targetProfitPerInitialHead;
  const requiredRevenueBreakEven = r.allInCostPerInitialHead;
  const targetMargin = pct(x.targetMarginPct);
  const targetRoi = pct(x.targetRoiPct);
  const requiredRevenueMargin = targetMargin < 1 ? safeDiv(r.allInCostPerInitialHead, 1 - targetMargin) : Number.POSITIVE_INFINITY;
  const requiredRevenueRoi = r.allInCostPerInitialHead * (1 + targetRoi);

  const requiredNetHCWForRevenue = (requiredRevenue) =>
    survival > 0 && x.carcassPrice > 0
      ? Math.max(0, safeDiv(requiredRevenue - expectedByproductCredit, survival * x.carcassPrice))
      : 0;

  const requiredNetHCWBreakEven = requiredNetHCWForRevenue(requiredRevenueBreakEven);
  const requiredNetHCWTarget = requiredNetHCWForRevenue(requiredRevenueTarget);
  const requiredNetHCWMargin = requiredNetHCWForRevenue(requiredRevenueMargin);
  const requiredNetHCWRoi = requiredNetHCWForRevenue(requiredRevenueRoi);

  const requiredGrossHCWTarget = trimFactor > 0 ? requiredNetHCWTarget / trimFactor : 0;
  const requiredGrossHCWBreakEven = trimFactor > 0 ? requiredNetHCWBreakEven / trimFactor : 0;
  const requiredGrossHCWMargin = trimFactor > 0 ? requiredNetHCWMargin / trimFactor : 0;
  const requiredGrossHCWRoi = trimFactor > 0 ? requiredNetHCWRoi / trimFactor : 0;

  const requiredDressingBreakEvenPct = safeDiv(requiredGrossHCWBreakEven, r.slaughterLiveWeight) * 100;
  const requiredDressingTargetPct = safeDiv(requiredGrossHCWTarget, r.slaughterLiveWeight) * 100;
  const requiredDressingMarginPct = safeDiv(requiredGrossHCWMargin, r.slaughterLiveWeight) * 100;
  const requiredDressingRoiPct = safeDiv(requiredGrossHCWRoi, r.slaughterLiveWeight) * 100;

  const requiredCarcassPriceBreakEven = survival * r.netHCW > 0
    ? Math.max(0, safeDiv(requiredRevenueBreakEven - expectedByproductCredit, survival * r.netHCW))
    : 0;
  const requiredCarcassPriceTarget = survival * r.netHCW > 0
    ? Math.max(0, safeDiv(requiredRevenueTarget - expectedByproductCredit, survival * r.netHCW))
    : 0;

  const requiredSlaughterLiveWeightTarget = dressing * trimFactor > 0
    ? safeDiv(requiredNetHCWTarget, dressing * trimFactor)
    : 0;
  const requiredFinalFeedlotWeightTarget = preSlaughterFactor > 0
    ? requiredSlaughterLiveWeightTarget / preSlaughterFactor
    : 0;
  const requiredAdgTarget = Math.max(0, safeDiv(requiredFinalFeedlotWeightTarget - r.arrivalWeight, x.daysOnFeed));

  const requiredByproductTarget = survival > 0
    ? Math.max(0, safeDiv(requiredRevenueTarget, survival) - r.netHCW * x.carcassPrice)
    : 0;

  const requiredMeatPriceBreakEven = survival * r.saleableMeatWeight > 0
    ? Math.max(0, safeDiv(r.meatCostPerInitialHead - expectedByproductCredit, survival * r.saleableMeatWeight))
    : 0;
  const requiredMeatPriceTarget = survival * r.saleableMeatWeight > 0
    ? Math.max(0, safeDiv(r.meatCostPerInitialHead + x.targetProfitPerInitialHead - expectedByproductCredit, survival * r.saleableMeatWeight))
    : 0;

  const maxPurchasePriceTarget = solveUpperBound({
    target: x.targetProfitPerInitialHead,
    low: 0,
    high: 1_000_000,
    evaluate: (purchasePrice) => integratedCore({ ...x, purchasePrice }).carcassProfitPerInitialHead,
  });

  const maxRationPriceTarget = solveUpperBound({
    target: x.targetProfitPerInitialHead,
    low: 0,
    high: 500_000,
    evaluate: (rationPrice) => integratedCore({ ...x, rationPrice }).carcassProfitPerInitialHead,
  });

  const valuePerPointDressing = survival * r.slaughterLiveWeight * 0.01 * trimFactor * x.carcassPrice;
  const valuePerTenthPointDressing = valuePerPointDressing / 10;
  const valuePerKgFinalLive = survival * preSlaughterFactor * dressing * trimFactor * x.carcassPrice;
  const valuePerKgNetHCW = survival * x.carcassPrice;
  const valuePerPointBoningYield = survival * r.coldCarcassWeight * 0.01 * x.blendedMeatPrice;
  const coolerShrinkRevenueImpact = survival * r.coolerLossKg * pct(x.boningYieldPct) * x.blendedMeatPrice;
  const trimRevenueImpact = survival * r.trimKg * x.carcassPrice;

  const zeroMortality = integratedCore({ ...x, mortalityPct: 0 });
  const zeroArrivalShrink = integratedCore({ ...x, arrivalShrinkPct: 0 });
  const zeroPreSlaughterShrink = integratedCore({ ...x, preSlaughterShrinkPct: 0 });
  const zeroTrim = integratedCore({ ...x, trimPct: 0 });
  const zeroFeedWaste = integratedCore({ ...x, feedWastePct: 0 });

  const marginalRevenuePerAdditionalDay = survival * x.adg * preSlaughterFactor * dressing * trimFactor * x.carcassPrice;
  const marginalOperatingCostPerAdditionalDay = r.feedCostPerDay + x.healthPerAnimalDay + x.laborPerAnimalDay + x.yardagePerAnimalDay;
  const marginalSpreadPerAdditionalDay = marginalRevenuePerAdditionalDay - marginalOperatingCostPerAdditionalDay;

  return {
    ...r,
    requiredNetHCWBreakEven,
    requiredNetHCWTarget,
    requiredDressingBreakEvenPct,
    requiredDressingTargetPct,
    requiredDressingMarginPct,
    requiredDressingRoiPct,
    requiredCarcassPriceBreakEven,
    requiredCarcassPriceTarget,
    requiredSlaughterLiveWeightTarget,
    requiredFinalFeedlotWeightTarget,
    requiredAdgTarget,
    requiredByproductTarget,
    requiredMeatPriceBreakEven,
    requiredMeatPriceTarget,
    maxPurchasePriceTarget,
    maxRationPriceTarget,
    valuePerPointDressing,
    valuePerTenthPointDressing,
    valuePerKgFinalLive,
    valuePerKgNetHCW,
    valuePerPointBoningYield,
    coolerShrinkRevenueImpact,
    trimRevenueImpact,
    mortalityEconomicImpact: zeroMortality.carcassProfitPerInitialHead - r.carcassProfitPerInitialHead,
    arrivalShrinkEconomicImpact: zeroArrivalShrink.carcassProfitPerInitialHead - r.carcassProfitPerInitialHead,
    preSlaughterShrinkEconomicImpact: zeroPreSlaughterShrink.carcassProfitPerInitialHead - r.carcassProfitPerInitialHead,
    trimEconomicImpact: zeroTrim.carcassProfitPerInitialHead - r.carcassProfitPerInitialHead,
    feedWasteEconomicImpact: zeroFeedWaste.carcassProfitPerInitialHead - r.carcassProfitPerInitialHead,
    marginalRevenuePerAdditionalDay,
    marginalOperatingCostPerAdditionalDay,
    marginalSpreadPerAdditionalDay,
  };
}

function normalizeJagal(raw = {}) {
  const x = { ...jagalDefaults, ...raw };
  return {
    ...x,
    heads: clamp(x.heads, 1, 1_000_000),
    liveWeight: clamp(x.liveWeight, 1, 2000),
    livePrice: clamp(x.livePrice, 0, 1_000_000),
    purchaseBasisShrinkPct: clamp(x.purchaseBasisShrinkPct, 0, 20),
    preSlaughterShrinkPct: clamp(x.preSlaughterShrinkPct, 0, 20),
    inboundPerHead: clamp(x.inboundPerHead),
    holdingPerHead: clamp(x.holdingPerHead),
    dressingPct: clamp(x.dressingPct, 1, 90),
    trimPct: clamp(x.trimPct, 0, 30),
    carcassPrice: clamp(x.carcassPrice, 0, 1_000_000),
    slaughterCostPerHead: clamp(x.slaughterCostPerHead),
    overheadPerHead: clamp(x.overheadPerHead),
    byproductRevenuePerHead: clamp(x.byproductRevenuePerHead),
    coolerShrinkPct: clamp(x.coolerShrinkPct, 0, 20),
    boningYieldPct: clamp(x.boningYieldPct, 1, 100),
    blendedMeatPrice: clamp(x.blendedMeatPrice, 0, 2_000_000),
    processingCostPerHead: clamp(x.processingCostPerHead),
    targetProfitPerHead: clamp(x.targetProfitPerHead),
    targetMarginPct: clamp(x.targetMarginPct, 0, 95),
    targetRoiPct: clamp(x.targetRoiPct, 0, 500),
  };
}

function jagalCore(raw = {}) {
  const x = normalizeJagal(raw);
  const purchaseBasisWeight = x.liveWeight * (1 - pct(x.purchaseBasisShrinkPct));
  const purchaseCost = purchaseBasisWeight * x.livePrice;
  const slaughterLiveWeight = x.liveWeight * (1 - pct(x.preSlaughterShrinkPct));
  const grossHCW = slaughterLiveWeight * pct(x.dressingPct);
  const trimKg = grossHCW * pct(x.trimPct);
  const netHCW = grossHCW - trimKg;
  const effectiveNetDressingPct = safeDiv(netHCW, slaughterLiveWeight) * 100;
  const coldCarcass = netHCW * (1 - pct(x.coolerShrinkPct));
  const saleableMeat = coldCarcass * pct(x.boningYieldPct);
  const liveToMeatYieldPct = safeDiv(saleableMeat, slaughterLiveWeight) * 100;

  const nonPurchaseCost = x.inboundPerHead + x.holdingPerHead + x.slaughterCostPerHead + x.overheadPerHead;
  const totalCost = purchaseCost + nonPurchaseCost;
  const carcassRevenue = netHCW * x.carcassPrice;
  const totalCarcassRevenue = carcassRevenue + x.byproductRevenuePerHead;
  const carcassProfit = totalCarcassRevenue - totalCost;
  const carcassMarginPct = safeDiv(carcassProfit, totalCarcassRevenue) * 100;
  const carcassRoiPct = safeDiv(carcassProfit, totalCost) * 100;

  const meatCost = totalCost + x.processingCostPerHead;
  const meatRevenue = saleableMeat * x.blendedMeatPrice + x.byproductRevenuePerHead;
  const meatProfit = meatRevenue - meatCost;
  const meatMarginPct = safeDiv(meatProfit, meatRevenue) * 100;

  return {
    x,
    purchaseBasisWeight,
    purchaseCost,
    slaughterLiveWeight,
    grossHCW,
    trimKg,
    netHCW,
    effectiveNetDressingPct,
    coldCarcass,
    saleableMeat,
    liveToMeatYieldPct,
    nonPurchaseCost,
    totalCost,
    carcassRevenue,
    totalCarcassRevenue,
    carcassProfit,
    carcassMarginPct,
    carcassRoiPct,
    meatCost,
    meatRevenue,
    meatProfit,
    meatMarginPct,
    lotPurchaseCost: purchaseCost * x.heads,
    lotRevenue: totalCarcassRevenue * x.heads,
    lotProfit: carcassProfit * x.heads,
    costPerKgNetHCW: safeDiv(totalCost, netHCW),
    profitPerKgNetHCW: safeDiv(carcassProfit, netHCW),
    costPerKgSaleableMeat: safeDiv(meatCost, saleableMeat),
  };
}

export function calculateJagal(raw = {}) {
  const r = jagalCore(raw);
  const { x } = r;
  const trimFactor = 1 - pct(x.trimPct);
  const preSlaughterFactor = 1 - pct(x.preSlaughterShrinkPct);
  const dressing = pct(x.dressingPct);

  const requiredNetHCWBreakEven = x.carcassPrice > 0
    ? Math.max(0, safeDiv(r.totalCost - x.byproductRevenuePerHead, x.carcassPrice))
    : 0;
  const requiredNetHCWTarget = x.carcassPrice > 0
    ? Math.max(0, safeDiv(r.totalCost + x.targetProfitPerHead - x.byproductRevenuePerHead, x.carcassPrice))
    : 0;
  const targetMargin = pct(x.targetMarginPct);
  const requiredRevenueMargin = targetMargin < 1 ? safeDiv(r.totalCost, 1 - targetMargin) : Number.POSITIVE_INFINITY;
  const requiredNetHCWMargin = x.carcassPrice > 0
    ? Math.max(0, safeDiv(requiredRevenueMargin - x.byproductRevenuePerHead, x.carcassPrice))
    : 0;
  const targetRoi = pct(x.targetRoiPct);
  const requiredRevenueRoi = r.totalCost * (1 + targetRoi);
  const requiredNetHCWRoi = x.carcassPrice > 0
    ? Math.max(0, safeDiv(requiredRevenueRoi - x.byproductRevenuePerHead, x.carcassPrice))
    : 0;

  const netToDp = (netHCW) =>
    r.slaughterLiveWeight > 0 && trimFactor > 0
      ? safeDiv(netHCW / trimFactor, r.slaughterLiveWeight) * 100
      : 0;

  const requiredDressingBreakEvenPct = netToDp(requiredNetHCWBreakEven);
  const requiredDressingTargetPct = netToDp(requiredNetHCWTarget);
  const requiredDressingMarginPct = netToDp(requiredNetHCWMargin);
  const requiredDressingRoiPct = netToDp(requiredNetHCWRoi);

  const requiredCarcassPriceBreakEven = r.netHCW > 0
    ? Math.max(0, safeDiv(r.totalCost - x.byproductRevenuePerHead, r.netHCW))
    : 0;
  const requiredCarcassPriceTarget = r.netHCW > 0
    ? Math.max(0, safeDiv(r.totalCost + x.targetProfitPerHead - x.byproductRevenuePerHead, r.netHCW))
    : 0;

  const maxPurchaseCostTarget = Math.max(0, r.totalCarcassRevenue - r.nonPurchaseCost - x.targetProfitPerHead);
  const maxLivePriceTarget = r.purchaseBasisWeight > 0 ? safeDiv(maxPurchaseCostTarget, r.purchaseBasisWeight) : 0;
  const requiredSlaughterLiveWeightTarget = dressing * trimFactor > 0
    ? safeDiv(requiredNetHCWTarget, dressing * trimFactor)
    : 0;
  const requiredLiveWeightBeforeShrinkTarget = preSlaughterFactor > 0
    ? requiredSlaughterLiveWeightTarget / preSlaughterFactor
    : 0;
  const requiredByproductTarget = Math.max(0, r.totalCost + x.targetProfitPerHead - r.carcassRevenue);

  const requiredMeatPriceBreakEven = r.saleableMeat > 0
    ? Math.max(0, safeDiv(r.meatCost - x.byproductRevenuePerHead, r.saleableMeat))
    : 0;
  const requiredMeatPriceTarget = r.saleableMeat > 0
    ? Math.max(0, safeDiv(r.meatCost + x.targetProfitPerHead - x.byproductRevenuePerHead, r.saleableMeat))
    : 0;

  const valuePerPointDressing = r.slaughterLiveWeight * 0.01 * trimFactor * x.carcassPrice;
  const valuePerTenthPointDressing = valuePerPointDressing / 10;
  const valuePerKgPurchasedLive = (1 - pct(x.purchaseBasisShrinkPct)) * preSlaughterFactor * dressing * trimFactor * x.carcassPrice;
  const valuePerPointBoningYield = r.coldCarcass * 0.01 * x.blendedMeatPrice;
  const trimEconomicImpact = r.trimKg * x.carcassPrice;
  const coolerEconomicImpact = (r.netHCW - r.coldCarcass) * pct(x.boningYieldPct) * x.blendedMeatPrice;

  return {
    ...r,
    requiredNetHCWBreakEven,
    requiredNetHCWTarget,
    requiredDressingBreakEvenPct,
    requiredDressingTargetPct,
    requiredDressingMarginPct,
    requiredDressingRoiPct,
    requiredCarcassPriceBreakEven,
    requiredCarcassPriceTarget,
    maxPurchaseCostTarget,
    maxLivePriceTarget,
    requiredSlaughterLiveWeightTarget,
    requiredLiveWeightBeforeShrinkTarget,
    requiredByproductTarget,
    requiredMeatPriceBreakEven,
    requiredMeatPriceTarget,
    valuePerPointDressing,
    valuePerTenthPointDressing,
    valuePerKgPurchasedLive,
    valuePerPointBoningYield,
    trimEconomicImpact,
    coolerEconomicImpact,
  };
}

export function buildIntegratedSensitivity(raw, { dressingSteps, carcassPriceSteps }) {
  return dressingSteps.map((dressingPct) => ({
    dressingPct,
    cells: carcassPriceSteps.map((carcassPrice) => ({
      carcassPrice,
      result: calculateIntegrated({ ...raw, dressingPct, carcassPrice }),
    })),
  }));
}

export function buildJagalBidTable(raw, dressingSteps) {
  return dressingSteps.map((dressingPct) => {
    const result = calculateJagal({ ...raw, dressingPct });
    return {
      dressingPct,
      netHCW: result.netHCW,
      maxLivePriceTarget: result.maxLivePriceTarget,
      carcassProfitAtCurrentBuy: result.carcassProfit,
    };
  });
}
