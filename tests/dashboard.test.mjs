import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLinePoints, calculateValueScore } from '../dashboard.mjs';

test('buildLinePoints maps values into an SVG plot area', () => {
  assert.deepEqual(buildLinePoints([0, 50, 100], 200, 100, 10), [
    { x: 10, y: 90 },
    { x: 100, y: 50 },
    { x: 190, y: 10 },
  ]);
});

test('calculateValueScore rewards retention, interaction and buying intent', () => {
  const strong = calculateValueScore({ views: 5000, likes: 350, collects: 120, comments: 60, followers: 35, purchaseIntent: 8 });
  const weak = calculateValueScore({ views: 5000, likes: 40, collects: 5, comments: 3, followers: 1, purchaseIntent: 0 });
  assert.ok(strong > weak);
  assert.ok(strong <= 100);
});
