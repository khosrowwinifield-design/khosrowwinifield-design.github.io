import test from 'node:test';
import assert from 'node:assert/strict';

import { aggregateStats, classifyPost } from '../stats.mjs';

test('aggregateStats totals account post data and calculates engagement', () => {
  const result = aggregateStats([
    { views: 1000, likes: 80, collects: 20, comments: 10, followers: 5 },
    { views: 500, likes: 20, collects: 5, comments: 5, followers: 2 },
  ]);

  assert.deepEqual(result, {
    views: 1500,
    interactions: 140,
    followers: 7,
    engagementRate: 9.33,
  });
});

test('classifyPost identifies commercial intent and retention problems', () => {
  assert.equal(classifyPost({ views: 2000, likes: 120, collects: 35, comments: 24, purchaseIntent: 4 }), '商品型');
  assert.equal(classifyPost({ views: 2000, likes: 20, collects: 2, comments: 1, purchaseIntent: 0 }), '需调整');
});
