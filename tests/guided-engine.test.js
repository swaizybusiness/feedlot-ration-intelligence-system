import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGuided, guidedDefaults } from '../src/lib/guidedEngine.js';

test('guided engine returns four slaughter-window scenarios', () => {
  const g = calculateGuided(guidedDefaults);
  assert.deepEqual(g.slaughterScenarios.map((x) => x.extraDays), [0, 7, 14, 21]);
});

test('guided best slaughter is the maximum projected profit scenario', () => {
  const g = calculateGuided(guidedDefaults);
  const maxProfit = Math.max(...g.slaughterScenarios.map((x) => x.profitPerHead));
  assert.equal(g.bestSlaughter.profitPerHead, maxProfit);
});

test('guided leakages are sorted from largest to smallest', () => {
  const g = calculateGuided(guidedDefaults);
  for (let i = 1; i < g.leakages.length; i += 1) {
    assert.ok(g.leakages[i - 1].impact >= g.leakages[i].impact);
  }
});

test('guided bid gap matches professional max purchase price solver', () => {
  const g = calculateGuided(guidedDefaults);
  assert.ok(Math.abs(g.buyGapPerKg - (g.result.maxPurchasePriceTarget - g.result.x.purchasePrice)) < 0.001);
});

test('guided slaughter action points to the best scenario', () => {
  const g = calculateGuided(guidedDefaults);
  if (g.bestSlaughter.extraDays === 0) {
    assert.equal(g.slaughterAction, 'Potong sekarang');
  } else {
    assert.match(g.slaughterAction, new RegExp(String(g.bestSlaughter.extraDays)));
  }
});
