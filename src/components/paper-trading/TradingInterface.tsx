import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Calculator, RefreshCw, Bot } from 'lucide-react';
import { AlgorithmicTradingInterface } from './AlgorithmicTradingInterface';

interface TradingInterfaceProps {
  portfolio: any;
  onTradeExecuted: () => void;
  userId?: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export function TradingInterface({ portfolio, onTradeExecuted, userId }: TradingInterfaceProps) {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);

  const totalValue = quantity && selectedStock ? parseFloat(quantity) * selectedStock.price : 0;
  const availableCash = Number(portfolio?.cash_balance ?? 0);
  const canAfford = totalValue <= availableCash;
  
  // Get stocks from user's positions for selling
  const ownedStocks = positions.map(position => ({
    symbol: position.symbol,
    name: position.symbol,
    price: position.current_price || 0,
    change: 0,
    changePercent: 0,
    quantity: position.quantity
  }));

  // Filter stocks based on order type
  const availableStocks = orderType === 'SELL' ? ownedStocks : stocks;
  const filteredStocks = availableStocks.filter((s) =>
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Validate sell quantity
  const selectedPosition = orderType === 'SELL' ? positions.find(p => p.symbol === selectedStock?.symbol) : null;
  const maxSellQuantity = selectedPosition?.quantity || 0;
  const canSell = orderType === 'SELL' ? parseInt(quantity) <= maxSellQuantity : true;

  // Mock data fallback when API is not available
  const mockStocksData: StockData[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2850.75, change: 12.25, changePercent: 0.43, volume: 15200000 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3420.50, change: -15.25, changePercent: -0.44, volume: 8900000 },
    { symbol: 'INFY', name: 'Infosys', price: 1456.80, change: 8.40, changePercent: 0.58, volume: 12400000 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.25, change: 12.75, changePercent: 0.77, volume: 18700000 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1089.90, change: -5.60, changePercent: -0.51, volume: 22100000 },
  ];

