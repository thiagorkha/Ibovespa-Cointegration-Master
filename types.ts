export enum TimePeriod {
  ONE_MONTH = '1 Mês',
  THREE_MONTHS = '3 Meses',
  SIX_MONTHS = '6 Meses',
  ONE_YEAR = '1 Ano',
  TWO_YEARS = '2 Anos'
}

export interface StockTicker {
  symbol: string;
  name: string;
}

export interface ChartPoint {
  date: string;
  value: number;
  upper?: number;
  lower?: number;
  mean?: number;
}

export interface DetailedAnalysis {
  pair: string;
  residuals: ChartPoint[];
  betaRotation: ChartPoint[];
  halfLife: number;
  hurstExponent: number;
  adfConfidence: number; // 0 to 100
  currentZScore: number;
  lastUpdated: string;
  interpretation: string;
}

export interface ScannedPair {
  id: string;
  assetY: string;
  assetX: string;
  adfConfidence: number;
  currentZScore: number;
  halfLife: number;
}
