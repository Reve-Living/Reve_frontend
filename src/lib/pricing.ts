const gbpWholeFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

export const roundDisplayPrice = (value: number): number => {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return 0;
  const rounded = Math.round(Math.max(0, safe));
  const baseTen = Math.floor(rounded / 10) * 10;
  const candidates = new Set<number>([
    Math.max(0, baseTen - 1),
    Math.max(0, baseTen),
    Math.max(0, baseTen + 9),
    Math.max(0, baseTen + 10),
  ]);

  return Array.from(candidates).sort((a, b) => {
    const diff = Math.abs(a - rounded) - Math.abs(b - rounded);
    if (diff !== 0) return diff;
    return a - b;
  })[0] ?? rounded;
};

export const formatWholePrice = (value: number): string => gbpWholeFormatter.format(roundDisplayPrice(value));
