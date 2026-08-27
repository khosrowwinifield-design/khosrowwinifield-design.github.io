import {
  IMAGE_SLOTS,
  classifyMediaFile,
  readDraft,
  readMedia,
  removeMedia,
  saveMedia,
  writeDraft,
} from './card-workspace.mjs?gallery=1';

const SLOT_LABELS = Object.freeze({
  main: '主图',
  secondary: '副图',
  item: '物品图',
  sheet: '设定图',
});

const galleryAssets = new WeakMap();
const galleryUrls = new WeakMap();

function getDay(card) {
  return Number(card.dataset.day);
}

function getCurrentSlot(card) {
  const slot = readDraft(getDay(card)).activeGallerySlot;
  return IMAGE_SLOTS.includes(slot) ? slot : 'main';
}

function createGalleryMarkup() {
  return `<div class="gallery-shell" data-gallery-shell>
    <div class="gallery-switcher">
      <div class="gallery-tabs" role="tablist" aria-label="素材类型">
        <button type="button" class="gallery-tab is-active" data-gallery-media="image" role="tab">图片 <span data-gallery-count>0 / 4</span></button>
        <button type="button" class="gallery-tab" data-gallery-media="video" role="tab">视频 <span data-gallery-video-state>未上传</span></button>
      </div>
      <span class="gallery-badge">MULTI ASSET</span>
    </div>
    <section class="gallery-image-panel" data-gallery-image-panel>
      <div class="gallery-viewport" data-gallery-viewport>
        <button type="button" class="gallery-nav gallery-nav-prev" data-gallery-prev aria-label="上一张">‹</button>
        <div class="gallery-canvas" data-gallery-canvas>
          <div class="gallery-empty"><span>＋</span><b>选择一个图片槽位</b><small>主图 / 副图 / 物品图 / 设定图</small></div>
        </div>
        <button type="button" class="gallery-nav gallery-nav-next" data-gallery-next aria-label="下一张">›</button>
      </div>
      <div class="gallery-caption"><b data-gallery-label>主图</b><span data-gallery-caption>尚未上传</span></div>
      <div class="gallery-thumbs" data-gallery-thumbs aria-label="图片缩略图"></div>
    </section>
    <section class="gallery-video-panel" data-gallery-video-panel hidden>
      <div class="gallery-video-canvas" data-gallery-video-canvas>
        <div class="gallery-empty"><span>▶</span><b>添加预览视频</b><small>支持 MP4、WebM 等浏览器格式</small></div>
      </div>
    </section>
    <div class="gallery-actions">
      <label class="gallery-upload gallery-upload-main"><input type="file" accept="image/*" multiple data-gallery-image-upload><span data-gallery-upload-label>批量上传图片</span></label>
      <label class="gallery-upload gallery-upload-video"><input type="file" accept="video/*" data-gallery-video-upload><span>上传视频</span></label>
      <button type="button" class="gallery-remove" data-gallery-remove hidden>删除当前素材</button>
    </div>
    <div class="gallery-status" data-gallery-status aria-live="polite"></div>
  </div>`;
}

function releaseGalleryUrls(card) {
  const urls = galleryUrls.get(card);
  if (!urls) return;
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls.clear();
}

function createGalleryUrl(card, kind, asset) {
  if (!asset?.file) return '';
  let urls = galleryUrls.get(card);
  if (!urls) {
    urls = new Map();
    galleryUrls.set(card, urls);
  }
  const url = URL.createObjectURL(asset.file);
  urls.set(kind, url);
  return url;
}

async function readGalleryAssets(day) {
  const entries = await Promise.all([...IMAGE_SLOTS, 'video'].map(async (kind) => [kind, await readMedia(day, kind)]));
  return Object.fromEntries(entries);
}

function setStatus(card, text, error = false) {
  const status = card.querySelector('[data-gallery-status]');
  status.textContent = text;
  status.classList.toggle('is-error', error);
}

function setOrientation(card, width, height, target) {
  if (!width || !height) {
    card.dataset.mediaOrientation = 'default';
    target.style.setProperty('--gallery-aspect', '16 / 10');
    return;
  }
  const ratio = width / height;
  card.dataset.mediaOrientation = ratio < 0.9 ? 'portrait' : ratio > 1.1 ? 'landscape' : 'square';
  target.style.setProperty('--gallery-aspect', `${width} / ${height}`);
}

