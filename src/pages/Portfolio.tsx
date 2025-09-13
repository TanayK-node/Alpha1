import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockHoldingCard } from '@/components/portfolio/StockHoldingCard';
import { OptionsPositionCard } from '@/components/portfolio/OptionsPositionCard';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { TransactionHistory } from '@/components/portfolio/TransactionHistory';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Calendar } from 'lucide-react';

// Sample stock holdings data
const stockHoldings = [
  {
    id: '1',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    quantity: 50,
    avgPrice: 2450.30,
    ltp: 2678.45,
    investedValue: 122515,
    currentValue: 133922.50,
    pnl: 11407.50,
    pnlPercent: 9.31,
    dayChange: 45.20,
    dayChangePercent: 1.72
  },
  {
    id: '2',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    quantity: 25,
    avgPrice: 3890.80,
    ltp: 4156.25,
    investedValue: 97270,
    currentValue: 103906.25,
    pnl: 6636.25,
    pnlPercent: 6.82,
    dayChange: -28.75,
    dayChangePercent: -0.69
  },
  {
    id: '3',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    quantity: 75,
    avgPrice: 1689.45,
    ltp: 1734.80,
    investedValue: 126708.75,
    currentValue: 130110,
    pnl: 3401.25,
    pnlPercent: 2.68,
    dayChange: 12.35,
    dayChangePercent: 0.72
  },
  {
    id: '4',
    symbol: 'INFY',
    name: 'Infosys Limited',
    quantity: 40,
    avgPrice: 1456.20,
    ltp: 1523.90,
    investedValue: 58248,
    currentValue: 60956,
    pnl: 2708,
    pnlPercent: 4.65,
    dayChange: -8.10,
    dayChangePercent: -0.53
  },
  {
    id: '5',
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    quantity: 60,
    avgPrice: 1234.75,
    ltp: 1189.30,
    investedValue: 74085,
    currentValue: 71358,
    pnl: -2727,
    pnlPercent: -3.68,
    dayChange: -15.45,
    dayChangePercent: -1.28
  }
];

// Sample options positions data
const optionsPositions = [
  {
    id: '1',
    strategy: 'Iron Condor',
    underlying: 'NIFTY',
    strikes: [24000, 24200, 24800, 25000],
    expiry: '21 Nov 24',
    quantity: 50,
    premium: 156.80,
    ltp: 143.20,
    pnl: -680.00,
    pnlPercent: -8.67,
    type: 'combination' as const
  },
  {
    id: '2',
    strategy: 'Straddle',
    underlying: 'BANKNIFTY',
    strikes: [46500],
    expiry: '21 Nov 24',
    quantity: 25,
    premium: 284.50,
    ltp: 312.20,
    pnl: 692.50,
    pnlPercent: 9.73,
    type: 'combination' as const
  }
];

// Sample transaction history
const transactions = [
  {
    id: '1',
    date: '2024-11-20',
    time: '14:30:25',
    symbol: 'RELIANCE',
    type: 'BUY' as const,
    quantity: 10,
    price: 2678.45,
    amount: 26784.50,
    charges: 45.30
  },
  {
    id: '2',
    date: '2024-11-20',
    time: '11:15:42',
    symbol: 'TCS',
    type: 'SELL' as const,
    quantity: 5,
    price: 4156.25,
    amount: 20781.25,
    charges: 38.60
  },
  {
    id: '3',
    date: '2024-11-19',
    time: '15:45:10',
    symbol: 'HDFCBANK',
    type: 'BUY' as const,
    quantity: 25,
    price: 1734.80,
    amount: 43370.00,
    charges: 52.40
  }
];

