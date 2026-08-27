# OC Card Image Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在每张 OC 卡片中加入四槽位图片画廊，并保留现有视频预览和旧主图数据。

**Architecture:** `card-workspace.mjs` 扩展图片槽位校验与 IndexedDB key 映射；新增 `gallery-ui.mjs` 只负责画廊 DOM、批量上传和槽位切换，避免重写现有计划卡片逻辑；`workspace-gallery.css` 负责滑动缩略图和状态视觉。`index.html` 只增加样式与模块入口。

**Tech Stack:** 原生 ES Modules、IndexedDB、Node.js `node:test`、CSS scroll-snap。

---

### Task 1: 图片槽位数据层

**Files:** `card-workspace.mjs`, `tests/card-workspace.test.mjs`

- [ ] 测试 `isImageSlot('main'|'secondary'|'item'|'sheet')`，并确认 `normalizeDraft` 默认 `activeGallerySlot: 'main'`、非法槽位回退 main。
- [ ] 运行 `node --test tests/card-workspace.test.mjs` 确认红灯。
- [ ] 允许 `saveMedia` 对四个图片槽位使用图片校验；将 `main` 映射到旧 `image` key，其他槽位保持独立 key。
- [ ] 运行目标测试确认通过。

### Task 2: 画廊界面和交互

**Files:** `gallery-ui.mjs`, `workspace-gallery.css`, `index.html`

- [ ] 新增四个固定槽位的画廊 DOM、缩略图、左右按钮和图片/视频模式切换。
- [ ] 图片上传 input 设置 `multiple`，从当前槽位依次写入最多四个槽位；单个槽位替换和删除可用。
- [ ] 对新渲染的筛选卡片使用 MutationObserver 自动增强；不破坏现有 app.mjs 的素材和提示词逻辑。
- [ ] 用 scroll-snap、横向 overflow 和 touch-action 实现缩略图滑动。

### Task 3: 回归验证

**Files:** `tests/*.test.mjs`, `index.html`

- [ ] 运行 `node --test tests/*.test.mjs`，确认全部通过。
- [ ] 打开 `http://127.0.0.1:4173/index.html`，验证旧主图、批量四图、槽位切换、删除、视频模式和移动端滑动。
- [ ] 保留本地改动，不执行 GitHub 同步。

