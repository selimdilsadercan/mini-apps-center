export function computeWeightedScore(
  averageRating: number,
  voteCount: number,
  globalMean: number,
  minVotes = 10,
): number {
  if (voteCount <= 0) return 0;
  const v = voteCount;
  const m = minVotes;
  const r = averageRating;
  const c = globalMean;
  return (v / (v + m)) * r + (m / (v + m)) * c;
}

export function roundScore(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
