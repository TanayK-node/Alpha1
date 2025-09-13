import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TradingStrategy } from '@/types/strategy';
import { Bot, Play, Pause, Square, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface AlgorithmicTradingInterfaceProps {
  portfolio: any;
  userId: string;
  positions?: any[];
}

interface PublishedAlgorithm {
  id: string;
  strategy_name: string;
  strategy_config: any;
  status: 'active' | 'paused' | 'stopped';
  total_trades: number;
  total_pnl: number;
  created_at: string;
}

interface AlgorithmTrade {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
  reason: string;
  executed_at: string;
}

export function AlgorithmicTradingInterface({ portfolio, userId, positions = [] }: AlgorithmicTradingInterfaceProps) {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [publishedAlgorithms, setPublishedAlgorithms] = useState<PublishedAlgorithm[]>([]);
  const [algorithmTrades, setAlgorithmTrades] = useState<AlgorithmTrade[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Configuration parameters
  const [maxInvestment, setMaxInvestment] = useState('10000');
  const [riskPerTrade, setRiskPerTrade] = useState('2');
  const [maxDailyTrades, setMaxDailyTrades] = useState('5');
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

  // Mock strategies data (in real app, fetch from user's saved strategies)
  const mockStrategies: TradingStrategy[] = [
    {
      id: '1',
      name: 'Moving Average Crossover',
      description: 'Buy when short MA crosses above long MA, sell when opposite',
      type: 'directional',
      legs: [],
      entryConditions: [
        { id: '1', type: 'technical', parameter: 'sma_cross', operator: '>', value: 0, enabled: true }
      ],
      exitConditions: [
        { id: '1', type: 'profit_target', parameter: 'percentage', value: 5, enabled: true },
        { id: '2', type: 'stop_loss', parameter: 'percentage', value: 2, enabled: true }
      ],
      maxLoss: 2000,
      maxProfit: 5000,
      breakevens: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'RSI Mean Reversion',
      description: 'Buy oversold stocks (RSI < 30), sell overbought (RSI > 70)',
      type: 'neutral',
      legs: [],
      entryConditions: [
        { id: '1', type: 'technical', parameter: 'rsi', operator: '<', value: 30, enabled: true }
      ],
      exitConditions: [
        { id: '1', type: 'technical', parameter: 'rsi', value: 70, enabled: true }
      ],
      maxLoss: 1500,
      maxProfit: 3000,
      breakevens: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const fetchPublishedAlgorithms = async () => {
    if (!portfolio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('published_algorithms')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPublishedAlgorithms((data || []) as PublishedAlgorithm[]);
    } catch (error) {
      console.error('Error fetching algorithms:', error);
    }
  };

  const fetchAlgorithmTrades = async () => {
    if (publishedAlgorithms.length === 0) return;
    
    try {
      const algorithmIds = publishedAlgorithms.map(a => a.id);
      const { data, error } = await supabase
        .from('algorithm_trades')
        .select('*')
        .in('algorithm_id', algorithmIds)
        .order('executed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setAlgorithmTrades((data || []) as AlgorithmTrade[]);
    } catch (error) {
      console.error('Error fetching algorithm trades:', error);
    }
  };

  const publishStrategy = async () => {
    if (!selectedStrategy || !portfolio?.id) return;
    
    setLoading(true);
    try {
      const strategyConfig = JSON.stringify({
        strategy: selectedStrategy,
        parameters: {
          maxInvestment: parseFloat(maxInvestment),
          riskPerTrade: parseFloat(riskPerTrade),
          maxDailyTrades: parseInt(maxDailyTrades)
        }
      });

      const { data, error } = await supabase
        .from('published_algorithms')
        .insert({
          user_id: userId,
          portfolio_id: portfolio.id,
          strategy_name: selectedStrategy.name,
          strategy_config: strategyConfig,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Strategy Published",
        description: `${selectedStrategy.name} is now running on live market data.`
      });

      await fetchPublishedAlgorithms();
      setSelectedStrategy(null);
    } catch (error) {
      console.error('Error publishing strategy:', error);
      toast({
        title: "Error",
        description: "Failed to publish strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAlgorithmStatus = async (algorithmId: string, status: 'active' | 'paused' | 'stopped') => {
    try {
      const { error } = await supabase
        .from('published_algorithms')
        .update({ status })
        .eq('id', algorithmId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Algorithm ${status === 'active' ? 'resumed' : status}.`
      });

      await fetchPublishedAlgorithms();
    } catch (error) {
      console.error('Error updating algorithm status:', error);
      toast({
        title: "Error",
        description: "Failed to update algorithm status.",
        variant: "destructive"
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchPublishedAlgorithms(), fetchAlgorithmTrades()]);
    setRefreshing(false);
  };

  useEffect(() => {
    setStrategies(mockStrategies);
    fetchPublishedAlgorithms();
  }, [portfolio?.id]);

  useEffect(() => {
    fetchAlgorithmTrades();
  }, [publishedAlgorithms]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Algorithm</TabsTrigger>
          <TabsTrigger value="algorithms">Your Algorithms</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Deploy Algorithmic Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="strategy-select">Select Strategy</Label>
                  <Select
                    value={selectedStrategy?.id || ""}
                    onValueChange={(value) => {
                      const strategy = strategies.find(s => s.id === value);
                      setSelectedStrategy(strategy || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a strategy to deploy" />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{strategy.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {strategy.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStrategy && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">{selectedStrategy.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{selectedStrategy.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Entry Conditions:</span>
                        <ul className="mt-1 space-y-1">
                          {selectedStrategy.entryConditions.map((condition, idx) => (
                            <li key={idx} className="text-muted-foreground">
                              • {condition.parameter} {condition.operator} {condition.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">Exit Conditions:</span>
                        <ul className="mt-1 space-y-1">
                          {selectedStrategy.exitConditions.map((condition, idx) => (
                            <li key={idx} className="text-muted-foreground">
                              • {condition.parameter}: {condition.value}%
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Select Stocks from Portfolio</Label>
                  <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg max-h-40 overflow-y-auto">
                    {positions.length > 0 ? (
                      positions.map((position) => (
                        <div key={position.symbol} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={position.symbol}
                            checked={selectedStocks.includes(position.symbol)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStocks([...selectedStocks, position.symbol]);
                              } else {
                                setSelectedStocks(selectedStocks.filter(s => s !== position.symbol));
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={position.symbol} className="text-sm">
                            {position.symbol} ({position.quantity} shares)
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground col-span-2">No stocks in portfolio</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="max-investment">Max Investment ($)</Label>
                    <Input
                      id="max-investment"
                      type="number"
                      value={maxInvestment}
                      onChange={(e) => setMaxInvestment(e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-per-trade">Risk per Trade (%)</Label>
                    <Input
                      id="risk-per-trade"
                      type="number"
                      value={riskPerTrade}
                      onChange={(e) => setRiskPerTrade(e.target.value)}
                      placeholder="2"
                      max="10"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-daily-trades">Max Daily Trades</Label>
                    <Input
                      id="max-daily-trades"
                      type="number"
                      value={maxDailyTrades}
                      onChange={(e) => setMaxDailyTrades(e.target.value)}
                      placeholder="5"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>

                <Button
                  onClick={publishStrategy}
                  disabled={!selectedStrategy || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Publishing...' : 'Publish Strategy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithms" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Algorithms ({publishedAlgorithms.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {publishedAlgorithms.map((algorithm) => (
              <Card key={algorithm.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{algorithm.strategy_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(algorithm.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(algorithm.status)}>
                      {algorithm.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{algorithm.total_trades}</p>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${algorithm.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(algorithm.total_pnl)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {algorithm.total_trades > 0 ? ((algorithm.total_pnl / algorithm.total_trades)).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg P&L per Trade</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {algorithm.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAlgorithmStatus(algorithm.id, 'paused')}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {algorithm.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAlgorithmStatus(algorithm.id, 'active')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateAlgorithmStatus(algorithm.id, 'stopped')}
                      disabled={algorithm.status === 'stopped'}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {publishedAlgorithms.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Algorithms Created</h3>
                  <p className="text-muted-foreground">
                    Create your first algorithmic trading strategy to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Algorithms ({publishedAlgorithms.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {publishedAlgorithms.map((algorithm) => (
              <Card key={algorithm.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{algorithm.strategy_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(algorithm.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(algorithm.status)}>
                      {algorithm.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{algorithm.total_trades}</p>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${algorithm.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(algorithm.total_pnl)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {algorithm.total_trades > 0 ? ((algorithm.total_pnl / algorithm.total_trades)).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg P&L per Trade</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {algorithm.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAlgorithmStatus(algorithm.id, 'paused')}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {algorithm.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAlgorithmStatus(algorithm.id, 'active')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateAlgorithmStatus(algorithm.id, 'stopped')}
                      disabled={algorithm.status === 'stopped'}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {publishedAlgorithms.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Active Algorithms</h3>
                  <p className="text-muted-foreground">
                    Create your first algorithmic trading strategy to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Algorithm Trade History</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {algorithmTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        {new Date(trade.executed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.action === 'BUY' ? 'default' : 'destructive'}>
                          {trade.action === 'BUY' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {trade.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.quantity}</TableCell>
                      <TableCell>{formatCurrency(trade.price)}</TableCell>
                      <TableCell>{formatCurrency(trade.total_amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {trade.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {algorithmTrades.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No algorithm trades yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}