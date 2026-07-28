const DB_NAME = 'oc-content-workspace';
const STORE_NAME = 'media-assets';
const DB_VERSION = 1;

export function classifyMediaFile(file) {
  const type = file?.type || '';
  const size = Number(file?.size) || 0;
  if (type.startsWith('image/')) return { kind: 'image', valid: size > 0 && size <= 15_000_000 };
  if (type.startsWith('video/')) return { kind: 'video', valid: size > 0 && size <= 200_000_000 };
  return { kind: 'unknown', valid: false };
}

export function createDraftKey(day) {
  return `oc-workspace-draft-${day}`;
}

export function normalizeDraft(draft = {}) {
  return {
    imagePrompt: typeof draft.imagePrompt === 'string' ? draft.imagePrompt : '',
    videoPrompt: typeof draft.videoPrompt === 'string' ? draft.videoPrompt : '',
    notes: typeof draft.notes === 'string' ? draft.notes : '',
    activeMedia: draft.activeMedia === 'video' ? 'video' : 'image',
  };
}

export function readDraft(day) {
  try { return normalizeDraft(JSON.parse(localStorage.getItem(createDraftKey(day)) || '{}')); }
  catch { return normalizeDraft(); }
}

export function writeDraft(day, draft) {
  const normalized = normalizeDraft(draft);
  localStorage.setItem(createDraftKey(day), JSON.stringify(normalized));
  return normalized;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('当前浏览器不支持本地素材库'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('素材库打开失败'));
  });
}

export async function saveMedia(day, kind, file) {
  const validation = classifyMediaFile(file);
  if (!validation.valid || validation.kind !== kind) throw new Error(kind === 'image' ? '图片需小于15MB' : '视频需小于200MB');
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ file, name: file.name, type: file.type, updatedAt: Date.now() }, `${day}:${kind}`);
    transaction.oncomplete = () => { db.close(); resolve(true); };
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('素材保存失败')); };
  });
}

export async function readMedia(day, kind) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(`${day}:${kind}`);
    request.onsuccess = () => { db.close(); resolve(request.result || null); };
    request.onerror = () => { db.close(); reject(request.error || new Error('素材读取失败')); };
  });
}

export async function removeMedia(day, kind) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(`${day}:${kind}`);
    transaction.oncomplete = () => { db.close(); resolve(true); };
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('素材删除失败')); };
  });
}
