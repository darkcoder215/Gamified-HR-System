// Maps a 0-100 score to the brand's semantic gradation colors.
export function scoreColor(pct: number): string {
  if (pct >= 85) return 'var(--score-excellent)';
  if (pct >= 70) return 'var(--score-good)';
  if (pct >= 50) return 'var(--score-average)';
  if (pct >= 30) return 'var(--score-below-average)';
  return 'var(--score-poor)';
}

export function scoreLabel(pct: number): string {
  if (pct >= 85) return 'ممتاز';
  if (pct >= 70) return 'جيد';
  if (pct >= 50) return 'متوسط';
  if (pct >= 30) return 'دون المتوسط';
  return 'يحتاج تطويرًا';
}
