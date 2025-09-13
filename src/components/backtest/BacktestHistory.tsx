import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BacktestResult } from '@/pages/Backtest';
import { Eye } from 'lucide-react';

interface BacktestHistoryProps {
  history: BacktestResult[];
  onSelectResult: (result: BacktestResult) => void;
}

export function BacktestHistory({ history, onSelectResult }: BacktestHistoryProps) {
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPerformanceBadge = (value: number) => {
    if (value > 0) return <Badge variant="default" className="bg-green-500">Positive</Badge>;
    if (value < 0) return <Badge variant="destructive">Negative</Badge>;
    return <Badge variant="secondary">Neutral</Badge>;
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backtest History</CardTitle>
          <CardDescription>
            Your previous backtest results will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-muted-foreground">
              No backtest history available. Run your first backtest to see results here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backtest History</CardTitle>
        <CardDescription>
          Previous backtest results ({history.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">
                    SMA Crossover Strategy
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {result.stats.startDate} to {result.stats.endDate} • {result.stats.numTrades} trades
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectResult(result)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Return</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{formatPercent(result.stats.totalReturn)}</span>
                    {getPerformanceBadge(result.stats.totalReturn)}
                  </div>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Sharpe Ratio</span>
                  <p className="font-medium mt-1">{result.stats.sharpeRatio.toFixed(2)}</p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Max Drawdown</span>
                  <p className="font-medium mt-1 text-destructive">
                    {formatPercent(result.stats.maxDrawdown)}
                  </p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Win Rate</span>
                  <p className="font-medium mt-1">{formatPercent(result.stats.winRate)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}