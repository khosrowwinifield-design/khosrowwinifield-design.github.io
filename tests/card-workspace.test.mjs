import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyMediaFile, createDraftKey, isImageSlot, normalizeDraft } from '../card-workspace.mjs';

test('classifyMediaFile accepts supported image and video files', () => {
  assert.deepEqual(classifyMediaFile({ type: 'image/png', size: 2_000_000 }), { kind: 'image', valid: true });
  assert.deepEqual(classifyMediaFile({ type: 'video/mp4', size: 20_000_000 }), { kind: 'video', valid: true });
});

test('classifyMediaFile rejects unsupported and oversized files', () => {
  assert.equal(classifyMediaFile({ type: 'application/pdf', size: 1000 }).valid, false);
  assert.equal(classifyMediaFile({ type: 'image/jpeg', size: 16_000_000 }).valid, false);
  assert.equal(classifyMediaFile({ type: 'video/mp4', size: 201_000_000 }).valid, false);
});

test('draft helpers create stable keys and default prompt fields', () => {
  assert.equal(createDraftKey(3), 'oc-workspace-draft-3');
  assert.deepEqual(normalizeDraft({ imagePrompt: 'portrait' }), {
    imagePrompt: 'portrait',
    videoPrompt: '',
    notes: '',
    activeMedia: 'image',
    activeGallerySlot: 'main',
  });
});

test('image gallery exposes four valid slots and normalizes the active slot', () => {
  assert.deepEqual(['main', 'secondary', 'item', 'sheet'].map(isImageSlot), [true, true, true, true]);
  assert.equal(isImageSlot('video'), false);
  assert.equal(normalizeDraft({ activeGallerySlot: 'item' }).activeGallerySlot, 'item');
  assert.equal(normalizeDraft({ activeGallerySlot: 'unknown' }).activeGallerySlot, 'main');
});
