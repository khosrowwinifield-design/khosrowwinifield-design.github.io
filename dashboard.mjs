export function buildLinePoints(values, width, height, padding = 0) {
  if (!values.length) return [];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  return values.map((value, index) => ({
    x: Math.round(padding + (values.length === 1 ? usableWidth / 2 : index * usableWidth / (values.length - 1))),
    y: Math.round(padding + (max - value) / range * usableHeight),
  }));
}

export function calculateValueScore(post) {
  const views = Math.max(Number(post.views) || 0, 1);
  const engagementRate = ((Number(post.likes) || 0) + (Number(post.collects) || 0) + (Number(post.comments) || 0)) / views;
  const collectRate = (Number(post.collects) || 0) / views;
  const followRate = (Number(post.followers) || 0) / views;
  const intent = Math.min((Number(post.purchaseIntent) || 0) / 10, 1);
  return Math.min(100, Math.round(engagementRate * 380 + collectRate * 900 + followRate * 1200 + intent * 30));
}
