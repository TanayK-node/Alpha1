import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Activity, Target, RefreshCw } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PositionCard } from '@/components/dashboard/PositionCard';
import { StrategyCard } from '@/components/dashboard/StrategyCard';
import { PnLChart } from '@/components/dashboard/PnLChart';
import { OptionsChain } from '@/components/dashboard/OptionsChain';
import { TradingQuickActions } from '@/components/dashboard/TradingQuickActions';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchPortfolioData = async (userId: string) => {
    try {
      setLoading(true);

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
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (user) {
      setRefreshing(true);
      await fetchPortfolioData(user.id);
      setRefreshing(false);
    }
  };

  // Convert positions to dashboard format
  const convertedPositions = positions.map(pos => ({
    id: pos.id,
    symbol: pos.symbol,
    quantity: pos.quantity,
    avgPrice: pos.avg_price,
    currentPrice: pos.current_price,
    pnl: (pos.current_price - pos.avg_price) * pos.quantity,
    pnlPercent: ((pos.current_price - pos.avg_price) / pos.avg_price) * 100
  }));

  // Calculate metrics
  const totalInvested = positions.reduce((sum, pos) => sum + (pos.avg_price * pos.quantity), 0);
  const totalCurrent = positions.reduce((sum, pos) => sum + (pos.current_price * pos.quantity), 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const dayChange = totalCurrent * 0.0085; // Mock 0.85% daily change

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to view your dashboard.
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
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your portfolio performance and trading activities
          </p>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Portfolio Value"
          value={`₹${(Number(portfolio?.total_value) || 0).toLocaleString()}`}
          change={`₹${dayChange.toFixed(2)}`}
          changeType="profit"
          icon={DollarSign}
        />
        <MetricCard
          title="Day's P&L"
          value={`₹${dayChange.toFixed(2)}`}
          change="+0.85% today"
          changeType="profit"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total P&L"
          value={`₹${totalPnL.toFixed(2)}`}
          change={`${totalPnLPercent > 0 ? '+' : ''}${totalPnLPercent.toFixed(2)}%`}
          changeType={totalPnL >= 0 ? "profit" : "loss"}
          icon={Target}
        />
        <MetricCard
          title="Active Positions"
          value={positions.length.toString()}
          change={`${positions.length} holdings`}
          changeType="neutral"
          icon={Activity}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Chart - spans 2 columns */}
        <div className="lg:col-span-2">
          <PnLChart />
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-gradient-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Market Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>NIFTY 50</span>
                <span className="text-profit">24,123.40 (+0.85%)</span>
              </div>
              <div className="flex justify-between">
                <span>BANK NIFTY</span>
                <span className="text-loss">51,234.60 (-0.42%)</span>
              </div>
              <div className="flex justify-between">
                <span>VIX</span>
                <span className="text-neutral">14.32 (+2.15%)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Portfolio Summary</h3>
            <div className="text-2xl font-bold text-profit">₹{(Number(portfolio?.cash_balance) || 0).toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Available Cash</p>
            <div className="mt-2 text-sm">
              <div className="flex justify-between">
                <span>Invested: ₹{totalInvested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Current: ₹{totalCurrent.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Options Chain and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptionsChain />
        <TradingQuickActions />
      </div>

      {/* Active Positions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Positions</h2>
        {convertedPositions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {convertedPositions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No active positions found. Start trading to see your positions here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Strategies */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Strategies</h2>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No active strategies. Create your first strategy in the Strategy Builder.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}