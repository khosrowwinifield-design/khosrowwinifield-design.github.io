import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateProgress,
  createMediaFrameState,
  createStorageKey,
  filterDaysByPhase,
} from '../app.mjs';

test('calculateProgress returns completed count and rounded percentage', () => {
  assert.deepEqual(calculateProgress([true, false, true, false, true]), {
    completed: 3,
    total: 5,
    percentage: 60,
  });
});

test('calculateProgress handles an empty checklist', () => {
  assert.deepEqual(calculateProgress([]), {
    completed: 0,
    total: 0,
    percentage: 0,
  });
});

test('filterDaysByPhase returns exploration and optimization ranges', () => {
  const days = Array.from({ length: 15 }, (_, index) => ({ day: index + 1 }));

  assert.deepEqual(filterDaysByPhase(days, 'explore').map(({ day }) => day),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(filterDaysByPhase(days, 'optimize').map(({ day }) => day),
    [11, 12, 13, 14, 15]);
  assert.equal(filterDaysByPhase(days, 'all').length, 15);
});

test('createStorageKey produces a stable per-day checklist key', () => {
  assert.equal(createStorageKey(7), 'oc-action-plan-day-7');
});

test('createMediaFrameState follows the uploaded media dimensions', () => {
  assert.deepEqual(createMediaFrameState(800, 1200), {
    adaptive: true,
    aspectRatio: '800 / 1200',
  });
  assert.deepEqual(createMediaFrameState(1600, 900), {
    adaptive: true,
    aspectRatio: '1600 / 900',
  });
});

test('createMediaFrameState falls back when media dimensions are unavailable', () => {
  assert.deepEqual(createMediaFrameState(0, 1200), {
    adaptive: false,
    aspectRatio: '16 / 10',
  });
});