function renderThumbs(card, assets, activeSlot) {
  const thumbs = card.querySelector('[data-gallery-thumbs]');
  thumbs.innerHTML = IMAGE_SLOTS.map((slot) => {
    const asset = assets[slot];
    return `<button type="button" class="gallery-thumb ${slot === activeSlot ? 'is-active' : ''}" data-gallery-slot="${slot}" aria-label="${SLOT_LABELS[slot]}${asset ? '已上传' : '未上传'}">
      ${asset?.file ? `<img src="${createGalleryUrl(card, `${slot}:thumb`, asset)}" alt="${SLOT_LABELS[slot]}">` : '<span class="gallery-thumb-empty">＋</span>'}
      <small>${SLOT_LABELS[slot]}</small>
    </button>`;
  }).join('');
  thumbs.querySelectorAll('[data-gallery-slot]').forEach((button) => button.addEventListener('click', () => {
    const slot = button.dataset.gallerySlot;
    writeDraft(getDay(card), { ...readDraft(getDay(card)), activeMedia: 'image', activeGallerySlot: slot });
    renderGallery(card);
  }));
}

function renderImagePanel(card, assets) {
  const slot = getCurrentSlot(card);
  const asset = assets[slot];
  const canvas = card.querySelector('[data-gallery-canvas]');
  const remove = card.querySelector('[data-gallery-remove]');
  const label = card.querySelector('[data-gallery-label]');
  const caption = card.querySelector('[data-gallery-caption]');
  label.textContent = SLOT_LABELS[slot];
  caption.textContent = asset?.file ? `${asset.name || '已上传素材'} · 点击缩略图切换` : '尚未上传 · 可批量选择图片';
  remove.hidden = !asset?.file;
  if (!asset?.file) {
    canvas.innerHTML = `<div class="gallery-empty"><span>＋</span><b>上传${SLOT_LABELS[slot]}</b><small>支持 JPG、PNG、WebP</small></div>`;
    setOrientation(card, 0, 0, canvas);
    return;
  }
  const url = createGalleryUrl(card, `${slot}:main`, asset);
  canvas.innerHTML = `<img src="${url}" alt="${SLOT_LABELS[slot]}">`;
  const image = canvas.querySelector('img');
  image.addEventListener('load', () => setOrientation(card, image.naturalWidth, image.naturalHeight, canvas), { once: true });
  if (image.complete) setOrientation(card, image.naturalWidth, image.naturalHeight, canvas);
}

function renderVideoPanel(card, assets) {
  const panel = card.querySelector('[data-gallery-video-panel]');
  const canvas = card.querySelector('[data-gallery-video-canvas]');
  const asset = assets.video;
  const remove = card.querySelector('[data-gallery-remove]');
  remove.hidden = !asset?.file;
  if (!asset?.file) {
    canvas.innerHTML = '<div class="gallery-empty"><span>▶</span><b>添加预览视频</b><small>支持 MP4、WebM 等浏览器格式</small></div>';
    setOrientation(card, 0, 0, canvas);
    return;
  }
  const url = createGalleryUrl(card, 'video:main', asset);
  canvas.innerHTML = `<video src="${url}" controls muted preload="metadata"></video>`;
  const video = canvas.querySelector('video');
  video.addEventListener('loadedmetadata', () => setOrientation(card, video.videoWidth, video.videoHeight, canvas), { once: true });
}

async function renderGallery(card) {
  const shell = card.querySelector('[data-gallery-shell]');
  if (!shell) return;
  const day = getDay(card);
  let assets;
  try {
    assets = await readGalleryAssets(day);
  } catch (error) {
    setStatus(card, error.message || '素材读取失败', true);
    return;
  }
  releaseGalleryUrls(card);
  galleryAssets.set(card, assets);
  const draft = readDraft(day);
  const media = draft.activeMedia;
  shell.querySelectorAll('[data-gallery-media]').forEach((button) => button.classList.toggle('is-active', button.dataset.galleryMedia === media));
  shell.querySelector('[data-gallery-image-panel]').hidden = media !== 'image';
  shell.querySelector('[data-gallery-video-panel]').hidden = media !== 'video';
  const uploadedCount = IMAGE_SLOTS.filter((slot) => assets[slot]?.file).length;
  shell.querySelector('[data-gallery-count]').textContent = `${uploadedCount} / 4`;
  shell.querySelector('[data-gallery-video-state]').textContent = assets.video?.file ? '已上传' : '未上传';
  card.querySelector('.asset-summary').textContent = `图片${uploadedCount}/4 · 视频${assets.video?.file ? '已上传' : '未上传'}`;
  renderThumbs(card, assets, getCurrentSlot(card));
  if (media === 'image') renderImagePanel(card, assets);
  else renderVideoPanel(card, assets);
  const current = media === 'image' ? assets[getCurrentSlot(card)] : assets.video;
  shell.querySelector('[data-gallery-upload-label]').textContent = media === 'image' ? `上传${SLOT_LABELS[getCurrentSlot(card)]} / 批量添加` : '上传视频';
  setStatus(card, current?.file ? '素材已保存到当前浏览器' : '选择图片槽位后上传素材');
}