export default function Portfolio() {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchPortfolioData(user.id);
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchPortfolioData(session.user.id);
        } else {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Set up price update intervals
  useEffect(() => {
    if (positions && positions.length > 0) {
      // Update prices immediately
      updatePositionPrices();
      
      // Set up interval for price updates every 30 seconds
      const priceUpdateInterval = setInterval(updatePositionPrices, 30000);
      
      return () => clearInterval(priceUpdateInterval);
    }
  }, [positions?.length]);

  const fetchPortfolioData = async (userId: string) => {
    try {
      setLoading(true);

      // Fetch portfolio - get the most recent one for this user
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (portfolioError) {
        console.error('Portfolio fetch error:', portfolioError);
        setLoading(false);
        return;
      }

      if (!portfolioData) {
        console.log('No portfolio found for user');
        setLoading(false);
        return;
      }

      setPortfolio(portfolioData);

      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('portfolio_id', portfolioData.id)
        .gt('quantity', 0);

      if (!positionsError) {
        setPositions(positionsData || []);
      }

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('portfolio_id', portfolioData.id)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (!transactionsError) {
        setTransactions(transactionsData || []);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time price updates for positions  
  const updatePositionPrices = async () => {
    if (!positions || positions.length === 0) return;
    
    try {
      const updatedPositions = await Promise.all(
        positions.map(async (position) => {
          try {
            // Try to get real-time price, fallback to current price
            const response = await fetch(`http://localhost:5000/api/realtime/${position.symbol}.NS`).catch(() => null);
            
            if (response) {
              const data = await response.json();
              if (data.success) {
                const updatedPosition = {
                  ...position,
                  current_price: data.data.price
                };
                
                // Update position in database
                await supabase
                  .from('positions')
                  .update({ current_price: data.data.price })
                  .eq('id', position.id);
                  
                return updatedPosition;
              }
            }
            
            // If API fails, slightly randomize price for simulation
            const priceVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
            const newPrice = Number(position.current_price) * (1 + priceVariation);
            
            const updatedPosition = {
              ...position,
              current_price: newPrice
            };
            
            await supabase
              .from('positions')
              .update({ current_price: newPrice })
              .eq('id', position.id);
              
            return updatedPosition;
          } catch (error) {
            console.error(`Error updating price for ${position.symbol}:`, error);
            return position;
          }
        })
      );
      
      setPositions(updatedPositions);
      
      // Recalculate portfolio total value
      if (portfolio) {
        const totalPositionValue = updatedPositions.reduce((total, pos) => {
          return total + (Number(pos.current_price) * Number(pos.quantity));
        }, 0);
        
        const newTotalValue = Number(portfolio.cash_balance) + totalPositionValue;
        
        await supabase
          .from('portfolios')
          .update({ total_value: newTotalValue })
          .eq('id', portfolio.id);
          
        setPortfolio({ ...portfolio, total_value: newTotalValue });
      }
    } catch (error) {
      console.error('Error updating position prices:', error);
    }
  };

  // Convert database positions to UI format
  const convertedPositions = positions.map(pos => ({
    id: pos.id,
    symbol: pos.symbol,
    name: pos.symbol,
    quantity: pos.quantity,
    avgPrice: pos.avg_price,
    ltp: pos.current_price,
    investedValue: pos.avg_price * pos.quantity,
    currentValue: pos.current_price * pos.quantity,
    pnl: (pos.current_price - pos.avg_price) * pos.quantity,
    pnlPercent: ((pos.current_price - pos.avg_price) / pos.avg_price) * 100,
    dayChange: 0,
    dayChangePercent: 0
  }));

  // Convert database transactions to UI format
  const convertedTransactions = transactions.map(tx => ({
    id: tx.id,
    date: new Date(tx.executed_at).toLocaleDateString(),
    time: new Date(tx.executed_at).toLocaleTimeString(),
    symbol: tx.symbol,
    type: tx.type,
    quantity: tx.quantity,
    price: tx.price,
    amount: tx.total_amount,
    charges: tx.fees
  }));

  const totalInvested = convertedPositions.reduce((sum, stock) => sum + stock.investedValue, 0);
  const totalCurrent = convertedPositions.reduce((sum, stock) => sum + stock.currentValue, 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to view your portfolio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Calculate day change (mock data for now)
  const dayChange = totalCurrent * 0.0085; // Simulated 0.85% daily change
  const dayChangePercent = 0.85;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <PortfolioSummary 
        totalInvested={totalInvested}
        totalCurrent={totalCurrent}
        totalPnL={totalPnL}
        totalPnLPercent={totalPnLPercent}
        dayChange={dayChange}
        dayChangePercent={dayChangePercent}
        holdingsCount={convertedPositions.length}
      />

      {/* Main Portfolio Tabs */}
      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Stock Holdings</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Day View
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Holdings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {convertedPositions.map((stock) => (
              <StockHoldingCard key={stock.id} stock={stock} />
            ))}
          </div>

          {/* Holdings Table */}
          <HoldingsTable holdings={convertedPositions} />
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Options Positions</h2>
            <Button variant="outline" size="sm">
              View Strategy Builder
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionsPositions.map((position) => (
              <OptionsPositionCard key={position.id} position={position} />
            ))}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No recent orders found
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <TransactionHistory transactions={convertedTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}