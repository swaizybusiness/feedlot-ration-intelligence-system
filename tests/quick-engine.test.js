import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuickLive,
  calculateQuickCarcass,
  quickLiveDefaults,
  quickCarcassDefaults,
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
