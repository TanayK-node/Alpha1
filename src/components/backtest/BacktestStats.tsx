import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BacktestStats as StatsType } from '@/pages/Backtest';

interface BacktestStatsProps {
  stats: StatsType;
}

export function BacktestStats({ stats }: BacktestStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPerformanceBadge = (value: number) => {
    if (value > 0) return <Badge variant="default" className="bg-green-500">Positive</Badge>;
    if (value < 0) return <Badge variant="destructive">Negative</Badge>;
    return <Badge variant="secondary">Neutral</Badge>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Returns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Return</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatPercent(stats.totalReturn)}</span>
              {getPerformanceBadge(stats.totalReturn)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Buy & Hold</span>
            <span className="font-medium">{formatPercent(stats.buyHoldReturn)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Annualized</span>
            <span className="font-medium">{formatPercent(stats.returnAnnualized)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
            <span className="font-medium">{stats.sharpeRatio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Sortino Ratio</span>
            <span className="font-medium">{stats.sortinoRatio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Max Drawdown</span>
            <span className="font-medium text-destructive">{formatPercent(stats.maxDrawdown)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Final Equity</span>
            <span className="font-medium">{formatCurrency(stats.equityFinal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Peak Equity</span>
            <span className="font-medium">{formatCurrency(stats.equityPeak)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Exposure Time</span>
            <span className="font-medium">{formatPercent(stats.exposureTime)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Trading Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Trades</span>
            <span className="font-medium">{stats.numTrades}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Win Rate</span>
            <span className="font-medium">{formatPercent(stats.winRate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Profit Factor</span>
            <span className="font-medium">{stats.profitFactor.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Trade Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Best Trade</span>
            <span className="font-medium text-green-600">{formatPercent(stats.bestTrade)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Worst Trade</span>
            <span className="font-medium text-destructive">{formatPercent(stats.worstTrade)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Trade</span>
            <span className="font-medium">{formatPercent(stats.avgTrade)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Duration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Backtest Period</span>
            <span className="font-medium">{stats.duration}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Trade Duration</span>
            <span className="font-medium">{stats.avgTradeDuration}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Max Trade Duration</span>
            <span className="font-medium">{stats.maxTradeDuration}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}