  // Fetch real-time stock data with fallback
  const fetchStockData = async () => {
    setRefreshing(true);
    try {
      const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'];
      const stockPromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(`http://localhost:5000/api/realtime/${symbol}`);
          const data = await response.json();
          if (data.success) {
            return data.data;
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const stocksData = await Promise.all(stockPromises);
      const validStocks = stocksData.filter(stock => stock !== null);
      
      if (validStocks.length > 0) {
        setStocks(validStocks);
      } else {
        // Fallback to mock data if API is not available
        console.log('Using mock data - backend server not available');
        setStocks(mockStocksData);
      }
      
      // Set first stock as selected if none selected
      if (!selectedStock && (validStocks.length > 0 || mockStocksData.length > 0)) {
        setSelectedStock(validStocks.length > 0 ? validStocks[0] : mockStocksData[0]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Fallback to mock data
      setStocks(mockStocksData);
      if (!selectedStock) {
        setSelectedStock(mockStocksData[0]);
      }
      toast({
        title: "Using Mock Data",
        description: "Backend server not available, using simulated stock prices",
        variant: "default"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch user positions
  const fetchPositions = async () => {
    if (!portfolio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .gt('quantity', 0);
      
      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  useEffect(() => {
    fetchStockData();
    fetchPositions();
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchStockData();
      fetchPositions();
    }, 30000);
    return () => clearInterval(interval);
  }, [portfolio?.id]);

  // Update selected stock price when stocks data changes
  useEffect(() => {
    if (selectedStock && stocks.length > 0) {
      const updatedStock = stocks.find(s => s.symbol === selectedStock.symbol);
      if (updatedStock) {
        setSelectedStock(updatedStock);
      }
    }
  }, [stocks]);
  const executeOrder = async () => {
    console.log('Executing order:', { quantity, selectedStock, orderType, portfolio });
    
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedStock) {
      toast({
        title: "No Stock Selected",
        description: "Please select a stock to trade.",
        variant: "destructive"
      });
      return;
    }

    if (orderType === 'BUY' && !canAfford) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough cash balance for this trade.",
        variant: "destructive"
      });
      return;
    }

    if (orderType === 'SELL' && !canSell) {
      toast({
        title: "Insufficient Shares",
        description: `You only have ${maxSellQuantity} shares of ${selectedStock.symbol}.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const qty = parseInt(quantity);
      const price = selectedStock.price;
      const amount = qty * price;

      console.log('Trade details:', { qty, price, amount, portfolioId: portfolio.id });

      // Create transaction record
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          portfolio_id: portfolio.id,
          symbol: selectedStock.symbol,
          type: orderType,
          quantity: qty,
          price: price,
          total_amount: amount,
          fees: amount * 0.001 // 0.1% fees
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      console.log('Transaction created:', transactionData);

      // Update or create position
      const { data: existingPosition, error: positionFetchError } = await supabase
        .from('positions')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .eq('symbol', selectedStock.symbol)
        .maybeSingle();

      if (positionFetchError) {
        console.error('Position fetch error:', positionFetchError);
      }

      console.log('Existing position:', existingPosition);

      if (existingPosition) {
        // Update existing position
        let newQuantity = existingPosition.quantity;
        let newAvgPrice = existingPosition.avg_price;

        if (orderType === 'BUY') {
          const totalShares = existingPosition.quantity + qty;
          const totalValue = (existingPosition.quantity * existingPosition.avg_price) + amount;
          newAvgPrice = totalValue / totalShares;
          newQuantity = totalShares;
        } else {
          newQuantity = Math.max(0, existingPosition.quantity - qty);
        }

        console.log('Updating position:', { newQuantity, newAvgPrice });

        const { data: updatedPosition, error: positionError } = await supabase
          .from('positions')
          .update({
            quantity: newQuantity,
            avg_price: newAvgPrice,
            current_price: price,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id)
          .select()
          .single();

        if (positionError) {
          console.error('Position update error:', positionError);
          throw positionError;
        }

        console.log('Position updated:', updatedPosition);
      } else if (orderType === 'BUY') {
        // Create new position
        console.log('Creating new position:', { portfolioId: portfolio.id, symbol: selectedStock.symbol, qty, price });
        
        const { data: newPosition, error: positionError } = await supabase
          .from('positions')
          .insert({
            portfolio_id: portfolio.id,
            symbol: selectedStock.symbol,
            quantity: qty,
            avg_price: price,
            current_price: price
          })
          .select()
          .single();

        if (positionError) {
          console.error('New position error:', positionError);
          throw positionError;
        }

        console.log('New position created:', newPosition);
      }

      // Update portfolio cash balance and total value
      const cashChange = orderType === 'BUY' ? -amount - (amount * 0.001) : amount - (amount * 0.001);
      const currentCash = Number(portfolio.cash_balance ?? 0);
      const newCashBalance = currentCash + cashChange;
      
      console.log('Portfolio update:', { currentCash, cashChange, newCashBalance });
      
      // Calculate new total portfolio value
      const { data: allPositions } = await supabase
        .from('positions')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .gt('quantity', 0);
      
      let totalPositionValue = 0;
      if (allPositions) {
        totalPositionValue = allPositions.reduce((total, pos) => {
          const posPrice = pos.symbol === selectedStock.symbol ? price : Number(pos.current_price);
          const posQty = Number(pos.quantity);
          return total + (posPrice * posQty);
        }, 0);
      }
      
      const newTotalValue = newCashBalance + totalPositionValue;
      
      console.log('Updating portfolio:', { newCashBalance, totalPositionValue, newTotalValue });
      
      const { data: updatedPortfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .update({
          cash_balance: newCashBalance,
          total_value: newTotalValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolio.id)
        .select()
        .single();
        
      if (portfolioError) {
        console.error('Portfolio update error:', portfolioError);
        throw portfolioError;
      }

      console.log('Portfolio updated:', updatedPortfolio);

      toast({
        title: "Order Executed",
        description: `Successfully ${orderType.toLowerCase()}ed ${qty} shares of ${selectedStock.symbol}`,
      });

      setQuantity('');
      onTradeExecuted();
    } catch (error) {
      console.error('Order execution error:', error);
      toast({
        title: "Order Failed",
        description: "Failed to execute order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Trading Interface
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStockData}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stock Selection */}
        <div>
          <Label className="text-base font-medium">Search Stock</Label>
          <Input
            placeholder="Search by symbol or name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2"
          />
          <div className="grid grid-cols-1 gap-2 mt-3">
            {filteredStocks.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground border rounded-lg">
                No matching stocks. Try a different search.
              </div>
            ) : (
              filteredStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStock.symbol === stock.symbol
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedStock(stock)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                      <div className={`text-sm flex items-center gap-1 ${
                        stock.change >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {stock.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Type */}
        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as 'BUY' | 'SELL')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="BUY" className="text-profit">BUY</TabsTrigger>
            <TabsTrigger value="SELL" className="text-loss">SELL</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>

        {/* Order Summary */}
        {quantity && selectedStock && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Stock:</span>
              <span className="font-medium">{selectedStock.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Price:</span>
              <span>₹{selectedStock.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Value:</span>
              <span className="font-medium">₹{totalValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Fees (0.1%):</span>
              <span>₹{(totalValue * 0.001).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Net Amount:</span>
              <span>₹{(totalValue + (totalValue * 0.001)).toLocaleString()}</span>
            </div>
            
            {orderType === 'BUY' && !canAfford && (
              <Badge variant="destructive" className="w-full justify-center">
                Insufficient Funds
              </Badge>
            )}
            {orderType === 'SELL' && !canSell && selectedPosition && (
              <Badge variant="destructive" className="w-full justify-center">
                Max: {maxSellQuantity} shares
              </Badge>
            )}
          </div>
        )}

        {/* Execute Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={executeOrder}
          disabled={!quantity || !selectedStock || loading || (orderType === 'BUY' && !canAfford) || (orderType === 'SELL' && !canSell)}
          variant={orderType === 'BUY' ? 'default' : 'destructive'}
        >
          {loading ? 'Executing...' : selectedStock ? `${orderType} ${selectedStock.symbol}` : 'Select Stock'}
        </Button>

        {/* Available Cash */}
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Available Cash</div>
          <div className="text-lg font-medium">₹{portfolio?.cash_balance?.toLocaleString() || '0'}</div>
        </div>
      </CardContent>
    </Card>
  );
}