async function uploadImages(card, files) {
  const day = getDay(card);
  const current = getCurrentSlot(card);
  const start = IMAGE_SLOTS.indexOf(current);
  const ordered = IMAGE_SLOTS.slice(start).concat(IMAGE_SLOTS.slice(0, start));
  const selected = [...files].slice(0, IMAGE_SLOTS.length);
  let saved = 0;
  for (const [index, file] of selected.entries()) {
    const validation = classifyMediaFile(file);
    if (!validation.valid || validation.kind !== 'image') {
      setStatus(card, '图片需为有效图片且小于 15MB', true);
      continue;
    }
    await saveMedia(day, ordered[index], file);
    saved += 1;
  }
  if (files.length > IMAGE_SLOTS.length) setStatus(card, '最多同时保存 4 张图片，已忽略多余文件');
  else if (saved) setStatus(card, `已保存 ${saved} 张图片`);
  const lastSlot = saved ? ordered[Math.min(saved, ordered.length) - 1] : current;
  writeDraft(day, { ...readDraft(day), activeMedia: 'image', activeGallerySlot: lastSlot });
  await renderGallery(card);
}

function bindGalleryCard(card) {
  const shell = card.querySelector('[data-gallery-shell]');
  shell.querySelectorAll('[data-gallery-media]').forEach((button) => button.addEventListener('click', () => {
    writeDraft(getDay(card), { ...readDraft(getDay(card)), activeMedia: button.dataset.galleryMedia });
    renderGallery(card);
  }));
  shell.querySelector('[data-gallery-prev]').addEventListener('click', () => {
    const current = getCurrentSlot(card);
    const index = IMAGE_SLOTS.indexOf(current);
    const slot = IMAGE_SLOTS[(index - 1 + IMAGE_SLOTS.length) % IMAGE_SLOTS.length];
    writeDraft(getDay(card), { ...readDraft(getDay(card)), activeMedia: 'image', activeGallerySlot: slot });
    renderGallery(card);
  });
  shell.querySelector('[data-gallery-next]').addEventListener('click', () => {
    const current = getCurrentSlot(card);
    const index = IMAGE_SLOTS.indexOf(current);
    const slot = IMAGE_SLOTS[(index + 1) % IMAGE_SLOTS.length];
    writeDraft(getDay(card), { ...readDraft(getDay(card)), activeMedia: 'image', activeGallerySlot: slot });
    renderGallery(card);
  });
  shell.querySelector('[data-gallery-image-upload]').addEventListener('change', async (event) => {
    try { await uploadImages(card, event.target.files || []); }
    catch (error) { setStatus(card, error.message || '图片保存失败', true); }
    event.target.value = '';
  });
  shell.querySelector('[data-gallery-video-upload]').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const validation = classifyMediaFile(file);
      if (!validation.valid || validation.kind !== 'video') throw new Error('视频需小于 200MB');
      await saveMedia(getDay(card), 'video', file);
      writeDraft(getDay(card), { ...readDraft(getDay(card)), activeMedia: 'video' });
      await renderGallery(card);
    } catch (error) { setStatus(card, error.message || '视频保存失败', true); }
    event.target.value = '';
  });
  shell.querySelector('[data-gallery-remove]').addEventListener('click', async () => {
    const draft = readDraft(getDay(card));
    await removeMedia(getDay(card), draft.activeMedia === 'video' ? 'video' : getCurrentSlot(card));
    await renderGallery(card);
  });
  renderGallery(card);
}

function enhanceCard(card) {
  if (card.dataset.galleryReady) return;
  const studio = card.querySelector('.media-studio');
  const toolbar = studio?.querySelector('.media-toolbar');
  if (!studio || !toolbar) return;
  card.querySelector('[data-media-canvas]')?.classList.add('gallery-legacy-hidden');
  card.querySelector('.media-actions')?.classList.add('gallery-legacy-hidden');
  toolbar.querySelector('.media-tabs')?.classList.add('gallery-legacy-hidden');
  toolbar.insertAdjacentHTML('afterend', createGalleryMarkup());
  card.dataset.galleryReady = 'true';
  bindGalleryCard(card);
}

function enhanceAll() {
  document.querySelectorAll('.oc-workbench').forEach(enhanceCard);
}

function boot() {
  const dayGrid = document.querySelector('#day-grid');
  if (!dayGrid) return;
  const observer = new MutationObserver(() => requestAnimationFrame(enhanceAll));
  observer.observe(dayGrid, { childList: true });
  enhanceAll();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', boot);
}
