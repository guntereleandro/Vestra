export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 });
export const percent = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function calculatePortfolioTotals(positions) { const totals = positions.reduce((sum, position) => { sum.invested += position.invested; sum.current += position.currentValue; sum.profit += position.profit; sum.dividends += position.dividends; return sum; }, { invested: 0, current: 0, profit: 0, dividends: 0 }); return { ...totals, profitability: totals.invested ? (totals.profit / totals.invested) * 100 : 0 }; }
