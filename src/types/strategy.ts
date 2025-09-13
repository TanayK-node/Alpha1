export interface OptionLeg {
  id: string;
  type: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  strike: number;
  expiry: string;
  quantity: number;
  premium?: number;
  lotSize: number;
}

export interface EntryCondition {
  id: string;
  type: 'time' | 'price' | 'volatility' | 'technical';
  parameter: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number | string;
  enabled: boolean;
}

export interface ExitCondition {
  id: string;
  type: 'profit_target' | 'stop_loss' | 'time_based' | 'trailing_sl' | 'technical';
  parameter: string;
  value: number;
  enabled: boolean;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'directional' | 'neutral' | 'volatility';
  legs: OptionLeg[];
  entryConditions: EntryCondition[];
  exitConditions: ExitCondition[];
  maxLoss: number;
  maxProfit: number;
  breakevens: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  legs: Omit<OptionLeg, 'id' | 'strike' | 'expiry'>[];
  defaultConditions: {
    entry: Omit<EntryCondition, 'id'>[];
    exit: Omit<ExitCondition, 'id'>[];
  };
}

export interface BacktestResult {
  success: boolean;
  strategy?: {
    type: string;
    symbol: string;
    shortWindow?: number;
    longWindow?: number;
  };
  stats?: {
    startDate: string;
    endDate: string;
    duration: string;
    exposureTime: number;
    equityFinal: number;
    equityPeak: number;
    totalReturn: number;
    buyHoldReturn: number;
    returnAnnualized: number;
    volatilityAnnualized: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdown: number;
    avgDrawdown: number;
    maxDrawdownDuration: string;
    avgDrawdownDuration: string;
    numTrades: number;
    winRate: number;
    bestTrade: number;
    worstTrade: number;
    avgTrade: number;
    maxTradeDuration: string;
    avgTradeDuration: string;
    profitFactor: number;
    sqn: number;
  };
  equityCurve?: Array<{
    date: string;
    equity: number;
    drawdown: number;
  }>;
  trades?: Array<{
    entryTime: string;
    exitTime: string;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPct: number;
    size: number;
  }>;
  error?: string;
}

export interface AlgorithmicStrategy {
  type: 'buy_and_hold' | 'moving_average_crossover' | 'moving_average_long_short' | 'rsi' | 'mean_reversion' | 'momentum' | 'monte_carlo';
  symbol: string;
  startDate: string;
  endDate: string;
  initialCash: number;
  commission: number;
  // Moving Average parameters
  shortWindow?: number;
  longWindow?: number;
  // RSI parameters
  rsiWindow?: number;
  oversold?: number;
  overbought?: number;
  // Mean Reversion parameters
  lookbackPeriod?: number;
  entryThreshold?: number;
  exitThreshold?: number;
  // Momentum parameters
  momentumLookback?: number;
  momentumThreshold?: number;
  // Monte Carlo parameters
  lookbackWindow?: number;
  simulationDays?: number;
  numSimulations?: number;
  confidenceThreshold?: number;
  stopLossPct?: number;
  takeProfitPct?: number;
}