// 재무비율 계산 유틸리티

// 부채비율 = 부채 / 자본 * 100
export function calcDebtRatio(liabilities: number, equity: number): number {
  if (equity === 0) return 0;
  return (liabilities / equity) * 100;
}

// 자기자본비율 = 자본 / 자산 * 100
export function calcEquityRatio(equity: number, assets: number): number {
  if (assets === 0) return 0;
  return (equity / assets) * 100;
}

// 순차입금비율 = (차입금 - 현금) / 자본 * 100
export function calcNetDebtRatio(debt: number, cash: number, equity: number): number {
  if (equity === 0) return 0;
  return ((debt - cash) / equity) * 100;
}

// 영업이익률 = 영업이익 / 매출 * 100
export function calcOpMargin(opProfit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (opProfit / revenue) * 100;
}

// 매출총이익률 = 매출총이익 / 매출 * 100
export function calcGrossMargin(grossProfit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (grossProfit / revenue) * 100;
}

// ROE = 영업이익 / 자본 * 100 (간이 계산)
export function calcROE(opProfit: number, equity: number): number {
  if (equity === 0) return 0;
  return (opProfit / equity) * 100;
}

// 재고회전율 = 매출원가 / 평균재고
export function calcInventoryTurnover(cogs: number, avgInventory: number): number {
  if (avgInventory === 0) return 0;
  return cogs / avgInventory;
}

// 매출채권회전율 = 매출 / 평균매출채권
export function calcReceivablesTurnover(revenue: number, avgReceivables: number): number {
  if (avgReceivables === 0) return 0;
  return revenue / avgReceivables;
}

// 재고회전일수 = 365 / 재고회전율
export function calcDIO(inventoryTurnover: number): number {
  if (inventoryTurnover === 0) return 0;
  return 365 / inventoryTurnover;
}

// 매출채권회전일수 = 365 / 매출채권회전율
export function calcDSO(receivablesTurnover: number): number {
  if (receivablesTurnover === 0) return 0;
  return 365 / receivablesTurnover;
}

// 매입채무회전일수 = 365 / (매출원가 / 평균매입채무)
export function calcDPO(cogs: number, avgPayables: number): number {
  if (cogs === 0 || avgPayables === 0) return 0;
  return 365 / (cogs / avgPayables);
}

// 현금전환주기 = DIO + DSO - DPO
export function calcCCC(dio: number, dso: number, dpo: number): number {
  return dio + dso - dpo;
}

// 여신기준 월수 환산 = 채권 / 월평균매출
export function calcCreditMonths(ar: number, avgMonthlySales: number): number {
  if (avgMonthlySales === 0) return 0;
  return ar / avgMonthlySales;
}

// 여신기준 채권/매출 비율 = 채권 / (전월매출 + 당월매출) * 100
export function calcCreditRatio(ar: number, prevSale: number, currSale: number): number {
  const totalSale = prevSale + currSale;
  if (totalSale === 0) return 0;
  return (ar / totalSale) * 100;
}

// YoY 증감률 계산
export function calcYoYGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// YoY 증감액 계산
export function calcYoYChange(current: number, previous: number): number {
  return current - previous;
}
