import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDressingScenarioSteps } from '../src/lib/scenario.js';

test('dressing scenarios follow exact 56 percent target', () => {
  assert.deepEqual(buildDressingScenarioSteps(56), [54, 56, 58, 60]);
});

test('dressing scenarios bracket a 55.2 percent target', () => {
  assert.deepEqual(buildDressingScenarioSteps(55.2), [54, 56, 58, 60]);
});

test('dressing scenarios follow a 48.31 percent target', () => {
  assert.deepEqual(buildDressingScenarioSteps(48.31), [48, 50, 52, 54]);
});

test('dressing scenarios stay inside physical 0 to 100 percent range', () => {
  assert.deepEqual(buildDressingScenarioSteps(0), [0, 2, 4, 6]);
  assert.deepEqual(buildDressingScenarioSteps(100), [94, 96, 98, 100]);
});
