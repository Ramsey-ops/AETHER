// XAUUSD and *JPY pairs conventionally quote to 2 decimals; other FX majors to 4.
export function decimalsForSymbol(symbol: string): number {
  return symbol.endsWith('JPY') || symbol === 'XAUUSD' ? 2 : 4
}

export function formatFxPrice(symbol: string, price: number): string {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimalsForSymbol(symbol),
    maximumFractionDigits: decimalsForSymbol(symbol),
  })
}

export function formatCurrency(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

/** Same as formatCurrency but with an explicit "+" for positive values —
 * for standalone achieved/remaining figures, not "X of Y" pairs where a
 * "+" on the target side would read oddly. */
export function formatSignedCurrency(n: number): string {
  return n > 0 ? `+${formatCurrency(n)}` : formatCurrency(n)
}
