import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Play, TrendingUp, BarChart3, Activity, Zap, TrendingDown, Target } from 'lucide-react';

interface AlgorithmicConfig {
  strategyType: 'buy_and_hold' | 'moving_average_crossover' | 'moving_average_long_short' | 'rsi' | 'mean_reversion' | 'momentum' | 'monte_carlo';
  symbol: string;
  startDate: string;
  endDate: string;
  initialCash: number;
  commission: number;
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

interface AlgorithmicStrategiesProps {
  onRunBacktest: (config: AlgorithmicConfig) => void;
  isLoading?: boolean;
}

const stockOptions = [
  { value: 'RELIANCE.NS', label: 'Reliance Industries' },
  { value: 'TCS.NS', label: 'Tata Consultancy Services' },
  { value: 'INFY.NS', label: 'Infosys' },
  { value: 'HDFCBANK.NS', label: 'HDFC Bank' },
];

export function AlgorithmicStrategies({ onRunBacktest, isLoading = false }: AlgorithmicStrategiesProps) {
  const [config, setConfig] = useState<AlgorithmicConfig>({
    strategyType: 'buy_and_hold',
    symbol: 'RELIANCE.NS',
    startDate: '2020-01-01',
    endDate: '2024-12-31',
    initialCash: 10000,
    commission: 0.002,
    shortWindow: 20,
    longWindow: 50,
    // RSI defaults
    rsiWindow: 14,
    oversold: 30,
    overbought: 70,
    // Mean Reversion defaults
    lookbackPeriod: 20,
    entryThreshold: 2.0,
    exitThreshold: 0.5,
    // Momentum defaults
    momentumLookback: 10,
    momentumThreshold: 0.02,
    // Monte Carlo defaults
    lookbackWindow: 30,
    simulationDays: 5,
    numSimulations: 1000,
    confidenceThreshold: 0.65,
    stopLossPct: 0.05,
    takeProfitPct: 0.10
  });

  const strategies = [
    {
      id: 'buy_and_hold',
      name: 'Buy and Hold',
      description: 'Buy asset once at the beginning, hold till the end. Good baseline for comparison.',
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      id: 'moving_average_crossover',
      name: 'Moving Average Crossover',
      description: 'Buy when short-term MA > long-term MA. Sell when short-term MA < long-term MA.',
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      id: 'moving_average_long_short',
      name: 'MA Long/Short',
      description: 'Allows both long and short positions based on moving average crossovers.',
      icon: Activity,
      color: 'bg-emerald-500'
    },
    {
      id: 'rsi',
      name: 'RSI Strategy',
      description: 'Buy when RSI is oversold, sell when overbought. Uses relative strength index.',
      icon: Target,
      color: 'bg-orange-500'
    },
    {
      id: 'mean_reversion',
      name: 'Mean Reversion',
      description: 'Buy when price deviates significantly below mean, sell when it returns to mean.',
      icon: TrendingDown,
      color: 'bg-red-500'
    },
    {
      id: 'momentum',
      name: 'Momentum Strategy',
      description: 'Trade based on price momentum. Buy on strong upward momentum, sell on downward.',
      icon: Zap,
      color: 'bg-yellow-500'
    },
    {
      id: 'monte_carlo',
      name: 'Monte Carlo',
      description: 'Uses Monte Carlo simulations to predict future price movements and make statistical trading decisions.',
      icon: BarChart3,
      color: 'bg-purple-500'
    }
  ];

  const handleRunBacktest = () => {
    if (!config.symbol) {
      toast.error('Please enter a symbol');
      return;
    }
    
    if (config.strategyType === 'moving_average_crossover' || config.strategyType === 'moving_average_long_short') {
      if (!config.shortWindow || !config.longWindow || config.shortWindow >= config.longWindow) {
        toast.error('Short window must be less than long window');
        return;
      }
    }

    if (config.strategyType === 'rsi') {
      if (!config.rsiWindow || config.rsiWindow < 5) {
        toast.error('RSI window must be at least 5');
        return;
      }
      if (!config.oversold || !config.overbought || config.oversold >= config.overbought) {
        toast.error('Oversold threshold must be less than overbought threshold');
        return;
      }
    }

    if (config.strategyType === 'mean_reversion') {
      if (!config.lookbackPeriod || config.lookbackPeriod < 5) {
        toast.error('Lookback period must be at least 5');
        return;
      }
      if (!config.entryThreshold || config.entryThreshold <= 0) {
        toast.error('Entry threshold must be positive');
        return;
      }
    }

    if (config.strategyType === 'momentum') {
      if (!config.momentumLookback || config.momentumLookback < 2) {
        toast.error('Momentum lookback must be at least 2');
        return;
      }
      if (!config.momentumThreshold || config.momentumThreshold <= 0) {
        toast.error('Momentum threshold must be positive');
        return;
      }
    }

    if (config.strategyType === 'monte_carlo') {
      if (!config.lookbackWindow || config.lookbackWindow < 10) {
        toast.error('Lookback window must be at least 10 days');
        return;
      }
      if (!config.simulationDays || config.simulationDays < 1) {
        toast.error('Simulation days must be at least 1');
        return;
      }
      if (!config.numSimulations || config.numSimulations < 100) {
        toast.error('Number of simulations must be at least 100');
        return;
      }
    }

    onRunBacktest(config);
  };

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Algorithmic Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy) => {
              const Icon = strategy.icon;
              const isSelected = config.strategyType === strategy.id;
              
              return (
                <div
                  key={strategy.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setConfig({ ...config, strategyType: strategy.id as any })}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg text-white ${strategy.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{strategy.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {strategy.description}
                      </p>
                      {isSelected && (
                        <Badge variant="default" className="mt-2">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Parameters */}
            <div>
              <Label>Stock Symbol</Label>
              <Select
                value={config.symbol}
                onValueChange={(value) => setConfig({ ...config, symbol: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a stock" />
                </SelectTrigger>
                <SelectContent>
                  {stockOptions.map((stock) => (
                    <SelectItem key={stock.value} value={stock.value}>
                      {stock.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Initial Cash (₹)</Label>
              <Input
                type="number"
                value={config.initialCash}
                onChange={(e) => setConfig({ ...config, initialCash: Number(e.target.value) })}
              />
            </div>
            
            <div>
              <Label>Commission (%)</Label>
              <Input
                type="number"
                step="0.001"
                value={config.commission}
                onChange={(e) => setConfig({ ...config, commission: Number(e.target.value) })}
              />
            </div>
            
            {/* Moving Average Parameters */}
            {(config.strategyType === 'moving_average_crossover' || config.strategyType === 'moving_average_long_short') && (
              <>
                <div>
                  <Label>Short Window (days)</Label>
                  <Input
                    type="number"
                    value={config.shortWindow || 20}
                    onChange={(e) => setConfig({ ...config, shortWindow: Number(e.target.value) })}
                  />
                </div>
                
                <div>
                  <Label>Long Window (days)</Label>
                  <Input
                    type="number"
                    value={config.longWindow || 50}
                    onChange={(e) => setConfig({ ...config, longWindow: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            {/* RSI Parameters */}
            {config.strategyType === 'rsi' && (
              <>
                <div>
                  <Label>RSI Window (days)</Label>
                  <Input
                    type="number"
                    value={config.rsiWindow || 14}
                    onChange={(e) => setConfig({ ...config, rsiWindow: Number(e.target.value) })}
                    min={5}
                  />
                </div>
                
                <div>
                  <Label>Oversold Threshold</Label>
                  <Input
                    type="number"
                    value={config.oversold || 30}
                    onChange={(e) => setConfig({ ...config, oversold: Number(e.target.value) })}
                    min={10}
                    max={50}
                  />
                </div>

                <div>
                  <Label>Overbought Threshold</Label>
                  <Input
                    type="number"
                    value={config.overbought || 70}
                    onChange={(e) => setConfig({ ...config, overbought: Number(e.target.value) })}
                    min={50}
                    max={90}
                  />
                </div>
              </>
            )}

            {/* Mean Reversion Parameters */}
            {config.strategyType === 'mean_reversion' && (
              <>
                <div>
                  <Label>Lookback Period (days)</Label>
                  <Input
                    type="number"
                    value={config.lookbackPeriod || 20}
                    onChange={(e) => setConfig({ ...config, lookbackPeriod: Number(e.target.value) })}
                    min={5}
                  />
                </div>
                
                <div>
                  <Label>Entry Threshold (std dev)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.entryThreshold || 2.0}
                    onChange={(e) => setConfig({ ...config, entryThreshold: Number(e.target.value) })}
                    min={0.5}
                  />
                </div>

                <div>
                  <Label>Exit Threshold (std dev)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.exitThreshold || 0.5}
                    onChange={(e) => setConfig({ ...config, exitThreshold: Number(e.target.value) })}
                    min={0.1}
                  />
                </div>
              </>
            )}

            {/* Momentum Parameters */}
            {config.strategyType === 'momentum' && (
              <>
                <div>
                  <Label>Lookback Period (days)</Label>
                  <Input
                    type="number"
                    value={config.momentumLookback || 10}
                    onChange={(e) => setConfig({ ...config, momentumLookback: Number(e.target.value) })}
                    min={2}
                  />
                </div>
                
                <div>
                  <Label>Momentum Threshold (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={config.momentumThreshold || 0.02}
                    onChange={(e) => setConfig({ ...config, momentumThreshold: Number(e.target.value) })}
                    min={0.001}
                  />
                </div>
              </>
            )}

            {/* Monte Carlo Parameters */}
            {config.strategyType === 'monte_carlo' && (
              <>
                <div>
                  <Label>Lookback Window (days)</Label>
                  <Input
                    type="number"
                    value={config.lookbackWindow || 30}
                    onChange={(e) => setConfig({ ...config, lookbackWindow: Number(e.target.value) })}
                    min={10}
                  />
                </div>
                
                <div>
                  <Label>Simulation Days</Label>
                  <Input
                    type="number"
                    value={config.simulationDays || 5}
                    onChange={(e) => setConfig({ ...config, simulationDays: Number(e.target.value) })}
                    min={1}
                  />
                </div>

                <div>
                  <Label>Number of Simulations</Label>
                  <Input
                    type="number"
                    value={config.numSimulations || 1000}
                    onChange={(e) => setConfig({ ...config, numSimulations: Number(e.target.value) })}
                    min={100}
                  />
                </div>

                <div>
                  <Label>Confidence Threshold</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.confidenceThreshold || 0.65}
                    onChange={(e) => setConfig({ ...config, confidenceThreshold: Number(e.target.value) })}
                    min={0.5}
                    max={1}
                  />
                </div>

                <div>
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.stopLossPct || 0.05}
                    onChange={(e) => setConfig({ ...config, stopLossPct: Number(e.target.value) })}
                    min={0.01}
                    max={0.5}
                  />
                </div>

                <div>
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.takeProfitPct || 0.10}
                    onChange={(e) => setConfig({ ...config, takeProfitPct: Number(e.target.value) })}
                    min={0.01}
                    max={1}
                  />
                </div>
              </>
            )}
          </div>
          
          <Separator className="my-6" />
          
          {/* Strategy Description */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Strategy Details</h4>
            {config.strategyType === 'buy_and_hold' && (
              <p className="text-sm text-muted-foreground">
                This strategy purchases the asset on the first trading day and holds it until the end of the period. 
                It serves as a baseline to compare other strategies against.
              </p>
            )}
            {config.strategyType === 'moving_average_crossover' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This strategy uses two moving averages: a short-term ({config.shortWindow} days) and 
                  a long-term ({config.longWindow} days).
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                  <li><strong>Buy Signal:</strong> When short MA crosses above long MA</li>
                  <li><strong>Sell Signal:</strong> When short MA crosses below long MA</li>
                </ul>
              </div>
            )}
            {config.strategyType === 'moving_average_long_short' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enhanced MA crossover allowing both long and short positions using {config.shortWindow} and {config.longWindow} day averages.
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                  <li><strong>Long Position:</strong> When short MA crosses above long MA</li>
                  <li><strong>Short Position:</strong> When short MA crosses below long MA</li>
                </ul>
              </div>
            )}
            {config.strategyType === 'rsi' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  RSI strategy using {config.rsiWindow} day periods with oversold at {config.oversold} and overbought at {config.overbought}.
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                  <li><strong>Buy Signal:</strong> When RSI falls below {config.oversold} (oversold)</li>
                  <li><strong>Sell Signal:</strong> When RSI rises above {config.overbought} (overbought)</li>
                </ul>
              </div>
            )}
            {config.strategyType === 'mean_reversion' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Mean reversion over {config.lookbackPeriod} days with entry at {config.entryThreshold}σ and exit at {config.exitThreshold}σ.
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                  <li><strong>Buy Signal:</strong> When price is {config.entryThreshold}σ below mean</li>
                  <li><strong>Sell Signal:</strong> When price returns within {config.exitThreshold}σ of mean</li>
                </ul>
              </div>
            )}
            {config.strategyType === 'momentum' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Momentum strategy using {config.momentumLookback} day lookback with {(config.momentumThreshold! * 100).toFixed(1)}% threshold.
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                  <li><strong>Buy Signal:</strong> When momentum exceeds +{(config.momentumThreshold! * 100).toFixed(1)}%</li>
                  <li><strong>Sell Signal:</strong> When momentum falls below -{(config.momentumThreshold! * 100).toFixed(1)}%</li>
                </ul>
              </div>
            )}
            {config.strategyType === 'monte_carlo' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This strategy uses Monte Carlo simulations with Geometric Brownian Motion to predict future price movements
                  and make probabilistic trading decisions.
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                  <li><strong>Simulation:</strong> {config.numSimulations} runs over {config.simulationDays} days</li>
                  <li><strong>Confidence:</strong> {(config.confidenceThreshold! * 100).toFixed(0)}% threshold for trading signals</li>
                  <li><strong>Risk Management:</strong> {(config.stopLossPct! * 100).toFixed(1)}% stop loss, {(config.takeProfitPct! * 100).toFixed(1)}% take profit</li>
                  <li><strong>Analysis Period:</strong> {config.lookbackWindow} days for volatility calculation</li>
                </ul>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleRunBacktest} 
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <BarChart3 className="h-4 w-4 mr-2 animate-pulse" />
                Running Backtest...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Backtest
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}