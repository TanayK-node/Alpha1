import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradingInterface } from '@/components/paper-trading/TradingInterface';
import { AlgorithmicTradingInterface } from '@/components/paper-trading/AlgorithmicTradingInterface';
import { PortfolioSummary } from '@/components/paper-trading/PortfolioSummary';
import { PositionsList } from '@/components/paper-trading/PositionsList';
import { TransactionHistory } from '@/components/paper-trading/TransactionHistory';
import { MarketWatch } from '@/components/paper-trading/MarketWatch';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';

export default function PaperTrading() {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access paper trading.",
          variant: "destructive"
        });
        return;
      }

      await fetchPortfolioData(user.id);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchPortfolioData(session.user.id);
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
      const { data: portfolioDataRaw, error: portfolioSelectError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (portfolioSelectError) {
        console.error('Portfolio fetch error:', portfolioSelectError);
      }

      let portfolioRow = portfolioDataRaw;
      if (!portfolioRow) {
        const { data: created, error: insertError } = await supabase
          .from('portfolios')
          .insert({ user_id: userId })
          .select('*')
          .single();
        if (insertError) {
          throw insertError;
        }
        portfolioRow = created;
      }

      const normalizedPortfolio = {
        ...portfolioRow,
        cash_balance: Number(portfolioRow.cash_balance),
        total_value: Number(portfolioRow.total_value),
      };
      setPortfolio(normalizedPortfolio);

      // Fetch positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('portfolio_id', normalizedPortfolio.id)
        .gt('quantity', 0);

      if (positionsError) {
        console.error('Positions fetch error:', positionsError);
        setPositions([]);
      } else {
        const normalizedPositions = (positionsData || []).map((p: any) => ({
          ...p,
          avg_price: Number(p.avg_price),
          current_price: Number(p.current_price),
          quantity: Number(p.quantity),
        }));
        setPositions(normalizedPositions);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('portfolio_id', normalizedPortfolio.id)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error('Transactions fetch error:', transactionsError);
        setTransactions([]);
      } else {
        const normalizedTransactions = (transactionsData || []).map((t: any) => ({
          ...t,
          price: Number(t.price),
          total_amount: Number(t.total_amount),
          fees: Number(t.fees),
          quantity: Number(t.quantity),
        }));
        setTransactions(normalizedTransactions);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleTradeExecuted = () => {
    // Refetch portfolio data after a trade
    if (user) {
      fetchPortfolioData(user.id);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to access paper trading features.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Paper Trading</h1>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <PortfolioSummary 
          portfolio={portfolio} 
          positions={positions} 
        />
      )}

      <Tabs defaultValue="trading" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="algo-trading">
            <Bot className="h-4 w-4 mr-2" />
            Algo Trading
          </TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="watchlist">Market Watch</TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TradingInterface 
                portfolio={portfolio}
                onTradeExecuted={handleTradeExecuted}
                userId={user?.id}
              />
            </div>
            <div>
              <MarketWatch />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="algo-trading">
          <AlgorithmicTradingInterface 
            portfolio={portfolio}
            userId={user?.id || ''}
            positions={positions}
          />
        </TabsContent>

        <TabsContent value="positions">
          <PositionsList positions={positions} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistory transactions={transactions} />
        </TabsContent>

        <TabsContent value="watchlist">
          <MarketWatch />
        </TabsContent>
      </Tabs>
    </div>
  );
}