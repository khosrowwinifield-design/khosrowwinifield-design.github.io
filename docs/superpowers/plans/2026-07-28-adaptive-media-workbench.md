# Adaptive Media Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 OC 工作台按上传素材方向调整预览宽度，并把预览与编辑区拆成不等高的独立面板。

**Architecture:** `createMediaFrameState` 负责把媒体尺寸归类为 portrait、landscape、square 或 default；DOM 层把该状态写入画布和工作台数据属性；`workspace.css` 只消费数据属性完成方向化布局。素材保存与内容编辑逻辑保持原样。

**Tech Stack:** 原生 ES Modules、HTML、CSS、Node.js `node:test`、浏览器 IndexedDB。

---

### Task 1: 媒体方向状态

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `app.mjs`

- [x] **Step 1: 写入失败测试**

```js
assert.deepEqual(createMediaFrameState(800, 1200), {
  adaptive: true,
  aspectRatio: '800 / 1200',
  orientation: 'portrait',
});
```

同时覆盖 `landscape`、`square` 与无效尺寸的 `default`。

- [x] **Step 2: 验证测试按预期失败**

Run: `node --test tests/app.test.mjs`

Expected: 2 个测试因实际结果缺少 `orientation` 而失败，其他测试通过。

- [ ] **Step 3: 实现最小方向分类**

```js
export function createMediaFrameState(width, height) {
  const mediaWidth = Number(width);
  const mediaHeight = Number(height);
  if (!Number.isFinite(mediaWidth) || !Number.isFinite(mediaHeight) || mediaWidth <= 0 || mediaHeight <= 0) {
    return { adaptive: false, aspectRatio: '16 / 10', orientation: 'default' };
  }
  const ratio = mediaWidth / mediaHeight;
  const orientation = ratio < 0.9 ? 'portrait' : ratio > 1.1 ? 'landscape' : 'square';
  return { adaptive: true, aspectRatio: `${mediaWidth} / ${mediaHeight}`, orientation };
}
```

- [ ] **Step 4: 把方向写入 DOM**

在 `applyMediaFrameRatio` 中设置：

```js
canvas.dataset.mediaOrientation = state.orientation;
canvas.closest('.oc-workbench')?.setAttribute('data-media-orientation', state.orientation);
```

在空素材状态把画布和工作台重置为 `default`。

- [ ] **Step 5: 验证目标测试通过**

Run: `node --test tests/app.test.mjs`

Expected: 6 tests pass, 0 fail。

### Task 2: 双面板方向化布局

**Files:**
- Modify: `workspace.css`

- [ ] **Step 1: 拆除外层统一卡片外观**

让 `.oc-workbench` 使用透明背景、无外层边框和阴影、`align-items: start`，并保持两列间距。

- [ ] **Step 2: 创建两个独立卡片面板**

为 `.media-studio` 和 `.workbench-content` 分别添加背景、边框、圆角、阴影和独立 overflow 规则；编辑面板使用 `align-self: start`。

- [ ] **Step 3: 按方向设置列宽**

```css
.oc-workbench[data-media-orientation="portrait"] {
  grid-template-columns: clamp(360px, 31vw, 440px) minmax(480px, 1fr);
}
.oc-workbench[data-media-orientation="square"] {
  grid-template-columns: clamp(460px, 37vw, 540px) minmax(440px, 1fr);
}
.oc-workbench[data-media-orientation="landscape"] {
  grid-template-columns: clamp(540px, 44vw, 660px) minmax(420px, 1fr);
}
```

默认方向使用与横图接近但更克制的比例。

- [ ] **Step 4: 保持媒体完整显示**

`.media-canvas` 使用 `aspect-ratio: var(--media-aspect, 16 / 10)`，媒体元素继续使用 `object-fit: contain`。

- [ ] **Step 5: 添加响应式规则**

为 `.day-grid` 启用容器查询，在内容容器不足 `960px` 时切换为单列并取消 sticky；手机宽度下缩小内边距并让表单区域单列。

### Task 3: 回归与视觉验证

**Files:**
- Verify: `tests/*.test.mjs`
- Verify: `index.html`

- [ ] **Step 1: 运行目标测试**

Run: `node --test tests/app.test.mjs`

Expected: 6 tests pass, 0 fail。

- [ ] **Step 2: 运行完整测试**

Run: `node --test tests/*.test.mjs`

Expected: 全部测试通过且无错误输出。

- [ ] **Step 3: 启动本地静态服务**

Run: `py -m http.server 4173 --bind 127.0.0.1`

Expected: `http://127.0.0.1:4173/index.html` 返回 200。

- [ ] **Step 4: 浏览器核验**

分别检查默认、竖图、横图、方图以及小屏布局：素材完整可见；编辑面板不等高；页面无横向滚动；标签、上传、删除和输入控件可用。

- [ ] **Step 5: 保留本地改动等待同步指令**

不执行 `git push`。只有用户明确说“同步”后，才提交需要发布的文件并推送 GitHub Pages。

