import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateIntegrated, calculateJagal, integratedDefaults, jagalDefaults } from '../src/lib/engine.js';

test('integrated model produces internally consistent carcass math', () => {
  const r = calculateIntegrated(integratedDefaults);
  assert.ok(r.finalFeedlotWeight > r.arrivalWeight);
  assert.ok(r.slaughterLiveWeight < r.finalFeedlotWeight);
  assert.ok(r.grossHCW > r.netHCW);
  assert.ok(r.netHCW > r.coldCarcassWeight);
  assert.ok(r.coldCarcassWeight > r.saleableMeatWeight);
  assert.ok(Number.isFinite(r.carcassProfitPerInitialHead));
});

test('integrated reverse solver lands close to target profit at solved purchase price', () => {
  const base = calculateIntegrated(integratedDefaults);
  const solved = calculateIntegrated({ ...integratedDefaults, purchasePrice: base.maxPurchasePriceTarget });
  assert.ok(Math.abs(solved.carcassProfitPerInitialHead - integratedDefaults.targetProfitPerInitialHead) < 10);
});

test('jagal required dressing increases when live purchase price increases', () => {
  const low = calculateJagal({ ...jagalDefaults, livePrice: 55000 });
  const high = calculateJagal({ ...jagalDefaults, livePrice: 65000 });
  assert.ok(high.requiredDressingTargetPct > low.requiredDressingTargetPct);
});

test('jagal max live price should create approximately target profit', () => {
  const base = calculateJagal(jagalDefaults);
  const solved = calculateJagal({ ...jagalDefaults, livePrice: base.maxLivePriceTarget });
  assert.ok(Math.abs(solved.carcassProfit - jagalDefaults.targetProfitPerHead) < 1);
});
