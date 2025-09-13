import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquityCurveChart } from './EquityCurveChart';
import { BacktestStats } from './BacktestStats';
import { TradesList } from './TradesList';
import { BacktestResult } from '@/types/strategy';

interface BacktestResultsProps {
  result: BacktestResult;
}

export function BacktestResults({ result }: BacktestResultsProps) {
  if (!result.success || !result.stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backtest Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{result.error || 'Unknown error occurred'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>
            Strategy performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquityCurveChart data={result.equityCurve || []} />
        </CardContent>
      </Card>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <BacktestStats stats={result.stats} />
        </TabsContent>

        <TabsContent value="trades">
          <TradesList trades={result.trades || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}