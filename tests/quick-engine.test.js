import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuickLive,
  calculateQuickCarcass,
  calculateQuickFeedlot,
  quickLiveDefaults,
  quickCarcassDefaults,
  quickFeedlotDefaults,
} from '../src/lib/quickEngine.js';

test('quick live model uses direct buy/sell arithmetic', () => {
  const r = calculateQuickLive({
    purchaseWeight: 320,
    purchasePrice: 58000,
    saleWeight: 470,
    salePrice: 62000,
    additionalCostPerHead: 8000000,
  });
  assert.equal(r.purchaseCost, 18560000);
  assert.equal(r.saleRevenue, 29140000);
  assert.equal(r.profit, 2580000);
});

test('quick live target sale price lands exactly on target profit', () => {
  const base = calculateQuickLive(quickLiveDefaults);
  const solved = calculateQuickLive({ ...quickLiveDefaults, salePrice: base.targetSalePrice });
  assert.ok(Math.abs(solved.profit - quickLiveDefaults.targetProfitPerHead) < 0.01);
});

test('quick carcass model means live weight times dressing directly', () => {
  const r = calculateQuickCarcass({ ...quickCarcassDefaults, liveWeight: 480, dressingPct: 55 });
  assert.equal(r.carcassWeight, 264);
});

test('quick carcass target dressing lands on target profit', () => {
  const base = calculateQuickCarcass(quickCarcassDefaults);
  const solved = calculateQuickCarcass({ ...quickCarcassDefaults, dressingPct: base.requiredDressingTargetPct });
  assert.ok(Math.abs(solved.profit - quickCarcassDefaults.targetProfitPerHead) < 0.01);
});

test('quick carcass max live price lands on target profit', () => {
  const base = calculateQuickCarcass(quickCarcassDefaults);
  const solved = calculateQuickCarcass({ ...quickCarcassDefaults, livePrice: base.maxLivePriceTarget });
  assert.ok(Math.abs(solved.profit - quickCarcassDefaults.targetProfitPerHead) < 0.01);
});

test('quick carcass required carcass price lands on target profit', () => {
  const base = calculateQuickCarcass(quickCarcassDefaults);
  const solved = calculateQuickCarcass({ ...quickCarcassDefaults, carcassPrice: base.requiredCarcassPriceTarget });
  assert.ok(Math.abs(solved.profit - quickCarcassDefaults.targetProfitPerHead) < 0.01);
});

test('quick carcass flags target above 100 percent as impossible', () => {
  const r = calculateQuickCarcass({
    liveWeight: 400,
    livePrice: 80000,
    dressingPct: 55,
    carcassPrice: 90000,
    additionalCostPerHead: 1000000,
    byproductRevenuePerHead: 0,
    targetProfitPerHead: 5000000,
  });
  assert.ok(r.requiredDressingTargetPct > 100);
  assert.equal(r.targetDressingFeasible, false);
});

test('quick carcass with zero carcass price does not fake a zero-percent target', () => {
  const r = calculateQuickCarcass({
    liveWeight: 480,
    livePrice: 60000,
    dressingPct: 55,
    carcassPrice: 0,
    additionalCostPerHead: 1000000,
    byproductRevenuePerHead: 0,
    targetProfitPerHead: 1500000,
  });
  assert.equal(r.requiredDressingTargetPct, Number.POSITIVE_INFINITY);
  assert.equal(r.targetDressingFeasible, false);
});

test('quick feedlot uses direct growth feed and operating-cost arithmetic', () => {
  const r = calculateQuickFeedlot({
    heads: 100,
    purchaseWeight: 320,
    purchasePrice: 58000,
    daysOnFeed: 120,
    adg: 1.3,
    feedIntakePerDay: 22,
    feedPrice: 4200,
    initialCostPerHead: 250000,
    operatingCostPerHeadPerDay: 5000,
    salePrice: 62000,
    targetProfitPerHead: 2000000,
  });
  assert.equal(r.liveGain, 156);
  assert.equal(r.finalWeight, 476);
  assert.equal(r.totalFeedKg, 2640);
  assert.equal(r.feedCostPerDay, 92400);
  assert.equal(r.feedCost, 11088000);
  assert.equal(r.operatingCost, 600000);
  assert.equal(r.purchaseCost, 18560000);
  assert.equal(r.totalCost, 30498000);
  assert.equal(r.saleRevenue, 29512000);
  assert.equal(r.profit, -986000);
});

test('quick feedlot calculates marginal daily economics', () => {
  const r = calculateQuickFeedlot(quickFeedlotDefaults);
  assert.equal(r.dailyHoldingCost, 97400);
  assert.equal(r.dailyValueGain, 80600);
  assert.equal(r.dailyEconomicGain, -16800);
  assert.ok(Math.abs(r.dailyBreakEvenAdg - (97400 / 62000)) < 1e-12);
});

test('quick feedlot required ADG lands on target profit', () => {
  const base = calculateQuickFeedlot(quickFeedlotDefaults);
  const solved = calculateQuickFeedlot({ ...quickFeedlotDefaults, adg: base.requiredAdgTarget });
  assert.ok(Math.abs(solved.profit - quickFeedlotDefaults.targetProfitPerHead) < 0.01);
});

test('quick feedlot required break-even ADG lands on zero profit', () => {
  const base = calculateQuickFeedlot(quickFeedlotDefaults);
  const solved = calculateQuickFeedlot({ ...quickFeedlotDefaults, adg: base.requiredAdgBreakEven });
  assert.ok(Math.abs(solved.profit) < 0.01);
});

test('quick feedlot max target feed price lands on target profit', () => {
  const base = calculateQuickFeedlot(quickFeedlotDefaults);
  const solved = calculateQuickFeedlot({ ...quickFeedlotDefaults, feedPrice: base.maxFeedPriceTarget });
  assert.ok(Math.abs(solved.profit - quickFeedlotDefaults.targetProfitPerHead) < 0.01);
});

test('quick feedlot zero gain with feed consumed is not reported as zero efficiency', () => {
  const r = calculateQuickFeedlot({ ...quickFeedlotDefaults, adg: 0 });
  assert.equal(r.liveGain, 0);
  assert.equal(r.feedPerKgGain, Number.POSITIVE_INFINITY);
  assert.equal(r.feedCostPerKgGain, Number.POSITIVE_INFINITY);
  assert.equal(r.totalGrowthCostPerKgGain, Number.POSITIVE_INFINITY);
});

test('quick feedlot cost per kg gain includes feed and daily operating cost', () => {
  const r = calculateQuickFeedlot(quickFeedlotDefaults);
  assert.ok(Math.abs(r.totalGrowthCostPerKgGain - ((r.feedCost + r.operatingCost) / r.liveGain)) < 1e-12);
});

test('quick feedlot exposes whole-cycle and daily statuses consistently', () => {
  const r = calculateQuickFeedlot(quickFeedlotDefaults);
  const expectedStatus = r.profit < 0 ? 'loss' : r.profit >= r.x.targetProfitPerHead ? 'target' : 'profit';
  assert.equal(r.economicStatus, expectedStatus);
  assert.equal(r.dailyEconomicStatus, r.dailyEconomicGain < 0 ? 'negative' : 'positive');
  assert.ok(Math.abs(r.adgGapToBreakEven - (r.x.adg - r.requiredAdgBreakEven)) < 1e-12);
  assert.ok(Math.abs(r.adgGapToTarget - (r.x.adg - r.requiredAdgTarget)) < 1e-12);
  assert.ok(Math.abs(r.dailyAdgGap - (r.x.adg - r.dailyBreakEvenAdg)) < 1e-12);
});
