const gbpWholeFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

export const roundDisplayPrice = (value: number): number => {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return 0;
  return Math.round(Math.max(0, safe));
};

export const formatWholePrice = (value: number): string => gbpWholeFormatter.format(roundDisplayPrice(value));
