export function formatKes(amount: number | bigint | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatKesCompact(amount: number | bigint | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (num >= 1000000) {
    return `KES ${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `KES ${(num / 1000).toFixed(0)}K`;
  }
  return `KES ${num.toFixed(0)}`;
}
