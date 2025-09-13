import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MarketStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export function MarketWatch() {
  const [marketData, setMarketData] = useState<MarketStock[]>([]);
  const [topGainers, setTopGainers] = useState<MarketStock[]>([]);
  const [topLosers, setTopLosers] = useState<MarketStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarketData = async () => {
    setRefreshing(true);
    try {
      const [overviewResponse, moversResponse] = await Promise.all([
        fetch('http://localhost:5000/api/market-overview').catch(() => null),
        fetch('http://localhost:5000/api/top-movers').catch(() => null)
      ]);

      let overviewData = null;
      let moversData = null;

      if (overviewResponse) {
        overviewData = await overviewResponse.json().catch(() => null);
      }

      if (moversResponse) {
        moversData = await moversResponse.json().catch(() => null);
      }

      if (overviewData?.success) {
        setMarketData(overviewData.data);
      } else {
        // Fallback to mock data
        const mockMarketData = [
          { symbol: 'NIFTY50', name: 'NIFTY 50', price: 24123.40, change: 205.30, changePercent: 0.86, volume: 2100000000 },
          { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 51234.60, change: -215.40, changePercent: -0.42, volume: 1800000000 },
          { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2850.75, change: 12.25, changePercent: 0.43, volume: 15200000 },
          { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3420.50, change: -15.25, changePercent: -0.44, volume: 8900000 },
          { symbol: 'INFY', name: 'Infosys', price: 1456.80, change: 8.40, changePercent: 0.58, volume: 12400000 },
          { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.25, change: 12.75, changePercent: 0.77, volume: 18700000 },
          { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1089.90, change: -5.60, changePercent: -0.51, volume: 22100000 },
          { symbol: 'SBIN', name: 'State Bank of India', price: 820.45, change: 15.30, changePercent: 1.90, volume: 45600000 },
        ];
        setMarketData(mockMarketData);
      }

      if (moversData?.success) {
        setTopGainers(moversData.data.topGainers || []);
        setTopLosers(moversData.data.topLosers || []);
      } else {
        // Fallback mock data
        const mockGainers = [
          { symbol: 'ADANIGREEN', name: 'Adani Green Energy', price: 1234.50, change: 58.45, changePercent: 4.85, volume: 5600000 },
          { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 890.25, change: 29.40, changePercent: 3.42, volume: 12300000 },
          { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 6789.80, change: 194.20, changePercent: 2.95, volume: 3400000 },
        ];
        const mockLosers = [
          { symbol: 'COALINDIA', name: 'Coal India', price: 456.75, change: -15.10, changePercent: -3.21, volume: 8900000 },
          { symbol: 'NTPC', name: 'NTPC', price: 234.90, change: -6.94, changePercent: -2.87, volume: 15600000 },
          { symbol: 'ONGC', name: 'ONGC', price: 189.45, change: -4.94, changePercent: -2.54, volume: 23400000 },
        ];
        setTopGainers(mockGainers);
        setTopLosers(mockLosers);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Set fallback data on error
      const mockMarketData = [
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2850.75, change: 12.25, changePercent: 0.43, volume: 15200000 },
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3420.50, change: -15.25, changePercent: -0.44, volume: 8900000 },
        { symbol: 'INFY', name: 'Infosys', price: 1456.80, change: 8.40, changePercent: 0.58, volume: 12400000 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.25, change: 12.75, changePercent: 0.77, volume: 18700000 },
      ];
      setMarketData(mockMarketData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading market data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Market Overview
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMarketData}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {marketData.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No market data available
              </div>
            ) : (
              marketData.slice(0, 8).map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow"
              >
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                  <div className={cn(
                    "text-xs flex items-center gap-1",
                    stock.change >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {stock.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Gainers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-profit" />
            Top Gainers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topGainers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <span className="font-medium">{stock.symbol}</span>
                <div className="text-right">
                  <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                  <Badge variant="default" className="bg-profit/10 text-profit border-profit">
                    +{stock.changePercent.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Losers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-loss" />
            Top Losers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topLosers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <span className="font-medium">{stock.symbol}</span>
                <div className="text-right">
                  <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                  <Badge variant="destructive" className="bg-loss/10 text-loss border-loss">
                    {stock.changePercent.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Status */}
      <Card>
        <CardHeader>
          <CardTitle>Market Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Market:</span>
              <Badge variant="default" className="bg-profit/10 text-profit border-profit">
                Open
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Session:</span>
              <span className="text-sm">Normal</span>
            </div>
            <div className="flex justify-between">
              <span>Next Close:</span>
              <span className="text-sm">15:30 IST</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}