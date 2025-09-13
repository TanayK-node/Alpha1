import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BacktestForm } from '@/components/backtest/BacktestForm';
import { BacktestResults } from '@/components/backtest/BacktestResults';
import { BacktestHistory } from '@/components/backtest/BacktestHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface BacktestParams {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCash: number;
  commission: number;
}

export interface BacktestStats {
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
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

export interface Trade {
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  size: number;
}

export interface BacktestResult {
  success: boolean;
  stats: BacktestStats;
  equityCurve: EquityPoint[];
  trades: Trade[];
  error?: string;
}

const Backtest = () => {
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backtestHistory, setBacktestHistory] = useState<BacktestResult[]>([]);

  const runBacktest = async (params: BacktestParams) => {
    setIsLoading(true);
     console.log('Backtest parameters:', params); // Add this line

    try {
      const response = await fetch('http://localhost:5000/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBacktestResult(result);
        setBacktestHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      } else {
        console.error('Backtest failed:', result.error);
      }
    } catch (error) {
      console.error('Error running backtest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backtest Strategies</h1>
          <p className="text-muted-foreground">
            Test your trading strategies against historical data
          </p>
        </div>
      </div>

      <Tabs defaultValue="new-backtest" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-backtest">New Backtest</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="new-backtest" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Strategy Configuration</CardTitle>
                  <CardDescription>
                    Configure your SMA crossover strategy parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BacktestForm onSubmit={runBacktest} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {backtestResult ? (
                <BacktestResults result={backtestResult} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Results</CardTitle>
                    <CardDescription>
                      Run a backtest to see the results here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        Configure your strategy and click "Run Backtest" to see results
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <BacktestHistory history={backtestHistory} onSelectResult={setBacktestResult} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Backtest;